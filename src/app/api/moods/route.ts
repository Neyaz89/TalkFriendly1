import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Get mood logs for the current user
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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 30

    const { data: moods, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ moods })
  } catch (error) {
    console.error('Mood logs fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Log a new mood
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

    const { mood, intensity, notes } = await request.json()

    if (!mood || intensity === undefined) {
      return NextResponse.json(
        { error: 'Mood and intensity are required' },
        { status: 400 }
      )
    }

    const { data: moodLog, error } = await supabase
      .from('mood_logs')
      .insert({
        user_id: user.id,
        mood,
        intensity,
        notes,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ moodLog }, { status: 201 })
  } catch (error) {
    console.error('Mood log creation error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
