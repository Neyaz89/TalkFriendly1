/**
 * API Route: Send Support Form Request
 * POST /api/messages/send-form-request
 * 
 * Allows listeners to send support forms to users in their conversations.
 * Creates a special message with type 'support_form_request'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SendFormRequestPayload, SupportFormMessagePayload } from '@/types/support-form.types';

export async function POST(request: NextRequest) {
  try {
    const body: SendFormRequestPayload = await request.json();

    if (!body.conversation_id || !body.form_id) {
      return NextResponse.json(
        { error: 'conversation_id and form_id are required' },
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
        { error: 'Only listeners can send support form requests' },
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

    // Fetch the form details
    const { data: form, error: formError } = await supabase
      .from('support_forms')
      .select('id, title, description, fields, created_by')
      .eq('id', body.form_id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    // Verify the listener owns this form
    if (form.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You can only send forms you created' },
        { status: 403 }
      );
    }

    // Create the form message payload
    const formPayload: SupportFormMessagePayload = {
      form_id: form.id,
      title: form.title,
      description: form.description,
      fields: form.fields,
    };

    // Send the message with support_form_request type
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: body.conversation_id,
        sender_id: user.id,
        content: JSON.stringify(formPayload),
        message_type: 'support_form_request',
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)
      `)
      .single();

    if (msgError) {
      console.error('❌ Error creating form request message:', msgError);
      throw new Error(`Failed to send form request: ${msgError.message}`);
    }

    // Create notification for the receiver
    const receiverId = conversation.participant_1_id === user.id 
      ? conversation.participant_2_id 
      : conversation.participant_1_id;

    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: receiverId,
        type: 'support_form_request',
        title: 'New Support Form Request',
        message: `You received a support form: "${form.title}"`,
        action_url: `/messages/${body.conversation_id}`,
        metadata: {
          form_id: form.id,
          message_id: message.id,
          conversation_id: body.conversation_id,
        },
      });

    if (notifError) {
      console.warn('⚠️ Failed to create notification:', notifError);
      // Don't fail the request if notification fails
    }

    console.log('✅ Support form request sent:', {
      messageId: message.id,
      formId: form.id,
      conversationId: body.conversation_id,
    });

    return NextResponse.json({
      success: true,
      message,
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
      },
    });
  } catch (error: any) {
    console.error('❌ Error sending form request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send form request' },
      { status: 500 }
    );
  }
}
