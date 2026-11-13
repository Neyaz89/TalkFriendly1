/**
 * API Route: Get Form Submissions
 * GET /api/forms/submissions?form_id=xxx
 * 
 * Returns all submissions for a specific form (listener only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('form_id');

    if (!formId) {
      return NextResponse.json(
        { error: 'form_id is required' },
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

    // Verify the form exists and belongs to the user
    const { data: form, error: formError } = await supabase
      .from('support_forms')
      .select('id, created_by, title')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    if (form.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You can only view submissions for your own forms' },
        { status: 403 }
      );
    }

    // Fetch all submissions for this form with submitter info
    const { data: submissions, error: submissionsError } = await supabase
      .from('form_submissions')
      .select(`
        *,
        submitter:profiles!form_submissions_submitted_by_fkey(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (submissionsError) {
      console.error('❌ Error fetching submissions:', submissionsError);
      throw new Error(`Failed to fetch submissions: ${submissionsError.message}`);
    }

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
      form: {
        id: form.id,
        title: form.title,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching submissions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
