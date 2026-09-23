import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/listeners/check-availability
 * Check if user can book a listener session based on subscription tier and usage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, listener_sessions_used, listener_sessions_reset_date')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Premium users have unlimited sessions
    if (profile.subscription_tier === 'premium') {
      return NextResponse.json({
        canBook: true,
        tier: 'premium',
        sessionsUsed: 0,
        sessionsRemaining: 'unlimited',
        resetDate: null,
      });
    }

    // Check if reset date has passed (more than 1 month ago)
    const resetDate = new Date(profile.listener_sessions_reset_date);
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    let sessionsUsed = profile.listener_sessions_used || 0;

    // Reset if needed
    if (resetDate < oneMonthAgo) {
      const { error: resetError } = await supabase
        .from('profiles')
        .update({
          listener_sessions_used: 0,
          listener_sessions_reset_date: now.toISOString(),
        })
        .eq('id', user.id);

      if (resetError) {
        console.error('Error resetting session count:', resetError);
      } else {
        sessionsUsed = 0;
      }
    }

    // Free tier limit (from environment variable)
    const freeLimit = parseInt(process.env.NEXT_PUBLIC_FREE_LISTENER_SESSIONS_PER_MONTH || '2', 10);
    const canBook = sessionsUsed < freeLimit;
    const sessionsRemaining = Math.max(0, freeLimit - sessionsUsed);

    // Calculate next reset date
    const nextReset = new Date(resetDate);
    nextReset.setMonth(nextReset.getMonth() + 1);

    return NextResponse.json({
      canBook,
      tier: profile.subscription_tier,
      sessionsUsed,
      sessionsRemaining,
      sessionsLimit: freeLimit,
      resetDate: nextReset.toISOString(),
    });

  } catch (error) {
    console.error('Error checking session availability:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
