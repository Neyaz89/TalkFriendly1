import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/listener-application - Create or update draft application
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
      phone,
      country,
      city,
      state_province,
      professional_title,
      qualifications,
      educational_institution,
      specialization,
      years_of_experience,
      professional_bio,
      languages_spoken,
      areas_of_expertise,
      license_number,
      licensing_authority,
      license_country,
      license_state_province,
      license_expiry_date,
      profile_photo_url,
      verification_documents,
      save_as_draft = true,
    } = body;

    // Check if user already has an application
    const { data: existingApp } = await supabase
      .from('listener_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    // Don't allow creating new application if one is already approved
    if (existingApp && existingApp.status === 'approved') {
      return NextResponse.json(
        { error: 'You already have an approved application' },
        { status: 400 }
      );
    }

    // Don't allow editing if application is under review
    if (existingApp && existingApp.status !== 'draft' && existingApp.status !== 'additional_info_required') {
      return NextResponse.json(
        { error: 'Cannot edit application while under review' },
        { status: 400 }
      );
    }

    const applicationData = {
      user_id: user.id,
      full_legal_name,
      email: user.email,
      phone,
      country,
      city,
      state_province,
      professional_title,
      qualifications,
      educational_institution,
      specialization,
      years_of_experience,
      professional_bio,
      languages_spoken,
      areas_of_expertise,
      license_number,
      licensing_authority,
      license_country,
      license_state_province,
      license_expiry_date,
      profile_photo_url,
      verification_documents,
      status: save_as_draft ? 'draft' : 'pending_review',
      submitted_at: save_as_draft ? null : new Date().toISOString(),
    };

    let result;

    if (existingApp) {
      // Update existing application
      const { data, error } = await supabase
        .from('listener_applications')
        .update(applicationData)
        .eq('id', existingApp.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new application
      const { data, error } = await supabase
        .from('listener_applications')
        .insert(applicationData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      application: result,
      message: save_as_draft ? 'Draft saved successfully' : 'Application submitted successfully',
    });

  } catch (error) {
    console.error('Error saving application:', error);
    return NextResponse.json(
      { error: 'Failed to save application' },
      { status: 500 }
    );
  }
}

// GET /api/listener-application - Get user's application
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('listener_applications')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { application: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ application: data });

  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}
