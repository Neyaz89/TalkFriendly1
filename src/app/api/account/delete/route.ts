import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/account/delete
 * Delete user account and all associated data
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify confirmation from request body
    const body = await request.json();
    const { confirmation } = body;

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Invalid confirmation" },
        { status: 400 }
      );
    }

    // Delete user data (RLS policies ensure only user's own data is deleted)
    // Profile will be deleted via CASCADE when auth user is deleted
    
    // Mark account as deleted (soft delete for audit trail)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error marking profile as deleted:', profileError);
    }

    // Delete journal entries
    await supabase
      .from('journal_entries')
      .delete()
      .eq('user_id', user.id);

    // Delete mood logs
    await supabase
      .from('mood_logs')
      .delete()
      .eq('user_id', user.id);

    // Delete listener bookings
    await supabase
      .from('listener_bookings')
      .delete()
      .eq('user_id', user.id);

    // Leave communities (remove membership records)
    await supabase
      .from('community_members')
      .delete()
      .eq('user_id', user.id);

    // Delete the auth user (this will cascade delete the profile)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      // If we don't have admin access, sign out the user instead
      // In production, this should be called via a service role or admin function
      await supabase.auth.signOut();
      
      return NextResponse.json({
        success: true,
        message: "Account data cleared. Please contact support to complete account deletion.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Account successfully deleted",
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
