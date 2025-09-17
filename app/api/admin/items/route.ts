import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'
import { ItemStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ItemStatus | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = status ? { status } : {}

    const items = await prisma.item.findMany({
      where,
      include: {
        seller: {
          select: { id: true, name: true, nickname: true, email: true },
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
        },
        _count: {
          select: { bids: true, watchlists: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const total = await prisma.item.count({ where })

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}