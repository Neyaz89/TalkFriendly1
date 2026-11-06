/**
 * Listener Setup API (Auto-Verified Registration)
 * POST /api/listener/setup
 * 
 * Creates a verified listener profile immediately upon registration
 * They can add verification documents later
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      full_legal_name,
      email,
      country,
      city,
      professional_title,
      years_of_experience,
      specialization, // array
      professional_bio,
      auto_verify = false,
    } = body;

    // 1. Create/Update listener record with VERIFIED status
    const { data: existingListener } = await supabase
      .from('listeners')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingListener) {
      // Update existing listener
      const { error: updateError } = await supabase
        .from('listeners')
        .update({
          name: full_legal_name,
          professional_title,
          bio: professional_bio,
          specialties: specialization,
          languages: ['English'], // Default
          years_of_experience,
          verification_status: auto_verify ? 'verified' : 'unverified',
          is_available: true, // Allow them to start immediately
          rating: 0,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    } else {
      // Create new listener
      const { error: insertError } = await supabase
        .from('listeners')
        .insert({
          user_id: user.id,
          name: full_legal_name,
          professional_title,
          bio: professional_bio,
          specialties: specialization,
          languages: ['English'], // Default
          years_of_experience,
          verification_status: auto_verify ? 'verified' : 'unverified',
          is_available: true,
          rating: 0,
        });

      if (insertError) throw insertError;
    }

    // 2. Update profile to mark as verified if auto_verify
    if (auto_verify) {
      await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', user.id);
    }

    // 3. Create a listener application record (for future verification if needed)
    const { error: appError } = await supabase
      .from('listener_applications')
      .insert({
        user_id: user.id,
        full_legal_name,
        email,
        country,
        city,
        professional_title,
        years_of_experience,
        specialization,
        professional_bio,
        languages_spoken: ['English'],
        qualifications: [professional_title],
        educational_institution: 'Not specified',
        status: auto_verify ? 'approved' : 'draft', // Mark as approved if auto-verify
        submitted_at: auto_verify ? new Date().toISOString() : null,
        reviewed_at: auto_verify ? new Date().toISOString() : null,
        verification_documents: [],
      })
      .select()
      .single();

    // Don't fail if application insert fails (might already exist)
    if (appError && appError.code !== '23505') {
      console.error('Application creation error:', appError);
    }

    return NextResponse.json({
      success: true,
      message: auto_verify 
        ? 'Listener profile created and verified!' 
        : 'Listener profile created',
    });

  } catch (error) {
    console.error('Error setting up listener:', error);
    return NextResponse.json(
      { error: 'Failed to set up listener profile' },
      { status: 500 }
    );
  }
}
