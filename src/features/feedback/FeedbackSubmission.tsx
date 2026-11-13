"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FeedbackMessagePayload,
  RatingCategory,
  RatingValue,
  STANDARD_FEEDBACK_CATEGORIES,
} from "@/types/feedback.types";
import { Star, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface FeedbackSubmissionProps {
  feedbackPayload: FeedbackMessagePayload;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function FeedbackSubmission({
  feedbackPayload,
  onSubmitSuccess,
  onCancel,
}: FeedbackSubmissionProps) {
  const [overallRating, setOverallRating] = useState<RatingValue | null>(null);
  const [categoryRatings, setCategoryRatings] = useState<RatingCategory[]>(
    feedbackPayload.categories.map(cat => {
      const standardCat = STANDARD_FEEDBACK_CATEGORIES.find(c => c.name === cat);
      return {
        name: cat,
        label: standardCat?.label || cat,
        description: standardCat?.description,
        rating: null,
      };
    })
  );
  const [customResponses, setCustomResponses] = useState<
    { question: string; answer: string }[]
  >(
    (feedbackPayload.custom_questions || []).map(q => ({
      question: q,
      answer: '',
    }))
  );
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  const handleOverallRatingClick = (rating: RatingValue) => {
    setOverallRating(rating);
  };

  const handleCategoryRatingClick = (categoryName: string, rating: RatingValue) => {
    setCategoryRatings(prev =>
      prev.map(cat =>
        cat.name === categoryName ? { ...cat, rating } : cat
      )
    );
  };

  const handleCustomResponseChange = (index: number, answer: string) => {
    setCustomResponses(prev =>
      prev.map((resp, i) => (i === index ? { ...resp, answer } : resp))
    );
  };

  const validateAndSubmit = async () => {
    if (!overallRating) {
      showError('Please provide an overall rating');
      return;
    }

    // Validate all category ratings are provided
    for (const category of categoryRatings) {
      if (!category.rating) {
        showError(`Please rate: ${category.label}`);
        return;
      }
    }

    // Validate custom questions if required
    for (const response of customResponses) {
      if (!response.answer.trim()) {
        showError(`Please answer: ${response.question}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_request_id: feedbackPayload.feedback_request_id,
          overall_rating: overallRating,
          category_ratings: categoryRatings,
          custom_responses: customResponses.length > 0 ? customResponses : undefined,
          comment: comment.trim() || undefined,
          is_anonymous: isAnonymous,
          is_public: isPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      success('Feedback submitted successfully');
      onSubmitSuccess?.();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      showError(error.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (
    currentRating: RatingValue | null,
    onRatingClick: (rating: RatingValue) => void
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(rating => (
          <button
            key={rating}
            type="button"
            onClick={() => onRatingClick(rating as RatingValue)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={`h-8 w-8 ${
                currentRating && rating <= currentRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {currentRating && (
          <span className="ml-2 text-sm font-medium">{currentRating}/5</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <Card className="p-6">
        <div>
          <Label className="text-lg font-semibold mb-3 block">
            Overall Experience *
          </Label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            How would you rate your overall experience?
          </p>
          {renderStars(overallRating, handleOverallRatingClick)}
        </div>
      </Card>

      {/* Category Ratings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Rate Specific Areas *</h3>
        <div className="space-y-6">
          {categoryRatings.map(category => (
            <div key={category.name}>
              <Label className="text-base font-medium mb-1 block">
                {category.label}
              </Label>
              {category.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {category.description}
                </p>
              )}
              {renderStars(category.rating, (rating) =>
                handleCategoryRatingClick(category.name, rating)
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Custom Questions */}
      {customResponses.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Additional Questions *</h3>
          <div className="space-y-4">
            {customResponses.map((response, index) => (
              <div key={index}>
                <Label className="mb-2 block">{response.question}</Label>
                <Textarea
                  value={response.answer}
                  onChange={(e) => handleCustomResponseChange(index, e.target.value)}
                  placeholder="Your answer..."
                  rows={3}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Comment */}
      <Card className="p-6">
        <div>
          <Label className="text-lg font-semibold mb-2 block">
            Additional Comments (Optional)
          </Label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Share any additional thoughts or suggestions
          </p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Your comments..."
            rows={4}
          />
        </div>
      </Card>

      {/* Privacy Options */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            />
            <div>
              <Label htmlFor="anonymous" className="cursor-pointer font-medium">
                Submit anonymously
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your name will not be shown with this feedback
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked as boolean)}
            />
            <div>
              <Label htmlFor="public" className="cursor-pointer font-medium">
                Display on listener's public profile
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Help others by sharing your experience publicly
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button onClick={validateAndSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Feedback
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
