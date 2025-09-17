"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/item-card";
import { Heart, Trash2, AlertCircle, Clock, Gavel } from "lucide-react";

interface WatchlistItem {
  id: string;
  createdAt: string;
  item: {
    id: string;
    title: string;
    species: string;
    currentPrice: number;
    buyNowPrice?: number | null;
    endsAt: string;
    status: string;
    coverImageUrl?: string | null;
    media?: { url: string }[];
    _count: {
      bids: number;
      watchlists: number;
    };
    seller: {
      nickname: string | null;
    };
  };
}

export default function WishlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const response = await fetch("/api/wishlist");
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      } else {
        setError(data.message || "관심목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
      setError("관심목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}/watchlist`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setItems((prev) => prev.filter((item) => item.item.id !== itemId));
      } else {
        alert(data.message || "관심목록에서 제거하는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
      alert("관심목록에서 제거하는 중 오류가 발생했습니다.");
    }
  };

  const clearAllWatchlist = async () => {
    if (!confirm("모든 관심목록을 제거하시겠습니까?")) return;

    try {
      const response = await fetch("/api/wishlist", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setItems([]);
      } else {
        alert(data.message || "관심목록을 비우는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to clear watchlist:", error);
      alert("관심목록을 비우는 중 오류가 발생했습니다.");
    }
  };

  const getStatusInfo = (item: WatchlistItem["item"]) => {
    const now = new Date();
    const endsAt = new Date(item.endsAt);
    const isLive = item.status === "LIVE";
    const isEnded = endsAt < now;

    if (!isLive) {
      return { status: "ended", text: "종료됨", color: "text-gray-500" };
    }

    if (isEnded) {
      return { status: "ended", text: "종료됨", color: "text-gray-500" };
    }

    const timeLeft = endsAt.getTime() - now.getTime();
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursLeft < 1) {
      return {
        status: "ending-soon",
        text: `${minutesLeft}분 남음`,
        color: "text-red-600",
      };
    }

    if (hoursLeft < 24) {
      return {
        status: "ending-today",
        text: `${hoursLeft}시간 남음`,
        color: "text-orange-600",
      };
    }

    return {
      status: "live",
      text: "진행중",
      color: "text-green-600",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관심목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            오류가 발생했습니다
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchWatchlist}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                관심목록
              </h1>
              <p className="text-gray-600">
                관심있는 분재 경매를 한눈에 확인하세요
              </p>
            </div>
            {items.length > 0 && (
              <Button
                variant="outline"
                onClick={clearAllWatchlist}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                전체 삭제
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {items.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {items.length}
                </div>
                <div className="text-sm text-gray-500">총 관심상품</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {items.filter((item) => item.item.status === "LIVE").length}
                </div>
                <div className="text-sm text-gray-500">진행중인 경매</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {
                    items.filter((item) => {
                      const now = new Date();
                      const endsAt = new Date(item.item.endsAt);
                      const timeLeft = endsAt.getTime() - now.getTime();
                      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                      return item.item.status === "LIVE" && hoursLeft < 24;
                    }).length
                  }
                </div>
                <div className="text-sm text-gray-500">오늘 마감</div>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Heart className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              관심목록이 비어있습니다
            </h3>
            <p className="text-gray-500 mb-4">
              마음에 드는 분재를 관심목록에 추가해보세요
            </p>
            <Button asChild>
              <Link href="/auctions">경매 상품 보기</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Live Auctions */}
            {items.filter((item) => item.item.status === "LIVE").length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Gavel className="h-5 w-5 mr-2 text-green-600" />
                  진행중인 경매
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items
                    .filter((item) => item.item.status === "LIVE")
                    .map((watchlistItem) => {
                      const statusInfo = getStatusInfo(watchlistItem.item);
                      return (
                        <div key={watchlistItem.id} className="relative">
                          <ItemCard item={watchlistItem.item} />
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium bg-white ${statusInfo.color}`}
                            >
                              {statusInfo.text}
                            </div>
                            <button
                              onClick={() =>
                                removeFromWatchlist(watchlistItem.item.id)
                              }
                              className="p-1 bg-white rounded-full shadow-sm hover:bg-red-50 text-gray-400 hover:text-red-600"
                              title="관심목록에서 제거"
                            >
                              <Heart className="h-4 w-4 fill-current" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Ended Auctions */}
            {items.filter((item) => item.item.status !== "LIVE").length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  종료된 경매
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items
                    .filter((item) => item.item.status !== "LIVE")
                    .map((watchlistItem) => (
                      <div key={watchlistItem.id} className="relative">
                        <div className="opacity-60">
                          <ItemCard item={watchlistItem.item} />
                        </div>
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <div className="px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-500">
                            종료됨
                          </div>
                          <button
                            onClick={() =>
                              removeFromWatchlist(watchlistItem.item.id)
                            }
                            className="p-1 bg-white rounded-full shadow-sm hover:bg-red-50 text-gray-400 hover:text-red-600"
                            title="관심목록에서 제거"
                          >
                            <Heart className="h-4 w-4 fill-current" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {items.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              빠른 액션
            </h3>
            <div className="flex flex-wrap gap-4">
              <Button asChild variant="outline">
                <Link href="/auctions">
                  <Gavel className="h-4 w-4 mr-2" />
                  모든 경매 보기
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/buy-now">
                  <Heart className="h-4 w-4 mr-2" />
                  즉시구매 상품 보기
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // 관심목록을 이메일로 공유하는 기능 (구현 예정)
                  alert("이메일 공유 기능은 준비 중입니다.");
                }}
              >
                <Heart className="h-4 w-4 mr-2" />
                이메일로 공유
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
