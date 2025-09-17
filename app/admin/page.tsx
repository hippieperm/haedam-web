"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Users,
  Package,
  Gavel,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  BarChart3,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalItems: number;
  liveAuctions: number;
  totalRevenue: number;
  pendingReviews: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-black">대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            관리자 대시보드
          </h1>
          <p className="text-black">분재경매 플랫폼 관리 현황을 확인하세요</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-black">총 사용자</p>
                <p className="text-2xl font-bold text-black">
                  {stats?.totalUsers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-black">총 상품</p>
                <p className="text-2xl font-bold text-black">
                  {stats?.totalItems || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Gavel className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-black">진행중인 경매</p>
                <p className="text-2xl font-bold text-black">
                  {stats?.liveAuctions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-black">총 매출</p>
                <p className="text-2xl font-bold text-black">
                  {(stats?.totalRevenue || 0).toLocaleString()}원
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pending Reviews */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">
                검수 대기 상품
              </h2>
              <div className="flex items-center text-orange-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span className="text-2xl font-bold">
                  {stats?.pendingReviews || 0}
                </span>
              </div>
            </div>
            <p className="text-black mb-4">
              관리자 검수를 기다리는 상품이 있습니다.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/items">상품 검수하기</Link>
            </Button>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-black mb-4">최근 활동</h2>
            <div className="space-y-3">
              {stats?.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-black truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-black">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!stats?.recentActivity ||
                stats.recentActivity.length === 0) && (
                <p className="text-black text-sm">최근 활동이 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-black">사용자 관리</h3>
            </div>
            <p className="text-black mb-4">회원 정보, 권한 관리, 제재 처리</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/users">사용자 관리하기</Link>
            </Button>
          </div>

          {/* Item Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Package className="h-6 w-6 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-black">상품 관리</h3>
            </div>
            <p className="text-black mb-4">
              상품 검수, 승인/거부, 카테고리 관리
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/items">상품 관리하기</Link>
            </Button>
          </div>

          {/* Auction Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Gavel className="h-6 w-6 text-orange-600 mr-3" />
              <h3 className="text-lg font-semibold text-black">경매 관리</h3>
            </div>
            <p className="text-black mb-4">경매 시작/중단, 입찰 관리, 정산</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/auctions">경매 관리하기</Link>
            </Button>
          </div>

          {/* Financial Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-6 w-6 text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold text-black">정산 관리</h3>
            </div>
            <p className="text-black mb-4">수수료 정산, 지급 관리, 수익 분석</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/finance">정산 관리하기</Link>
            </Button>
          </div>

          {/* Reports Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-black">신고 관리</h3>
            </div>
            <p className="text-black mb-4">신고 처리, 분쟁 해결, 제재 관리</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/reports">신고 관리하기</Link>
            </Button>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-6 w-6 text-indigo-600 mr-3" />
              <h3 className="text-lg font-semibold text-black">분석 및 통계</h3>
            </div>
            <p className="text-black mb-4">사용자 분석, 매출 통계, 성과 지표</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/analytics">분석 보기</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
