"use client";

import { useState, useEffect } from "react";
import { connectionService } from "@/services/connection.service";
import { createClient } from "@/lib/supabase/client";
import type { ConnectionWithProfiles } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, UserMinus, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/common/LoadingSpinner";

export function PeopleTab() {
  const { user } = useAuth();
  const router = useRouter();
  const [connections, setConnections] = useState<ConnectionWithProfiles[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<ConnectionWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { success, error } = useToast();

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    filterConnections();
  }, [searchTerm, connections]);

  const loadConnections = async () => {
    try {
      const data = await connectionService.getConnections();
      
      // Filter out doctors - only show normal users/listeners
      const peopleConnections = data.connections.filter(conn => {
        const otherUser = conn.connected_user;
        return otherUser?.account_type !== 'doctor';
      });
      
      setConnections(peopleConnections as any);
      setFilteredConnections(peopleConnections as any);
    } catch (err) {
      console.error('Error loading connections:', err);
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
      const otherUser = conn.connected_user;
      
      const name = (otherUser?.full_name || otherUser?.username || '').toLowerCase();
      const bio = (otherUser?.bio || '').toLowerCase();
      
      return name.includes(term) || bio.includes(term);
    });

    setFilteredConnections(filtered);
  };

  const handleMessage = async (otherUserId: string) => {
    try {
      // Use the new messages API
      const response = await fetch('/api/messages/start-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: otherUserId }),
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

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;

    try {
      await connectionService.removeConnection(connectionId);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      success( 'Connection removed');
    } catch (error: any) {
      console.error('Error removing connection:', error);
      error( error.message || 'Failed to remove connection');
    }
  };

  if (loading) {
    return <PageLoader message="Loading your connections..." />;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search connections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Connections List */}
      {filteredConnections.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No connections found' : 'No connections yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm 
              ? 'Try a different search term' 
              : 'Start connecting with people from the Feed'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredConnections.map(connection => {
            const otherUser = connection.user_1_profile?.id === user?.id 
              ? connection.user_2_profile 
              : connection.user_1_profile;

            if (!otherUser) return null;

            return (
              <div
                key={connection.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col items-center text-center">
                  <Link href={`/profile/${otherUser.id}`}>
                    <Avatar
                      src={otherUser.avatar_url || undefined}
                      name={otherUser.full_name || otherUser.username}
                      size="lg"
                      className="cursor-pointer hover:ring-2 hover:ring-primary-300 transition-all mb-3"
                    />
                  </Link>

                  <Link
                    href={`/profile/${otherUser.id}`}
                    className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-1"
                  >
                    {otherUser.full_name || otherUser.username}
                  </Link>

                  {otherUser.account_type === 'listener' && (
                    <Badge variant="secondary" className="text-xs mb-2">
                      Listener
                    </Badge>
                  )}

                  {otherUser.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {otherUser.bio}
                    </p>
                  )}

                  {otherUser.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mb-3">
                      <MapPin className="h-3 w-3" />
                      <span>{otherUser.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full mt-auto">
                    <Button
                      size="sm"
                      onClick={() => handleMessage(otherUser.id)}
                      className="flex-1"
                    >
                      <MessageCircle className="h-4 w-4 mr-1.5" />
                      Message
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveConnection(connection.id)}
                      title="Remove connection"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
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
