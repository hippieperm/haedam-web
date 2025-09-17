import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

    // 관심목록에서 제거 (장바구니 아이템 제거)
    const deleted = await prisma.watchlist.deleteMany({
      where: {
        userId: user.id,
        itemId: itemId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, message: "장바구니에 없는 상품입니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "장바구니에서 제거되었습니다.",
    });
  } catch (error) {
    console.error("Failed to remove from cart:", error);
    return NextResponse.json(
      { success: false, message: "장바구니에서 제거하는데 실패했습니다." },
      { status: 500 }
    );
  }
}
