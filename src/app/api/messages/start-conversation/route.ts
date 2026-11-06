/**
 * API Route: Start/Get Conversation with User
 * POST /api/messages/start-conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const otherUserId = body.user_id;

    if (!otherUserId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Create Supabase client for API route
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

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_1:profiles!conversations_participant_1_id_fkey(id, username, full_name, avatar_url, profession),
        participant_2:profiles!conversations_participant_2_id_fkey(id, username, full_name, avatar_url, profession)
      `)
      .or(
        `and(participant_1_id.eq.${user.id},participant_2_id.eq.${otherUserId}),and(participant_1_id.eq.${otherUserId},participant_2_id.eq.${user.id})`
      )
      .single();

    if (existingConv) {
      // Return existing conversation
      const otherUser = existingConv.participant_1_id === user.id ? existingConv.participant_2 : existingConv.participant_1;
      const unreadCount = existingConv.participant_1_id === user.id ? existingConv.participant_1_unread_count : existingConv.participant_2_unread_count;

      return NextResponse.json({
        success: true,
        conversation: {
          id: existingConv.id,
          other_participant: otherUser,
          last_message: existingConv.last_message_preview,
          last_message_at: existingConv.last_message_at,
          unread_count: unreadCount,
          created_at: existingConv.created_at,
        },
      });
    }

    // Create new conversation - normalize order
    const [participant1, participant2] = user.id < otherUserId 
      ? [user.id, otherUserId] 
      : [otherUserId, user.id];

    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        participant_1_id: participant1,
        participant_2_id: participant2,
      })
      .select(`
        *,
        participant_1:profiles!conversations_participant_1_id_fkey(id, username, full_name, avatar_url, profession),
        participant_2:profiles!conversations_participant_2_id_fkey(id, username, full_name, avatar_url, profession)
      `)
      .single();

    if (convError) {
      throw new Error(`Failed to create conversation: ${convError.message}`);
    }

    const otherUser = newConv.participant_1_id === user.id ? newConv.participant_2 : newConv.participant_1;

    return NextResponse.json({
      success: true,
      conversation: {
        id: newConv.id,
        other_participant: otherUser,
        last_message: null,
        last_message_at: null,
        unread_count: 0,
        created_at: newConv.created_at,
      },
    });
  } catch (error: any) {
    console.error('❌ Error starting conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start conversation' },
      { status: 500 }
    );
  }
}
