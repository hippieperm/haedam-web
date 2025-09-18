import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { signupSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = signupSchema.parse(body)

    const supabase = createClient()

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
          nickname: validatedData.nickname,
          phone: validatedData.phone,
        }
      }
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: '이미 등록된 이메일입니다' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: '회원가입에 실패했습니다' },
        { status: 500 }
      )
    }

    // The user profile will be automatically created by the trigger function
    // Return the user data
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: validatedData.name,
        nickname: validatedData.nickname,
        role: 'USER',
      },
      message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.'
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}