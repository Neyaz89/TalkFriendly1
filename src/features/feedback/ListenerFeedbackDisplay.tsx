"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Star, Loader2, TrendingUp, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FeedbackStats {
  total: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
  category_averages: Record<string, number>;
}

interface ListenerFeedbackDisplayProps {
  listenerId: string;
  showPrivate?: boolean;
}

export function ListenerFeedbackDisplay({
  listenerId,
  showPrivate = false,
}: ListenerFeedbackDisplayProps) {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, [listenerId, showPrivate]);

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/feedback/list?listener_id=${listenerId}&include_private=${showPrivate}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch feedback');
      }

      setFeedbacks(data.feedbacks || []);
      setStats(data.stats || null);
    } catch (error: any) {
      console.error('Error fetching feedback:', error);
      setError(error.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingBar = (rating: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium w-12">{rating} star</span>
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
          {count}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">No feedback yet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Be the first to leave feedback for this listener
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Rating */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <h3 className="font-semibold">Average Rating</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stats.average_rating}</span>
              <span className="text-gray-600 dark:text-gray-400">/ 5</span>
            </div>
            <div className="mt-2">
              {renderStars(Math.round(stats.average_rating))}
            </div>
          </div>

          {/* Total Reviews */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold">Total Reviews</h3>
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              From verified sessions
            </p>
          </div>

          {/* Category Breakdown */}
          {Object.keys(stats.category_averages).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Top Rated</h3>
              </div>
              <div className="space-y-1">
                {Object.entries(stats.category_averages)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([category, avg]) => (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{category}</span>
                      <span className="font-medium">{avg}/5</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-3">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating =>
              renderRatingBar(
                rating,
                stats.rating_distribution[rating] || 0,
                stats.total
              )
            )}
          </div>
        </div>
      </Card>

      {/* Individual Feedback */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Client Feedback</h3>
        <div className="space-y-4">
          {feedbacks.map(feedback => (
            <Card key={feedback.id} className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {feedback.user && !feedback.is_anonymous ? (
                    <>
                      <Avatar
                        src={feedback.user.avatar_url}
                        name={feedback.user.full_name || feedback.user.username}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">
                          {feedback.user.full_name || feedback.user.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(feedback.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">Anonymous</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(feedback.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {renderStars(feedback.overall_rating)}
                  </div>
                  <p className="text-sm font-medium">{feedback.overall_rating}/5</p>
                </div>
              </div>

              {/* Category Ratings */}
              {feedback.category_ratings && feedback.category_ratings.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    {feedback.category_ratings.map((cat: any) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{cat.label || cat.name}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{cat.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment */}
              {feedback.comment && (
                <div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    "{feedback.comment}"
                  </p>
                </div>
              )}

              {/* Custom Responses */}
              {feedback.custom_responses && feedback.custom_responses.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                  {feedback.custom_responses.map((resp: any, index: number) => (
                    <div key={index}>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {resp.question}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {resp.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
