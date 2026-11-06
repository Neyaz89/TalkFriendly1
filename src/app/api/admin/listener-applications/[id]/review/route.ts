/**
 * Admin Application Review API
 * POST /api/admin/listener-applications/[id]/review
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdminAuth, isErrorResponse } from '@/middleware/admin-auth.middleware';
import { logAdminActivity } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate admin
  const authResult = await withAdminAuth(request, {
    requiredPermission: 'manage_listeners',
  });

  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { admin } = authResult;
  const { id } = await params;

  try {
    const { action, admin_notes } = await request.json();

    if (!action || !['approve', 'reject', 'request_info'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get application
    const { data: application, error: fetchError } = await supabase
      .from('listener_applications')
      .select('*, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Determine new status
    let newStatus: string;
    let newVerificationStatus: string | null = null;

    if (action === 'approve') {
      newStatus = 'approved';
      newVerificationStatus = 'verified';
    } else if (action === 'reject') {
      newStatus = 'rejected';
      newVerificationStatus = 'unverified';
    } else {
      newStatus = 'additional_info_required';
    }

    // Update application
    const { error: updateError } = await supabase
      .from('listener_applications')
      .update({
        status: newStatus,
        admin_notes: admin_notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      );
    }

    // Add to history
    await supabase.from('application_status_history').insert({
      application_id: id,
      status: newStatus,
      changed_by: admin.id,
      admin_notes: admin_notes || null,
    });

    // If approved, update listener verification status
    if (action === 'approve') {
      // Check if listener record exists
      const { data: existingListener } = await supabase
        .from('listeners')
        .select('id')
        .eq('user_id', application.user_id)
        .single();

      if (existingListener) {
        // Update existing listener
        await supabase
          .from('listeners')
          .update({
            verification_status: 'verified',
            name: application.full_legal_name,
            professional_title: application.professional_title,
            bio: application.professional_bio,
            specialties: application.specialization,
            languages: application.languages_spoken,
            years_of_experience: application.years_of_experience,
          })
          .eq('user_id', application.user_id);
      } else {
        // Create new listener record
        await supabase.from('listeners').insert({
          user_id: application.user_id,
          name: application.full_legal_name,
          professional_title: application.professional_title,
          bio: application.professional_bio,
          specialties: application.specialization,
          languages: application.languages_spoken,
          years_of_experience: application.years_of_experience,
          verification_status: 'verified',
          is_available: false,
          rating: 0,
        });
      }

      // Update profile verification status
      await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', application.user_id);
    }

    // If rejected, update listener status to unverified
    if (action === 'reject') {
      await supabase
        .from('listeners')
        .update({ verification_status: 'unverified' })
        .eq('user_id', application.user_id);
    }

    // Log admin activity
    await logAdminActivity(
      admin.id,
      `application_${action}`,
      'listener_application',
      id,
      { application_id: id, action, admin_notes }
    );

    // TODO: Send email notification to applicant

    return NextResponse.json({
      success: true,
      message: `Application ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged for additional information'}`,
    });

  } catch (error) {
    console.error('Error reviewing application:', error);
    return NextResponse.json(
      { error: 'Failed to process review' },
      { status: 500 }
    );
  }
}
