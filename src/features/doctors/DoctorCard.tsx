"use client";

import type { DoctorWithProfile } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  Shield, 
  Briefcase, 
  GraduationCap, 
  Globe,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface DoctorCardProps {
  doctor: DoctorWithProfile;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const profile = doctor.profile;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <Link href={`/doctors/${doctor.id}`}>
            <Avatar
              src={doctor.avatar_url || profile?.avatar_url || undefined}
              name={doctor.name || profile?.full_name || 'Doctor'}
              size="lg"
              className="cursor-pointer hover:ring-2 hover:ring-primary-300 transition-all flex-shrink-0"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/doctors/${doctor.id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors block truncate"
              >
                {doctor.name}
              </Link>
              
              {doctor.verification_status === 'verified' && (
                <Badge variant="primary" className="text-xs flex-shrink-0">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Professional Title */}
            {doctor.professional_title && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{doctor.professional_title}</span>
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {doctor.rating > 0 ? doctor.rating.toFixed(1) : 'New'}
                </span>
              </div>
              {doctor.reviews_count > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  ({doctor.reviews_count} {doctor.reviews_count === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Specializations */}
        {doctor.specialization && doctor.specialization.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {doctor.specialization.slice(0, 3).map((spec, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {spec}
                </Badge>
              ))}
              {doctor.specialization.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{doctor.specialization.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Bio */}
        {doctor.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
            {doctor.bio}
          </p>
        )}

        {/* Experience & Languages */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-4">
          {doctor.years_of_experience && (
            <div className="flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>{doctor.years_of_experience} years exp.</span>
            </div>
          )}
          
          {doctor.languages && doctor.languages.length > 0 && (
            <div className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              <span>{doctor.languages.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <Link href={`/doctors/${doctor.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              View Profile
            </Button>
          </Link>
          
          {doctor.allow_messages && (
            <Link href={`/chat?doctor=${doctor.id}`}>
              <Button size="sm" title="Message">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Consultation Fee */}
        {doctor.consultation_fee && (
          <div className="text-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              ${(doctor.consultation_fee / 100).toFixed(2)} per session
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
