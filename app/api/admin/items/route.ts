import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ItemStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ItemStatus | null;
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { species: { contains: search, mode: "insensitive" } },
        {
          seller: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { nickname: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        seller: {
          select: { id: true, name: true, nickname: true, email: true },
        },
        bids: {
          orderBy: { amount: "desc" },
          take: 1,
        },
        _count: {
          select: { bids: true, watchlists: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.item.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin items:", error);
    return NextResponse.json(
      { success: false, message: "상품 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
