import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = loginSchema.parse(body)

    const supabase = await createClient()

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 일치하지 않습니다' },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: '로그인에 실패했습니다' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // If profile doesn't exist, create a basic user object
    if (profileError || !profile) {
      // Check if this is the admin email
      const isAdmin = data.user.email === process.env.ADMIN_EMAIL
      const role = isAdmin ? 'ADMIN' : 'USER'

      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || '사용자',
          nickname: data.user.user_metadata?.nickname || 'user',
          role: role,
          is_verified: data.user.email_confirmed_at ? true : false,
        },
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        nickname: profile.nickname,
        role: profile.role,
        is_verified: profile.is_verified,
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}