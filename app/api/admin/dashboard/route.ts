import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 기본 통계 조회
    const [
      totalUsers,
      totalItems,
      liveAuctions,
      totalRevenue,
      pendingReviews,
      recentActivity,
    ] = await Promise.all([
      // 총 사용자 수
      prisma.user.count({
        where: { deletedAt: null },
      }),

      // 총 상품 수
      prisma.item.count({
        where: { deletedAt: null },
      }),

      // 진행중인 경매 수
      prisma.item.count({
        where: {
          status: "LIVE",
          deletedAt: null,
        },
      }),

      // 총 매출 (완료된 주문의 총 금액)
      prisma.order
        .aggregate({
          where: {
            paymentStatus: "PAID",
            canceledAt: null,
          },
          _sum: { totalAmount: true },
        })
        .then((result) => result._sum.totalAmount || 0),

      // 검수 대기 상품 수
      prisma.item.count({
        where: {
          status: "PENDING_REVIEW",
          deletedAt: null,
        },
      }),

      // 최근 활동 (최근 10개)
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: { name: true, nickname: true },
          },
        },
      }),
    ]);

    // 최근 활동 데이터 변환
    const formattedActivity = recentActivity.map((activity) => ({
      id: activity.id,
      type: activity.action,
      description: `${
        activity.actor.nickname || activity.actor.name || "시스템"
      }이 ${activity.action}을 수행했습니다.`,
      createdAt: activity.createdAt.toISOString(),
    }));

    const stats = {
      totalUsers,
      totalItems,
      liveAuctions,
      totalRevenue,
      pendingReviews,
      recentActivity: formattedActivity,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { success: false, message: "대시보드 데이터를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
