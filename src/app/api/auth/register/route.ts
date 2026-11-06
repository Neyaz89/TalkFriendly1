import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, username, fullName, accountType } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate account type - only 'user' and 'listener' allowed via public registration
    const allowedAccountTypes = ['user', 'listener'];
    const validatedAccountType = accountType && allowedAccountTypes.includes(accountType) 
      ? accountType 
      : 'user'; // Default to 'user' if not specified or invalid

    // Never allow 'admin' or 'doctor' via public registration
    if (accountType === 'admin' || accountType === 'doctor') {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
          full_name: fullName || '',
          account_type: validatedAccountType,
        },
      },
    })

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    // If sign up successful, also create a profile record
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: username || email.split('@')[0],
          full_name: fullName || '',
          email: email,
          account_type: validatedAccountType, // Server-validated account type
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't fail the registration if profile creation fails
        // The user is still authenticated
      }
    }

    return NextResponse.json({
      message: 'Registration successful',
      user: authData.user,
      account_type: validatedAccountType,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
