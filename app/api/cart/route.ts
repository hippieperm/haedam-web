import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 장바구니는 관심목록과 입찰 예약을 조합한 개념으로 구현
    // 실제로는 별도의 Cart 모델이 필요하지만, 여기서는 관심목록을 기반으로 구현
    const watchlists = await prisma.watchlist.findMany({
      where: {
        userId: user.id,
      },
      include: {
        item: {
          include: {
            seller: {
              select: {
                id: true,
                nickname: true,
                name: true,
                profileImage: true,
              },
            },
            media: {
              where: {
                type: "IMAGE",
              },
              orderBy: {
                sort: "asc",
              },
            },
            _count: {
              select: {
                bids: true,
                watchlists: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 관심목록을 장바구니 아이템 형태로 변환
    const cartItems = watchlists.map((watchlist) => ({
      id: watchlist.id,
      item: watchlist.item,
      type: "WATCH" as const,
      addedAt: watchlist.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: cartItems,
    });
  } catch (error) {
    console.error("Failed to fetch cart:", error);
    return NextResponse.json(
      { success: false, message: "장바구니를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 관심목록 전체 삭제
    await prisma.watchlist.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "장바구니가 비워졌습니다.",
    });
  } catch (error) {
    console.error("Failed to clear cart:", error);
    return NextResponse.json(
      { success: false, message: "장바구니를 비우는데 실패했습니다." },
      { status: 500 }
    );
  }
}
