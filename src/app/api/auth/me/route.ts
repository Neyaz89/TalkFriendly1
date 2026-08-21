import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // Return user data without profile if profile doesn't exist
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.user_metadata.username,
          full_name: user.user_metadata.full_name,
        }
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        ...profile,
      }
    })
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
