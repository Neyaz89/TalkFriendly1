/**
 * API Route: Submit Feedback
 * POST /api/feedback/submit
 * 
 * Allows users to submit feedback for listeners after sessions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SubmitFeedbackPayload } from '@/types/feedback.types';

export async function POST(request: NextRequest) {
  try {
    const body: SubmitFeedbackPayload = await request.json();

    if (!body.feedback_request_id || !body.overall_rating || !body.category_ratings) {
      return NextResponse.json(
        { error: 'feedback_request_id, overall_rating, and category_ratings are required' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (body.overall_rating < 1 || body.overall_rating > 5) {
      return NextResponse.json(
        { error: 'overall_rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate category ratings
    for (const category of body.category_ratings) {
      if (category.rating && (category.rating < 1 || category.rating > 5)) {
        return NextResponse.json(
          { error: 'All category ratings must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch the feedback request
    const { data: feedbackRequest, error: reqError } = await supabase
      .from('feedback_requests')
      .select('*')
      .eq('id', body.feedback_request_id)
      .single();

    if (reqError || !feedbackRequest) {
      return NextResponse.json(
        { error: 'Feedback request not found' },
        { status: 404 }
      );
    }

    // Verify user is the intended recipient
    if (feedbackRequest.requested_from !== user.id) {
      return NextResponse.json(
        { error: 'This feedback request is not for you' },
        { status: 403 }
      );
    }

    // Check if request is expired
    if (feedbackRequest.expires_at && new Date(feedbackRequest.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This feedback request has expired' },
        { status: 400 }
      );
    }

    // Check if already submitted
    if (feedbackRequest.status === 'submitted') {
      return NextResponse.json(
        { error: 'You have already submitted feedback for this request' },
        { status: 400 }
      );
    }

    // Create feedback response
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback_responses')
      .insert({
        feedback_request_id: body.feedback_request_id,
        session_id: feedbackRequest.session_id,
        listener_id: feedbackRequest.requested_by,
        user_id: user.id,
        overall_rating: body.overall_rating,
        category_ratings: body.category_ratings,
        custom_responses: body.custom_responses,
        comment: body.comment,
        is_anonymous: body.is_anonymous ?? false,
        is_public: body.is_public ?? false,
      })
      .select('*')
      .single();

    if (feedbackError) {
      console.error('❌ Error creating feedback:', feedbackError);
      throw new Error(`Failed to submit feedback: ${feedbackError.message}`);
    }

    // Update feedback request status
    await supabase
      .from('feedback_requests')
      .update({ status: 'submitted' })
      .eq('id', body.feedback_request_id);

    // Update the message content to include feedback_response_id
    if (feedbackRequest.message_id) {
      const { data: message } = await supabase
        .from('messages')
        .select('content')
        .eq('id', feedbackRequest.message_id)
        .single();

      if (message) {
        const messageContent = JSON.parse(message.content || '{}');
        messageContent.feedback_response_id = feedback.id;
        
        await supabase
          .from('messages')
          .update({ content: JSON.stringify(messageContent) })
          .eq('id', feedbackRequest.message_id);
      }
    }

    // Update listener's rating statistics
    await updateListenerRating(supabase, feedbackRequest.requested_by);

    // Create notification for listener
    await supabase
      .from('notifications')
      .insert({
        user_id: feedbackRequest.requested_by,
        type: 'feedback_received',
        title: 'New Feedback Received',
        message: body.is_anonymous 
          ? 'You received anonymous feedback'
          : 'You received feedback from a client',
        action_url: `/listener/feedback/${feedback.id}`,
        metadata: {
          feedback_response_id: feedback.id,
          feedback_request_id: body.feedback_request_id,
          overall_rating: body.overall_rating,
        },
      });

    console.log('✅ Feedback submitted:', {
      feedbackId: feedback.id,
      listenerId: feedbackRequest.requested_by,
      rating: body.overall_rating,
    });

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error: any) {
    console.error('❌ Error submitting feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

/**
 * Updates listener's aggregated rating statistics
 */
async function updateListenerRating(supabase: any, listenerId: string) {
  try {
    // Get all public feedback for this listener
    const { data: feedbacks } = await supabase
      .from('feedback_responses')
      .select('overall_rating')
      .eq('listener_id', listenerId)
      .eq('is_public', true);

    if (!feedbacks || feedbacks.length === 0) return;

    // Calculate average rating
    const totalRating = feedbacks.reduce((sum: number, f: any) => sum + f.overall_rating, 0);
    const averageRating = totalRating / feedbacks.length;
    const reviewsCount = feedbacks.length;

    // Update listener profile
    await supabase
      .from('profiles')
      .update({
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviews_count: reviewsCount,
      })
      .eq('id', listenerId);

    console.log('✅ Updated listener rating:', {
      listenerId,
      rating: averageRating,
      reviewsCount,
    });
  } catch (error) {
    console.error('❌ Error updating listener rating:', error);
    // Don't fail the main request if rating update fails
  }
}
