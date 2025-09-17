import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { AuctionService } from '@/lib/services/auction'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const { id } = await params

    const result = await AuctionService.buyNow(id, session.userId)

    return NextResponse.json({
      order: result.order,
      message: '즉시구매가 완료되었습니다. 결제 페이지로 이동합니다.',
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '즉시구매 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}