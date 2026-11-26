/**
 * API Route: Submit Support Form
 * POST /api/forms/submit
 * 
 * Allows users to submit responses to forms they received.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SubmitFormPayload } from '@/types/support-form.types';

export async function POST(request: NextRequest) {
  try {
    const body: SubmitFormPayload = await request.json();

    if (!body.message_id || !body.form_id || !body.responses) {
      return NextResponse.json(
        { error: 'message_id, form_id, and responses are required' },
        { status: 400 }
      );
    }

    if (body.responses.length === 0) {
      return NextResponse.json(
        { error: 'At least one response is required' },
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

    // Verify the message exists and contains this form
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select('id, conversation_id, content, message_type')
      .eq('id', body.message_id)
      .single();

    if (msgError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.message_type !== 'support_form_request') {
      return NextResponse.json(
        { error: 'Message is not a form request' },
        { status: 400 }
      );
    }

    // Parse message content to verify form_id
    const messageContent = JSON.parse(message.content || '{}');
    if (messageContent.form_id !== body.form_id) {
      return NextResponse.json(
        { error: 'Form ID does not match message' },
        { status: 400 }
      );
    }

    // Verify user is a participant in the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, participant_1_id, participant_2_id')
      .eq('id', message.conversation_id)
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

    // Check if already submitted
    const { data: existingSubmission } = await supabase
      .from('form_submissions')
      .select('id')
      .eq('message_id', body.message_id)
      .eq('submitted_by', user.id)
      .single();

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted this form' },
        { status: 400 }
      );
    }

    // Create the submission
    const { data: submission, error: submitError } = await supabase
      .from('form_submissions')
      .insert({
        form_id: body.form_id,
        message_id: body.message_id,
        conversation_id: message.conversation_id,
        submitted_by: user.id,
        responses: body.responses,
        status: 'pending',
      })
      .select('*')
      .single();

    if (submitError) {
      console.error('❌ Error creating submission:', submitError);
      throw new Error(`Failed to submit form: ${submitError.message}`);
    }

    // Update the message content to include submission_id
    messageContent.submission_id = submission.id;
    await supabase
      .from('messages')
      .update({ content: JSON.stringify(messageContent) })
      .eq('id', body.message_id);

    // Create notification for the form creator (listener)
    const listenerId = conversation.participant_1_id === user.id 
      ? conversation.participant_2_id 
      : conversation.participant_1_id;

    const { data: form } = await supabase
      .from('support_forms')
      .select('title')
      .eq('id', body.form_id)
      .single();

    await supabase
      .from('notifications')
      .insert({
        user_id: listenerId,
        notification_type: 'message',
        title: 'New Form Submission',
        message: `Someone submitted your form: "${form?.title || 'Untitled Form'}"`,
        link: `/messages?conversation=${message.conversation_id}`,
        data: {
          form_id: body.form_id,
          submission_id: submission.id,
          message_id: body.message_id,
          conversation_id: message.conversation_id,
        },
      });

    console.log('✅ Form submitted:', {
      submissionId: submission.id,
      formId: body.form_id,
      messageId: body.message_id,
    });

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error: any) {
    console.error('❌ Error submitting form:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit form' },
      { status: 500 }
    );
  }
}
