import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/listener-application/submit - Submit application for review
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

    const { application_id } = await request.json();

    if (!application_id) {
      return NextResponse.json(
        { error: 'Application ID required' },
        { status: 400 }
      );
    }

    // Get application
    const { data: application, error: fetchError } = await supabase
      .from('listener_applications')
      .select('*')
      .eq('id', application_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Validate application is complete
    const requiredFields = [
      'full_legal_name',
      'phone',
      'country',
      'city',
      'professional_title',
      'qualifications',
      'educational_institution',
      'specialization',
      'years_of_experience',
      'professional_bio',
      'languages_spoken',
      'profile_photo_url',
    ];

    const missingFields = requiredFields.filter(field => !application[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check documents
    if (!application.verification_documents || application.verification_documents.length === 0) {
      return NextResponse.json(
        { error: 'At least one verification document is required' },
        { status: 400 }
      );
    }

    // Update status to pending_review
    const { data: updated, error: updateError } = await supabase
      .from('listener_applications')
      .update({
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', application_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // TODO: Send email notification to applicant and admins

    return NextResponse.json({
      success: true,
      application: updated,
      message: 'Application submitted successfully. You will receive an email when it has been reviewed.',
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
