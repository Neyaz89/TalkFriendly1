/**
 * API Route: Send Connection Request
 * POST /api/connections/send
 * 
 * Creates a connection request and sends a notification to the target user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.target_user_id) {
      return NextResponse.json(
        { error: 'target_user_id is required' },
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

    // Prevent self-connection
    if (user.id === body.target_user_id) {
      return NextResponse.json(
        { error: 'Cannot send connection request to yourself' },
        { status: 400 }
      );
    }

    // Get sender profile for notification
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url, account_type')
      .eq('id', user.id)
      .single();

    // Get target user profile
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('username, full_name, account_type')
      .eq('id', body.target_user_id)
      .single();

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('user_connections')
      .select('*')
      .or(
        `and(user_id.eq.${user.id},connected_user_id.eq.${body.target_user_id}),and(user_id.eq.${body.target_user_id},connected_user_id.eq.${user.id})`
      )
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Connection request already exists' },
        { status: 400 }
      );
    }

    // Create connection request
    const { data, error } = await supabase
      .from('user_connections')
      .insert({
        user_id: user.id,
        connected_user_id: body.target_user_id,
        initiated_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to send connection request: ${error.message}`);
    }

    // Create notification for the target user
    const senderName = senderProfile?.full_name || senderProfile?.username || 'Someone';
    const isListenerRequest = targetProfile.account_type === 'listener';
    
    const notificationTitle = isListenerRequest
      ? 'New Connection Request'
      : 'New Connection Request';
    
    const notificationMessage = isListenerRequest
      ? `${senderName} wants to connect with you as a listener`
      : `${senderName} wants to connect with you`;

    await supabase.from('notifications').insert({
      user_id: body.target_user_id,
      notification_type: 'connection_request',
      title: notificationTitle,
      message: notificationMessage,
      data: {
        connection_id: data.id,
        sender_id: user.id,
        sender_name: senderName,
        sender_avatar: senderProfile?.avatar_url,
        sender_account_type: senderProfile?.account_type,
      },
      link: `/connections/requests`,
    });

    console.log(`✅ Connection request sent from ${user.id} to ${body.target_user_id}`);

    return NextResponse.json({
      success: true,
      connection: data,
      message: 'Connection request sent successfully',
    });
  } catch (error: any) {
    console.error('❌ Error sending connection request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send connection request' },
      { status: 500 }
    );
  }
}
