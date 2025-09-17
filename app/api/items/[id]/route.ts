import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            nickname: true,
            profileImage: true,
            createdAt: true,
            _count: {
              select: { items: true },
            },
          },
        },
        media: {
          orderBy: { sort: 'asc' },
        },
        bids: {
          orderBy: { amount: 'desc' },
          include: {
            bidder: {
              select: { id: true, nickname: true },
            },
          },
        },
        watchlists: {
          select: { userId: true },
        },
        tags: {
          include: { tag: true },
        },
        _count: {
          select: { bids: true, watchlists: true },
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.item.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({ item })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}