import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/listeners/book
 * Book a listener session and increment usage counter
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

    // Parse request body
    const body = await request.json();
    const { listenerId, sessionDate, sessionDuration, notes } = body;

    if (!listenerId || !sessionDate || !sessionDuration) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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

    // Check if reset date has passed
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

    // Check if user can book (for non-premium users)
    if (profile.subscription_tier !== 'premium') {
      const freeLimit = parseInt(process.env.NEXT_PUBLIC_FREE_LISTENER_SESSIONS_PER_MONTH || '2', 10);
      
      if (sessionsUsed >= freeLimit) {
        return NextResponse.json(
          { 
            error: "Session limit reached",
            message: `You've used all ${freeLimit} free sessions this month. Upgrade to Premium for unlimited sessions.`,
            sessionsUsed,
            sessionsLimit: freeLimit,
          },
          { status: 403 }
        );
      }
    }

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('listener_bookings')
      .insert({
        user_id: user.id,
        listener_id: listenerId,
        session_date: sessionDate,
        session_duration: sessionDuration,
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    // Increment session usage for non-premium users
    if (profile.subscription_tier !== 'premium') {
      const { error: incrementError } = await supabase
        .from('profiles')
        .update({
          listener_sessions_used: sessionsUsed + 1,
        })
        .eq('id', user.id);

      if (incrementError) {
        console.error('Error incrementing session usage:', incrementError);
        // Don't fail the booking, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      booking,
      sessionsUsed: profile.subscription_tier === 'premium' ? 0 : sessionsUsed + 1,
      tier: profile.subscription_tier,
    });

  } catch (error) {
    console.error('Error booking session:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
