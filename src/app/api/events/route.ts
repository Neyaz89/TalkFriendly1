import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Get all events
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('community_id')

    let query = supabase
      .from('events')
      .select('*, communities(*)')
      .order('event_date', { ascending: true })

    if (communityId) {
      query = query.eq('community_id', communityId)
    }

    const { data: events, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Events fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Create a new event
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { title, description, event_date, location, max_attendees, community_id } = await request.json()

    if (!title || !event_date) {
      return NextResponse.json(
        { error: 'Title and event date are required' },
        { status: 400 }
      )
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title,
        description,
        event_date,
        location,
        max_attendees,
        community_id,
        attendee_count: 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Event creation error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
