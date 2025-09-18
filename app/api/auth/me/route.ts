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
      // If profile doesn't exist, create a basic user object from auth data
      const isAdmin = user.email === process.env.ADMIN_EMAIL
      const role = isAdmin ? 'ADMIN' : 'USER'
      
      const fallbackUser = {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || '사용자',
        nickname: user.user_metadata?.nickname || 'user',
        role: role,
        is_verified: user.email_confirmed_at ? true : false,
        created_at: user.created_at,
        updated_at: user.updated_at,
        phone: user.user_metadata?.phone || '',
      }
      
      return NextResponse.json({ user: fallbackUser })
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