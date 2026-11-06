"use client";

import type { DoctorReviewWithReviewer } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Star, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DoctorReviewsProps {
  reviews: DoctorReviewWithReviewer[];
  doctorRating: number;
}

export function DoctorReviews({ reviews, doctorRating }: DoctorReviewsProps) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Reviews Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Be the first to review this doctor
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
              {doctorRating > 0 ? doctorRating.toFixed(1) : 'N/A'}
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(doctorRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = reviews.filter(r => r.rating === rating).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                    {rating} <Star className="h-3 w-3 inline fill-current" />
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map(review => {
          const reviewer = review.reviewer;
          if (!reviewer) return null;

          return (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start gap-4">
                <Avatar
                  src={reviewer.avatar_url || undefined}
                  name={reviewer.full_name || reviewer.username}
                  size="md"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {reviewer.full_name || reviewer.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  )}

                  {review.is_verified_booking && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Verified booking
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
