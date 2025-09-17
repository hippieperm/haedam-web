import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { AuctionService } from '@/lib/services/auction'
import { z } from 'zod'

const bidSchema = z.object({
  amount: z.number().positive('입찰가는 0보다 커야 합니다'),
  isProxy: z.boolean().optional().default(false),
  maxProxyAmount: z.number().positive().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const { id } = await params
    const body = await request.json()
    const { amount, isProxy, maxProxyAmount } = bidSchema.parse(body)

    if (isProxy && !maxProxyAmount) {
      return NextResponse.json(
        { error: '프록시 입찰 시 최대 입찰가를 설정해야 합니다' },
        { status: 400 }
      )
    }

    if (isProxy && maxProxyAmount && amount > maxProxyAmount) {
      return NextResponse.json(
        { error: '입찰가가 최대 입찰가보다 클 수 없습니다' },
        { status: 400 }
      )
    }

    const result = await AuctionService.processBid(
      id,
      session.userId,
      amount,
      isProxy,
      maxProxyAmount
    )

    // Notify other bidders about outbid
    // (This would be done via WebSocket in real implementation)

    return NextResponse.json({
      bid: result.bid,
      item: {
        id: result.item.id,
        currentPrice: amount,
        endsAt: result.item.endsAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '입찰 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}