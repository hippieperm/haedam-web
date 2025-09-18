import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // users 테이블에서 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: profile })
  } catch (error) {
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}