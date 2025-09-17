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

    return NextResponse.json({
      success: true,
      data: watchlists,
    });
  } catch (error) {
    console.error("Failed to fetch watchlist:", error);
    return NextResponse.json(
      { success: false, message: "관심목록을 불러오는데 실패했습니다." },
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

    await prisma.watchlist.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "관심목록이 비워졌습니다.",
    });
  } catch (error) {
    console.error("Failed to clear watchlist:", error);
    return NextResponse.json(
      { success: false, message: "관심목록을 비우는데 실패했습니다." },
      { status: 500 }
    );
  }
}
