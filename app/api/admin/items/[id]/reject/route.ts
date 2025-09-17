import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'
import { ItemStatus } from '@prisma/client'
import { z } from 'zod'

const rejectSchema = z.object({
  reason: z.string().min(1, '거부 사유를 입력하세요'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session

  try {
    const { id } = await params
    const body = await request.json()
    const { reason } = rejectSchema.parse(body)

    const item = await prisma.item.findUnique({
      where: { id },
      include: { seller: true },
    })

    if (!item) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (item.status !== ItemStatus.PENDING_REVIEW) {
      return NextResponse.json(
        { error: '검수 대기 중인 상품만 거부할 수 있습니다' },
        { status: 400 }
      )
    }

    // Update item status to DRAFT
    const updatedItem = await prisma.item.update({
      where: { id },
      data: { status: ItemStatus.DRAFT },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: 'ITEM_REJECTED',
        targetType: 'ITEM',
        targetId: id,
        targetItemId: id,
        diff: {
          status: {
            from: ItemStatus.PENDING_REVIEW,
            to: ItemStatus.DRAFT,
          },
          reason,
        },
      },
    })

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: item.sellerId,
        type: 'ADMIN_MESSAGE',
        title: '상품 거부됨',
        message: `상품 "${item.title}"이 거부되었습니다. 사유: ${reason}`,
        data: {
          itemId: id,
          itemTitle: item.title,
          reason,
        },
      },
    })

    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}