"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doctorService } from "@/services/doctor.service";
import type { DoctorWithProfile, DoctorReviewWithReviewer } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  Star,
  MessageCircle,
  Award,
  MapPin,
  Clock,
  DollarSign,
  ArrowLeft,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { useToast } from "@/hooks/useToast";
import { DoctorReviews } from "./DoctorReviews";
import { WriteReviewDialog } from "./WriteReviewDialog";

interface DoctorProfileViewProps {
  doctorId: string;
}

export function DoctorProfileView({ doctorId }: DoctorProfileViewProps) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorWithProfile | null>(null);
  const [reviews, setReviews] = useState<DoctorReviewWithReviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    loadDoctor();
    loadReviews();
  }, [doctorId]);

  const loadDoctor = async () => {
    try {
      const data = await doctorService.getDoctorById(doctorId);
      setDoctor(data);
    } catch (error: any) {
      console.error('Error loading doctor:', error);
      error( error.message || 'Doctor not found');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await doctorService.getDoctorReviews(doctorId);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleMessage = async () => {
    if (!doctor) return;

    try {
      const canMessage = await doctorService.canMessageDoctor(doctorId);
      
      if (!canMessage) {
        error( 'This doctor is not accepting messages at the moment');
        return;
      }

      // Use the new messages API
      const response = await fetch('/api/messages/start-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: doctor.user_id }),
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

  const handleReviewSubmitted = () => {
    loadDoctor();
    loadReviews();
  };

  if (loading) {
    return <PageLoader message="Loading doctor profile..." />;
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Doctor Not Found
          </h2>
          <Link href="/doctors">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Doctors
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const profile = doctor.profile;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Back Button */}
        <Link href="/doctors">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Doctors
          </Button>
        </Link>

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <Avatar
              src={doctor.avatar_url || profile?.avatar_url || undefined}
              name={doctor.name}
              size="xl"
              className="flex-shrink-0"
            />

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {doctor.name}
                  </h1>
                  
                  {doctor.professional_title && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{doctor.professional_title}</span>
                    </div>
                  )}
                </div>

                {doctor.verification_status === 'verified' && (
                  <Badge variant="primary" className="flex-shrink-0">
                    <Shield className="h-4 w-4 mr-1.5" />
                    Verified
                  </Badge>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(doctor.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {doctor.rating > 0 ? doctor.rating.toFixed(1) : 'No reviews yet'}
                </span>
                {doctor.reviews_count > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    ({doctor.reviews_count} {doctor.reviews_count === 1 ? 'review' : 'reviews'})
                  </span>
                )}
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {doctor.years_of_experience && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {doctor.years_of_experience} years exp.
                    </span>
                  </div>
                )}

                {doctor.languages && doctor.languages.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {doctor.languages.join(', ')}
                    </span>
                  </div>
                )}

                {profile?.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {profile.location}
                    </span>
                  </div>
                )}

                {doctor.consultation_fee && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      ${(doctor.consultation_fee / 100).toFixed(2)}/session
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {doctor.allow_messages && (
                  <Button onClick={handleMessage}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message Doctor
                  </Button>
                )}

                <Button variant="outline" onClick={() => setShowReviewDialog(true)}>
                  <Star className="h-4 w-4 mr-2" />
                  Write Review
                  </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews {doctor.reviews_count > 0 && `(${doctor.reviews_count})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
              {/* Bio */}
              {doctor.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    About
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {doctor.bio}
                  </p>
                </div>
              )}

              {/* Specializations */}
              {doctor.specialization && doctor.specialization.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Specializations
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {doctor.specialization.map((spec, index) => (
                      <Badge key={index} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Qualifications */}
              {doctor.qualifications && doctor.qualifications.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Qualifications
                  </h3>
                  <ul className="space-y-2">
                    {doctor.qualifications.map((qual, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                        <Award className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                        <span>{qual}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Education */}
              {doctor.education && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Education
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {doctor.education}
                  </p>
                </div>
              )}

              {/* Availability Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Availability
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${doctor.accepts_new_patients ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-gray-600 dark:text-gray-400">
                    {doctor.accepts_new_patients 
                      ? 'Accepting new patients' 
                      : 'Not accepting new patients'}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <DoctorReviews reviews={reviews} doctorRating={doctor.rating} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Write Review Dialog */}
      <WriteReviewDialog
        open={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        doctorId={doctorId}
        doctorName={doctor.name}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
