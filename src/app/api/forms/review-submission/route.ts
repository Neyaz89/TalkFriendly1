/**
 * API Route: Review Form Submission
 * POST /api/forms/review-submission
 * 
 * Allows listeners to review and update submission status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ReviewFormSubmissionPayload } from '@/types/support-form.types';

export async function POST(request: NextRequest) {
  try {
    const body: ReviewFormSubmissionPayload = await request.json();

    if (!body.submission_id || !body.status) {
      return NextResponse.json(
        { error: 'submission_id and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'reviewing', 'completed', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
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

    // Fetch the submission
    const { data: submission, error: subError } = await supabase
      .from('form_submissions')
      .select(`
        *,
        form:support_forms(id, created_by, title)
      `)
      .eq('id', body.submission_id)
      .single();

    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Verify the listener owns the form
    if (submission.form.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You can only review submissions for your own forms' },
        { status: 403 }
      );
    }

    // Update the submission
    const updateData: any = {
      status: body.status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    const { data: updatedSubmission, error: updateError } = await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', body.submission_id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Error updating submission:', updateError);
      throw new Error(`Failed to update submission: ${updateError.message}`);
    }

    // Optionally notify the submitter if status changed to completed
    if (body.status === 'completed') {
      await supabase
        .from('notifications')
        .insert({
          user_id: submission.submitted_by,
          type: 'form_reviewed',
          title: 'Form Review Complete',
          message: `Your form submission "${submission.form.title}" has been reviewed`,
          action_url: `/messages/${submission.conversation_id}`,
          metadata: {
            form_id: submission.form_id,
            submission_id: submission.id,
          },
        });
    }

    console.log('✅ Submission reviewed:', {
      submissionId: updatedSubmission.id,
      status: body.status,
    });

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
    });
  } catch (error: any) {
    console.error('❌ Error reviewing submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to review submission' },
      { status: 500 }
    );
  }
}
