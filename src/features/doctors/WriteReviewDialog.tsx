"use client";

import { useState } from "react";
import { doctorService } from "@/services/doctor.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface WriteReviewDialogProps {
  open: boolean;
  onClose: () => void;
  doctorId: string;
  doctorName: string;
  onReviewSubmitted: () => void;
}

export function WriteReviewDialog({
  open,
  onClose,
  doctorId,
  doctorName,
  onReviewSubmitted,
}: WriteReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('error', 'Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      await doctorService.createReview({
        doctor_id: doctorId,
        rating,
        comment: comment.trim() || undefined,
      });

      showToast('success', 'Review submitted successfully!');
      onReviewSubmitted();
      handleClose();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      showToast('error', error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Write a Review for {doctorName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              Your Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Your Review (Optional)
            </label>
            <Textarea
              placeholder="Share your experience with this doctor..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px]"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Your review will help others make informed decisions
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
