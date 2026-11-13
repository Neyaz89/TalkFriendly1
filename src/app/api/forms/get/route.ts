/**
 * API Route: Get Support Form
 * GET /api/forms/get?form_id=xxx
 * 
 * Returns a specific form by ID.
 * Users can view forms they've received, listeners can view their own forms.
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

    // Fetch the form with RLS automatically handling access control
    const { data: form, error: formError } = await supabase
      .from('support_forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      form,
    });
  } catch (error: any) {
    console.error('❌ Error fetching form:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch form' },
      { status: 500 }
    );
  }
}
