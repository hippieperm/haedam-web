"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertTriangle,
  Package,
  User,
} from "lucide-react";

interface Item {
  id: string;
  title: string;
  species: string;
  currentPrice: number;
  buyNowPrice?: number | null;
  status: string;
  coverImageUrl?: string | null;
  createdAt: string;
  seller: {
    id: string;
    nickname: string | null;
    name: string | null;
  };
  _count: {
    bids: number;
    watchlists: number;
  };
}

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchItems();
  }, [currentPage, statusFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: currentPage.toString(),
        limit: "20",
      });

      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/items?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data.items);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/items/${itemId}/approve`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        alert("상품이 승인되었습니다.");
        fetchItems();
      } else {
        alert(data.message || "승인에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to approve item:", error);
      alert("승인 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (itemId: string) => {
    const reason = prompt("거부 사유를 입력해주세요:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/items/${itemId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (data.success) {
        alert("상품이 거부되었습니다.");
        fetchItems();
      } else {
        alert(data.message || "거부에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to reject item:", error);
      alert("거부 중 오류가 발생했습니다.");
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING_REVIEW":
        return {
          text: "검수 대기",
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          icon: <Clock className="h-4 w-4" />,
        };
      case "LIVE":
        return {
          text: "진행중",
          color: "text-green-600",
          bgColor: "bg-green-100",
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case "ENDED":
        return {
          text: "종료됨",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          icon: <Package className="h-4 w-4" />,
        };
      case "CANCELED":
        return {
          text: "취소됨",
          color: "text-red-600",
          bgColor: "bg-red-100",
          icon: <XCircle className="h-4 w-4" />,
        };
      default:
        return {
          text: status,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          icon: <AlertTriangle className="h-4 w-4" />,
        };
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchItems();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                상품 관리
              </h1>
              <p className="text-gray-600">등록된 상품을 검수하고 관리하세요</p>
            </div>
            <Button asChild>
              <Link href="/admin">대시보드로 돌아가기</Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  검색어
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="상품명, 판매자로 검색..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="PENDING_REVIEW">검수 대기</option>
                  <option value="LIVE">진행중</option>
                  <option value="ENDED">종료됨</option>
                  <option value="CANCELED">취소됨</option>
                  <option value="ALL">전체</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  검색
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">상품을 불러오는 중...</p>
            </div>
          ) : items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상품 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      판매자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가격
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      통계
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => {
                    const statusInfo = getStatusInfo(item.status);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-16">
                              <Image
                                src={
                                  item.coverImageUrl ||
                                  "/placeholder-bonsai.jpg"
                                }
                                alt={item.title}
                                width={64}
                                height={64}
                                className="h-16 w-16 rounded-lg object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.species}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.seller.nickname ||
                                  item.seller.name ||
                                  "익명"}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {item.seller.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.currentPrice.toLocaleString()}원
                          </div>
                          {item.buyNowPrice && (
                            <div className="text-sm text-blue-600">
                              즉시: {item.buyNowPrice.toLocaleString()}원
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                          >
                            {statusInfo.icon}
                            <span className="ml-1">{statusInfo.text}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>입찰: {item._count.bids}</div>
                          <div>관심: {item._count.watchlists}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/items/${item.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                보기
                              </Link>
                            </Button>

                            {item.status === "PENDING_REVIEW" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(item.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  승인
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(item.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  거부
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                상품이 없습니다
              </h3>
              <p className="text-gray-500">
                선택한 조건에 맞는 상품이 없습니다.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                이전
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
