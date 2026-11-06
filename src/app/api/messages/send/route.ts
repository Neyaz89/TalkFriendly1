/**
 * API Route: Send Message
 * POST /api/messages/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface SendMessagePayload {
  receiver_id: string;
  content: string;
  conversation_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessagePayload = await request.json();

    if (!body.receiver_id || !body.content) {
      return NextResponse.json(
        { error: 'receiver_id and content are required' },
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

    // Get or create conversation
    let conversationId = body.conversation_id;

    if (!conversationId) {
      // Find existing conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_1_id.eq.${user.id},participant_2_id.eq.${body.receiver_id}),and(participant_1_id.eq.${body.receiver_id},participant_2_id.eq.${user.id})`
        )
        .single();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation - normalize order
        const [participant1, participant2] = user.id < body.receiver_id 
          ? [user.id, body.receiver_id] 
          : [body.receiver_id, user.id];

        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            participant_1_id: participant1,
            participant_2_id: participant2,
          })
          .select('id')
          .single();

        if (convError) {
          throw new Error(`Failed to create conversation: ${convError.message}`);
        }

        conversationId = newConv.id;
      }
    }

    // Send the message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: body.content,
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)
      `)
      .single();

    if (msgError) {
      throw new Error(`Failed to send message: ${msgError.message}`);
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('❌ Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
