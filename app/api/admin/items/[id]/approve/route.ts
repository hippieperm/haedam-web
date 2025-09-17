import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'
import { ItemStatus } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session

  try {
    const { id } = await params

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
        { error: '검수 대기 중인 상품만 승인할 수 있습니다' },
        { status: 400 }
      )
    }

    // Update item status to SCHEDULED
    const updatedItem = await prisma.item.update({
      where: { id },
      data: { status: ItemStatus.SCHEDULED },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: 'ITEM_APPROVED',
        targetType: 'ITEM',
        targetId: id,
        targetItemId: id,
        diff: {
          status: {
            from: ItemStatus.PENDING_REVIEW,
            to: ItemStatus.SCHEDULED,
          },
        },
      },
    })

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: item.sellerId,
        type: 'ADMIN_MESSAGE',
        title: '상품 승인 완료',
        message: `상품 "${item.title}"이 승인되었습니다.`,
        data: {
          itemId: id,
          itemTitle: item.title,
        },
      },
    })

    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}