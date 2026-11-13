/**
 * API Route: Send Feedback Request
 * POST /api/messages/send-feedback-request
 * 
 * Allows listeners to request feedback from users after sessions.
 * Creates a special message with type 'feedback_request'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  SendFeedbackRequestPayload, 
  FeedbackMessagePayload,
  STANDARD_FEEDBACK_CATEGORIES 
} from '@/types/feedback.types';

export async function POST(request: NextRequest) {
  try {
    const body: SendFeedbackRequestPayload = await request.json();

    if (!body.conversation_id) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
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

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify sender is a listener
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.account_type !== 'listener') {
      return NextResponse.json(
        { error: 'Only listeners can send feedback requests' },
        { status: 403 }
      );
    }

    // Verify conversation exists and user is a participant
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, participant_1_id, participant_2_id')
      .eq('id', body.conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.participant_1_id !== user.id && conversation.participant_2_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    const receiverId = conversation.participant_1_id === user.id 
      ? conversation.participant_2_id 
      : conversation.participant_1_id;

    // If session_id is provided, verify it exists and involves both participants
    if (body.session_id) {
      const { data: session, error: sessionError } = await supabase
        .from('appointments')
        .select('id, listener_id, user_id, status')
        .eq('id', body.session_id)
        .single();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      // Verify the session involves both conversation participants
      const sessionParticipants = [session.listener_id, session.user_id];
      const conversationParticipants = [conversation.participant_1_id, conversation.participant_2_id];
      
      const validSession = sessionParticipants.every(p => conversationParticipants.includes(p));
      if (!validSession) {
        return NextResponse.json(
          { error: 'Session does not involve both conversation participants' },
          { status: 400 }
        );
      }

      // Check if session is completed
      if (session.status !== 'completed') {
        return NextResponse.json(
          { error: 'Feedback can only be requested for completed sessions' },
          { status: 400 }
        );
      }
    }

    // Use provided categories or default ones
    const categories = body.categories && body.categories.length > 0
      ? body.categories
      : STANDARD_FEEDBACK_CATEGORIES.map(cat => cat.name);

    // Calculate expiration date (default 7 days)
    const expiresInDays = body.expires_in_days || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create feedback request record
    const { data: feedbackRequest, error: fbReqError } = await supabase
      .from('feedback_requests')
      .insert({
        conversation_id: body.conversation_id,
        session_id: body.session_id,
        requested_by: user.id,
        requested_from: receiverId,
        categories,
        custom_questions: body.custom_questions || [],
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (fbReqError) {
      console.error('❌ Error creating feedback request:', fbReqError);
      throw new Error(`Failed to create feedback request: ${fbReqError.message}`);
    }

    // Create the feedback message payload
    const feedbackPayload: FeedbackMessagePayload = {
      feedback_request_id: feedbackRequest.id,
      session_id: body.session_id,
      categories,
      custom_questions: body.custom_questions,
      expires_at: expiresAt.toISOString(),
    };

    // Send the message with feedback_request type
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: body.conversation_id,
        sender_id: user.id,
        content: JSON.stringify(feedbackPayload),
        message_type: 'feedback_request',
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)
      `)
      .single();

    if (msgError) {
      console.error('❌ Error creating feedback request message:', msgError);
      throw new Error(`Failed to send feedback request: ${msgError.message}`);
    }

    // Update feedback request with message_id
    await supabase
      .from('feedback_requests')
      .update({ message_id: message.id })
      .eq('id', feedbackRequest.id);

    // Create notification for the receiver
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: receiverId,
        type: 'feedback_request',
        title: 'Feedback Request',
        message: body.session_id 
          ? 'Your listener has requested feedback about your recent session'
          : 'Your listener has requested feedback',
        action_url: `/messages/${body.conversation_id}`,
        metadata: {
          feedback_request_id: feedbackRequest.id,
          message_id: message.id,
          conversation_id: body.conversation_id,
          session_id: body.session_id,
        },
      });

    if (notifError) {
      console.warn('⚠️ Failed to create notification:', notifError);
      // Don't fail the request if notification fails
    }

    console.log('✅ Feedback request sent:', {
      messageId: message.id,
      feedbackRequestId: feedbackRequest.id,
      conversationId: body.conversation_id,
      sessionId: body.session_id,
    });

    return NextResponse.json({
      success: true,
      message,
      feedback_request: {
        id: feedbackRequest.id,
        categories,
        expires_at: expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('❌ Error sending feedback request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send feedback request' },
      { status: 500 }
    );
  }
}
