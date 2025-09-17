import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function requireAuth(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: '인증이 필요합니다' },
      { status: 401 }
    )
  }

  return session
}

export async function requireAdmin(request: NextRequest) {
  const session = await requireAuth(request)

  if (session instanceof NextResponse) {
    return session
  }

  if (session.role !== UserRole.ADMIN && session.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다' },
      { status: 403 }
    )
  }

  return session
}

export async function requireSeller(request: NextRequest) {
  const session = await requireAuth(request)

  if (session instanceof NextResponse) {
    return session
  }

  if (session.role !== UserRole.SELLER &&
      session.role !== UserRole.ADMIN &&
      session.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json(
      { error: '판매자 권한이 필요합니다' },
      { status: 403 }
    )
  }

  return session
}