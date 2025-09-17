import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signupSchema } from '@/lib/validations/auth'
import { hashPassword, setSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        name: validatedData.name,
        nickname: validatedData.nickname,
        phone: validatedData.phone,
        role: UserRole.USER,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        nickname: true,
      },
    })

    // Create session
    await setSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        role: user.role,
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
      { error: '회원가입 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}