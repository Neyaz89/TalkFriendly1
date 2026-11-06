/**
 * API Route: Get User's Conversations
 * GET /api/messages/conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
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

    // Get all conversations for the user
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_1:profiles!conversations_participant_1_id_fkey(id, username, full_name, avatar_url, profession),
        participant_2:profiles!conversations_participant_2_id_fkey(id, username, full_name, avatar_url, profession)
      `)
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    // Transform conversations to include other user's info
    const conversations = (data || []).map((conv: any) => {
      const otherUser = conv.participant_1_id === user.id ? conv.participant_2 : conv.participant_1;
      const unreadCount = conv.participant_1_id === user.id ? conv.participant_1_unread_count : conv.participant_2_unread_count;

      return {
        id: conv.id,
        other_participant: otherUser,
        last_message: conv.last_message_preview,
        last_message_at: conv.last_message_at,
        unread_count: unreadCount,
        created_at: conv.created_at,
      };
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('❌ Error fetching conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
