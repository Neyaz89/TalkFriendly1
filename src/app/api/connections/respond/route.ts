/**
 * API Route: Respond to Connection Request
 * POST /api/connections/respond
 * 
 * Accepts or rejects a connection request and sends notification to requester
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.connection_id || !body.status) {
      return NextResponse.json(
        { error: 'connection_id and status are required' },
        { status: 400 }
      );
    }

    if (!['accepted', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: 'status must be either "accepted" or "rejected"' },
        { status: 400 }
      );
    }

    // Create Supabase client for API route
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

    // Get connection details before updating
    const { data: connection } = await supabase
      .from('user_connections')
      .select('user_id, connected_user_id, initiated_by')
      .eq('id', body.connection_id)
      .eq('connected_user_id', user.id)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found or you are not authorized' },
        { status: 404 }
      );
    }

    // Get responder profile for notification
    const { data: responderProfile } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url, account_type')
      .eq('id', user.id)
      .single();

    // Update connection status
    const { data, error } = await supabase
      .from('user_connections')
      .update({ 
        status: body.status,
        responded_at: new Date().toISOString(),
      })
      .eq('id', body.connection_id)
      .eq('connected_user_id', user.id) // Only receiver can respond
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to respond to connection: ${error.message}`);
    }

    // Send notification to the person who sent the request
    const responderName = responderProfile?.full_name || responderProfile?.username || 'Someone';
    
    if (body.status === 'accepted') {
      // Notify about acceptance
      await supabase.from('notifications').insert({
        user_id: connection.initiated_by,
        notification_type: 'connection_accepted',
        title: 'Connection Request Accepted',
        message: `${responderName} accepted your connection request`,
        data: {
          connection_id: data.id,
          responder_id: user.id,
          responder_name: responderName,
          responder_avatar: responderProfile?.avatar_url,
          responder_account_type: responderProfile?.account_type,
        },
        link: `/messages/${data.id}`, // Link to conversation
      });

      console.log(`✅ Connection accepted: ${connection.user_id} ↔ ${connection.connected_user_id}`);
    } else {
      console.log(`❌ Connection rejected: ${connection.user_id} ✗ ${connection.connected_user_id}`);
    }

    return NextResponse.json({
      success: true,
      connection: data,
      message: body.status === 'accepted' 
        ? 'Connection request accepted' 
        : 'Connection request rejected',
    });
  } catch (error: any) {
    console.error('❌ Error responding to connection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to respond to connection' },
      { status: 500 }
    );
  }
}
