import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Get all listeners
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
    const specialty = searchParams.get('specialty')

    let query = supabase
      .from('listeners')
      .select('*')
      .order('rating', { ascending: false })

    if (specialty) {
      query = query.contains('specialties', [specialty])
    }

    const { data: listeners, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ listeners })
  } catch (error) {
    console.error('Listeners fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
