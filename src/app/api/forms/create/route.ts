/**
 * API Route: Create Support Form
 * POST /api/forms/create
 * 
 * Allows listeners to create new support form templates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupportFormInsert } from '@/types/support-form.types';

interface CreateFormPayload {
  title: string;
  description?: string;
  fields: any[]; // FormField[]
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateFormPayload = await request.json();

    if (!body.title || !body.fields || body.fields.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one field are required' },
        { status: 400 }
      );
    }

    // Validate field structure
    for (let i = 0; i < body.fields.length; i++) {
      const field = body.fields[i];
      if (!field.id || !field.label || !field.type) {
        return NextResponse.json(
          { error: `Field ${i + 1} is missing required properties (id, label, type)` },
          { status: 400 }
        );
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

    // Verify user is a listener
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.account_type !== 'listener') {
      return NextResponse.json(
        { error: 'Only listeners can create forms' },
        { status: 403 }
      );
    }

    // Create the form
    const { data: form, error: formError } = await supabase
      .from('support_forms')
      .insert({
        title: body.title,
        description: body.description,
        fields: body.fields,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (formError) {
      console.error('❌ Error creating form:', formError);
      throw new Error(`Failed to create form: ${formError.message}`);
    }

    console.log('✅ Form created:', {
      formId: form.id,
      title: form.title,
      fieldCount: body.fields.length,
    });

    return NextResponse.json({
      success: true,
      form,
    });
  } catch (error: any) {
    console.error('❌ Error creating form:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create form' },
      { status: 500 }
    );
  }
}
