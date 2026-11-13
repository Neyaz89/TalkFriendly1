/**
 * API Route: Update Support Form
 * PUT /api/forms/update
 * 
 * Allows listeners to update their existing forms.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface UpdateFormPayload {
  form_id: string;
  title?: string;
  description?: string;
  fields?: any[];
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateFormPayload = await request.json();

    if (!body.form_id) {
      return NextResponse.json(
        { error: 'form_id is required' },
        { status: 400 }
      );
    }

    // At least one field must be provided for update
    if (!body.title && !body.description && !body.fields) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }

    // Validate fields if provided
    if (body.fields) {
      if (body.fields.length === 0) {
        return NextResponse.json(
          { error: 'Form must have at least one field' },
          { status: 400 }
        );
      }

      for (let i = 0; i < body.fields.length; i++) {
        const field = body.fields[i];
        if (!field.id || !field.label || !field.type) {
          return NextResponse.json(
            { error: `Field ${i + 1} is missing required properties (id, label, type)` },
            { status: 400 }
          );
        }
      }
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
      .select('id, created_by')
      .eq('id', body.form_id)
      .single();

    if (fetchError || !existingForm) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    if (existingForm.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You can only update your own forms' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.fields) updateData.fields = body.fields;

    // Update the form
    const { data: updatedForm, error: updateError } = await supabase
      .from('support_forms')
      .update(updateData)
      .eq('id', body.form_id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Error updating form:', updateError);
      throw new Error(`Failed to update form: ${updateError.message}`);
    }

    console.log('✅ Form updated:', {
      formId: updatedForm.id,
      title: updatedForm.title,
    });

    return NextResponse.json({
      success: true,
      form: updatedForm,
    });
  } catch (error: any) {
    console.error('❌ Error updating form:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update form' },
      { status: 500 }
    );
  }
}
