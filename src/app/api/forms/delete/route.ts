/**
 * API Route: Delete Support Form
 * DELETE /api/forms/delete
 * 
 * Allows listeners to delete their forms.
 * Also deletes associated submissions via CASCADE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
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
    const { data: existingForm, error: fetchError } = await supabase
      .from('support_forms')
      .select('id, created_by, title')
      .eq('id', formId)
      .single();

    if (fetchError || !existingForm) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    if (existingForm.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own forms' },
        { status: 403 }
      );
    }

    // Delete the form (CASCADE will delete associated submissions)
    const { error: deleteError } = await supabase
      .from('support_forms')
      .delete()
      .eq('id', formId);

    if (deleteError) {
      console.error('❌ Error deleting form:', deleteError);
      throw new Error(`Failed to delete form: ${deleteError.message}`);
    }

    console.log('✅ Form deleted:', {
      formId: existingForm.id,
      title: existingForm.title,
    });

    return NextResponse.json({
      success: true,
      message: 'Form deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ Error deleting form:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete form' },
      { status: 500 }
    );
  }
}
