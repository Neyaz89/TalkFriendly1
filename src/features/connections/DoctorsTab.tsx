"use client";

import { useState, useEffect } from "react";
import { connectionService } from "@/services/connection.service";
import { doctorService } from "@/services/doctor.service";
import type { ConnectionWithProfiles } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  Search, 
  Star, 
  Shield, 
  Briefcase,
  GraduationCap,
  MapPin,
  ExternalLink,
  Stethoscope
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/common/LoadingSpinner";

export function DoctorsTab() {
  const { user } = useAuth();
  const router = useRouter();
  const [connections, setConnections] = useState<ConnectionWithProfiles[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<ConnectionWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { success, error } = useToast();

  useEffect(() => {
    loadDoctorConnections();
  }, []);

  useEffect(() => {
    filterConnections();
  }, [searchTerm, connections]);

  const loadDoctorConnections = async () => {
    try {
      const data = await connectionService.getConnections();
      
      // Filter to only show doctors
      const doctorConnections = data.connections.filter(conn => {
        const otherUser = conn.user_id === user?.id 
          ? conn.connected_user 
          : conn.connected_user;
        return otherUser?.account_type === 'doctor';
      });
      
      setConnections(doctorConnections as any);
      setFilteredConnections(doctorConnections as any);
    } catch (err) {
      console.error('Error loading doctor connections:', err);
      error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const filterConnections = () => {
    if (!searchTerm.trim()) {
      setFilteredConnections(connections);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = connections.filter(conn => {
      const doctor = conn.connected_user;
      
      const name = (doctor?.full_name || doctor?.username || '').toLowerCase();
      const bio = (doctor?.bio || '').toLowerCase();
      
      return name.includes(term) || bio.includes(term);
    });

    setFilteredConnections(filtered);
  };

  const handleMessage = async (doctorId: string) => {
    try {
      // Check if doctor allows messages
      const canMessage = await doctorService.canMessageDoctor(doctorId);
      
      if (!canMessage) {
        error( 'This doctor is not accepting messages at the moment');
        return;
      }

      // Use the new messages API
      const response = await fetch('/api/messages/start-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: doctorId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      router.push(`/messages?conversation=${data.conversation.id}`);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      error( error.message || 'Failed to start conversation');
    }
  };

  if (loading) {
    return <PageLoader message="Loading your doctor connections..." />;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search doctors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Doctors List */}
      {filteredConnections.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Stethoscope className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No doctors found' : 'No doctor connections yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm 
              ? 'Try a different search term' 
              : 'Discover and connect with verified mental health professionals'}
          </p>
          {!searchTerm && (
            <Link href="/doctors">
              <Button>
                <ExternalLink className="h-4 w-4 mr-2" />
                Discover Doctors
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredConnections.map(connection => {
            const doctor = connection.user_1_profile?.id === user?.id 
              ? connection.user_2_profile 
              : connection.user_1_profile;

            if (!doctor) return null;

            return (
              <div
                key={connection.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <Link href={`/doctors/${doctor.id}`}>
                    <Avatar
                      src={doctor.avatar_url || undefined}
                      name={doctor.full_name || doctor.username}
                      size="lg"
                      className="cursor-pointer hover:ring-2 hover:ring-primary-300 transition-all flex-shrink-0"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/doctors/${doctor.id}`}
                          className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors block truncate"
                        >
                          {doctor.full_name || doctor.username}
                        </Link>
                      </div>
                      
                      {doctor.is_verified && (
                        <Badge variant="primary" className="text-xs flex-shrink-0 ml-2">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    {/* Professional Title */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <Briefcase className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Clinical Psychologist</span>
                    </div>

                    {/* Bio */}
                    {doctor.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {doctor.bio}
                      </p>
                    )}

                    {/* Location */}
                    {doctor.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mb-3">
                        <MapPin className="h-3 w-3" />
                        <span>{doctor.location}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleMessage(doctor.id)}
                        className="flex-1"
                      >
                        <MessageCircle className="h-4 w-4 mr-1.5" />
                        Message
                      </Button>
                      <Link href={`/doctors/${doctor.id}`}>
                        <Button size="sm" variant="outline">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
