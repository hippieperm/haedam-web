import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const bidSchema = z.object({
  amount: z.number().positive("입찰가는 0보다 커야 합니다"),
  isProxy: z.boolean().optional().default(false),
  maxProxyAmount: z.number().positive().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, isProxy, maxProxyAmount } = bidSchema.parse(body);

    // 상품 확인
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        bids: {
          orderBy: { amount: "desc" },
          take: 1,
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (item.status !== "LIVE") {
      return NextResponse.json(
        { success: false, message: "진행중인 경매가 아닙니다." },
        { status: 400 }
      );
    }

    if (new Date() > item.endsAt) {
      return NextResponse.json(
        { success: false, message: "경매가 종료되었습니다." },
        { status: 400 }
      );
    }

    // 최소 입찰가 확인
    const currentHighestBid = item.bids[0]?.amount || item.startPrice;
    const minBidAmount = currentHighestBid + item.bidStep;

    if (amount < minBidAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `최소 입찰가는 ${minBidAmount.toLocaleString()}원입니다.`,
        },
        { status: 400 }
      );
    }

    // 입찰 생성
    const bid = await prisma.bid.create({
      data: {
        itemId: id,
        bidderId: user.id,
        amount,
        isProxy: isProxy || false,
        maxProxyAmount: maxProxyAmount || null,
        isWinning: true,
      },
    });

    // 이전 최고 입찰을 낙찰에서 제외
    await prisma.bid.updateMany({
      where: {
        itemId: id,
        isWinning: true,
        id: { not: bid.id },
      },
      data: {
        isWinning: false,
      },
    });

    // 상품 현재가 업데이트
    await prisma.item.update({
      where: { id },
      data: { currentPrice: amount },
    });

    return NextResponse.json({
      success: true,
      data: {
        bid,
        item: {
          id: item.id,
          currentPrice: amount,
          endsAt: item.endsAt,
        },
      },
      message: "입찰이 성공적으로 등록되었습니다.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Failed to place bid:", error);
    return NextResponse.json(
      { success: false, message: "입찰 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
