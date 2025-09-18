import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 기본 유효성 검사
    if (!body.email || !body.password || !body.name || !body.nickname) {
      return NextResponse.json(
        { error: '필수 정보를 모두 입력해주세요' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          name: body.name,
          nickname: body.nickname,
          phone: body.phone || '',
        }
      }
    })

    if (error) {
      console.error('Supabase signup error:', error)
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        return NextResponse.json(
          { error: '이미 등록된 이메일입니다' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: '이메일 주소가 유효하지 않습니다. 실제 이메일 주소를 사용해주세요.' },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: '회원가입에 실패했습니다' },
        { status: 500 }
      )
    }

    // Return the user data
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: body.name,
        nickname: body.nickname,
        role: 'USER',
      },
      message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.'
    })
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}