/**
 * API Route: List Feedback
 * GET /api/feedback/list?listener_id=xxx&include_private=false
 * 
 * Returns feedback for a listener.
 * Public feedback visible to all, private only to listener.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listenerId = searchParams.get('listener_id');
    const includePrivate = searchParams.get('include_private') === 'true';

    if (!listenerId) {
      return NextResponse.json(
        { error: 'listener_id is required' },
        { status: 400 }
      );
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

    // Build query
    let query = supabase
      .from('feedback_responses')
      .select(`
        *,
        user:profiles!feedback_responses_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url
        ),
        session:appointments(
          id,
          scheduled_start,
          scheduled_end
        )
      `)
      .eq('listener_id', listenerId);

    // If not the listener, only show public feedback
    if (!user || user.id !== listenerId || !includePrivate) {
      query = query.eq('is_public', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data: feedbacks, error: feedbackError } = await query;

    if (feedbackError) {
      console.error('❌ Error fetching feedback:', feedbackError);
      throw new Error(`Failed to fetch feedback: ${feedbackError.message}`);
    }

    // Filter out user info for anonymous feedback
    const sanitizedFeedbacks = (feedbacks || []).map(feedback => {
      if (feedback.is_anonymous && (!user || user.id !== listenerId)) {
        return {
          ...feedback,
          user: null,
          user_id: null,
        };
      }
      return feedback;
    });

    // Calculate statistics
    const stats = calculateFeedbackStats(feedbacks || []);

    return NextResponse.json({
      success: true,
      feedbacks: sanitizedFeedbacks,
      stats,
    });
  } catch (error: any) {
    console.error('❌ Error listing feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list feedback' },
      { status: 500 }
    );
  }
}

function calculateFeedbackStats(feedbacks: any[]) {
  if (feedbacks.length === 0) {
    return {
      total: 0,
      average_rating: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      category_averages: {},
    };
  }

  // Overall statistics
  const total = feedbacks.length;
  const totalRating = feedbacks.reduce((sum, f) => sum + f.overall_rating, 0);
  const averageRating = totalRating / total;

  // Rating distribution
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbacks.forEach(f => {
    ratingDistribution[f.overall_rating as keyof typeof ratingDistribution]++;
  });

  // Category averages
  const categoryTotals: Record<string, { sum: number; count: number }> = {};
  feedbacks.forEach(feedback => {
    if (feedback.category_ratings) {
      feedback.category_ratings.forEach((cat: any) => {
        if (cat.rating) {
          if (!categoryTotals[cat.name]) {
            categoryTotals[cat.name] = { sum: 0, count: 0 };
          }
          categoryTotals[cat.name].sum += cat.rating;
          categoryTotals[cat.name].count++;
        }
      });
    }
  });

  const categoryAverages: Record<string, number> = {};
  Object.keys(categoryTotals).forEach(category => {
    const { sum, count } = categoryTotals[category];
    categoryAverages[category] = Math.round((sum / count) * 10) / 10;
  });

  return {
    total,
    average_rating: Math.round(averageRating * 10) / 10,
    rating_distribution: ratingDistribution,
    category_averages: categoryAverages,
  };
}
