import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

    const { id: itemId } = await params;

    // 상품 존재 확인
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 관심목록에 있는지 확인
    const existingWatchlist = await prisma.watchlist.findUnique({
      where: {
        userId_itemId: {
          userId: user.id,
          itemId: itemId,
        },
      },
    });

    if (existingWatchlist) {
      return NextResponse.json(
        { success: false, message: "이미 관심목록에 추가된 상품입니다." },
        { status: 400 }
      );
    }

    // 관심목록에 추가
    await prisma.watchlist.create({
      data: {
        userId: user.id,
        itemId: itemId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "관심목록에 추가되었습니다.",
    });
  } catch (error) {
    console.error("Failed to add to watchlist:", error);
    return NextResponse.json(
      { success: false, message: "관심목록 추가에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id: itemId } = await params;

    // 관심목록에서 제거
    const deleted = await prisma.watchlist.deleteMany({
      where: {
        userId: user.id,
        itemId: itemId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, message: "관심목록에 없는 상품입니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "관심목록에서 제거되었습니다.",
    });
  } catch (error) {
    console.error("Failed to remove from watchlist:", error);
    return NextResponse.json(
      { success: false, message: "관심목록에서 제거하는데 실패했습니다." },
      { status: 500 }
    );
  }
}
