import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, UserRole } from '@/lib/auth'

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다' },
      { status: 401 }
    )
  }

  return user
}

export async function requireAdmin(request: NextRequest) {
  const user = await requireAuth(request)

  if (user instanceof NextResponse) {
    return user
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다' },
      { status: 403 }
    )
  }

  return user
}

export async function requireSeller(request: NextRequest) {
  const user = await requireAuth(request)

  if (user instanceof NextResponse) {
    return user
  }

  if (user.role !== 'SELLER' &&
    user.role !== 'ADMIN' &&
    user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: '판매자 권한이 필요합니다' },
      { status: 403 }
    )
  }

  return user
}