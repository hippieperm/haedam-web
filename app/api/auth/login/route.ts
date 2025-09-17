import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations/auth'
import { verifyPassword, setSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = loginSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        name: true,
        nickname: true,
        isVerified: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 일치하지 않습니다' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 일치하지 않습니다' },
        { status: 401 }
      )
    }

    // Check if admin login
    const adminUsername = process.env.ADMIN_USERNAME
    const adminPassword = process.env.ADMIN_PASSWORD

    if (validatedData.email === 'admin@bonsai-auction.com' &&
        adminUsername && adminPassword &&
        validatedData.password === adminPassword) {
      // Admin login with environment credentials
      await setSession({
        userId: user.id,
        email: user.email,
        role: user.role,
      })
    } else {
      // Regular user login
      await setSession({
        userId: user.id,
        email: user.email,
        role: user.role,
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        role: user.role,
        isVerified: user.isVerified,
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