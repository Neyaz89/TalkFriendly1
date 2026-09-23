import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Get all communities
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
    const category = searchParams.get('category')

    let query = supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: communities, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ communities })
  } catch (error) {
    console.error('Communities fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Create a new community
export async function POST(request: Request) {
  try {
    console.log('=== COMMUNITY CREATION START ===')
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check:', { userId: user?.id, authError: authError?.message })

    if (authError || !user) {
      console.log('❌ Authentication failed')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { 
      name, 
      description, 
      category, 
      avatar_url,
      cover_url,
      is_private,
      settings
    } = body

    if (!name || !category) {
      console.log('❌ Validation failed: missing name or category')
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }

    const insertData = {
      name,
      description,
      category,
      owner_id: user.id,
      avatar_url,
      cover_url,
      is_private: is_private || false,
      settings: settings || {
        allow_voice_messages: true,
        allow_member_posts: true,
        require_approval: false,
      },
    }
    console.log('Insert data:', JSON.stringify(insertData, null, 2))

    const { data: community, error } = await supabase
      .from('communities')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ API Supabase insert error - FULL:', error)
      console.error('❌ API Supabase insert error - STRINGIFIED:', JSON.stringify(error, null, 2))
      console.error('❌ API Supabase insert error - DETAILS:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status: error.status,
        statusText: error.statusText
      })
      return NextResponse.json(
        { 
          error: error.message || 'Database error',
          details: error.details,
          hint: error.hint,
          code: error.code
        },
        { status: 400 }
      )
    }

    console.log('✅ Community created successfully:', community.id)
    console.log('=== COMMUNITY CREATION END ===')
    
    // Database trigger automatically adds owner as member
    return NextResponse.json({ community }, { status: 201 })
  } catch (error) {
    console.error('❌ Unexpected error in community creation:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error stack:', errorStack)
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}
