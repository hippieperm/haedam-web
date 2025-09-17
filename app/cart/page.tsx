"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Trash2,
  AlertCircle,
  CreditCard,
  Truck,
  Clock,
  Gavel,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CartItem {
  id: string;
  item: {
    id: string;
    title: string;
    species: string;
    currentPrice: number;
    buyNowPrice?: number | null;
    endsAt: string;
    status: string;
    coverImageUrl?: string | null;
    seller: {
      nickname: string | null;
    };
  };
  type: "BID" | "BUY_NOW" | "WATCH";
  addedAt: string;
  maxBidAmount?: number;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await fetch("/api/cart");
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      } else {
        setError(data.message || "장바구니를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setError("장바구니를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      } else {
        alert(data.message || "장바구니에서 제거하는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      alert("장바구니에서 제거하는 중 오류가 발생했습니다.");
    }
  };

  const clearCart = async () => {
    if (!confirm("장바구니를 비우시겠습니까?")) return;

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setItems([]);
        setSelectedItems(new Set());
      } else {
        alert(data.message || "장바구니를 비우는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
      alert("장바구니를 비우는 중 오류가 발생했습니다.");
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(items.map((item) => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const getSelectedItems = () => {
    return items.filter((item) => selectedItems.has(item.id));
  };

  const getTotalAmount = () => {
    return getSelectedItems().reduce((total, item) => {
      if (item.type === "BUY_NOW" && item.item.buyNowPrice) {
        return total + item.item.buyNowPrice;
      }
      return total;
    }, 0);
  };

  const handleCheckout = () => {
    const selected = getSelectedItems();
    if (selected.length === 0) {
      alert("구매할 상품을 선택해주세요.");
      return;
    }

    // 즉시구매 가능한 상품만 체크아웃
    const buyNowItems = selected.filter(
      (item) => item.type === "BUY_NOW" && item.item.buyNowPrice
    );
    if (buyNowItems.length === 0) {
      alert("즉시구매 가능한 상품이 없습니다.");
      return;
    }

    // 체크아웃 페이지로 이동 (구현 예정)
    alert("체크아웃 기능은 준비 중입니다.");
  };

  const getItemTypeInfo = (item: CartItem) => {
    switch (item.type) {
      case "BID":
        return {
          icon: <Gavel className="h-4 w-4" />,
          text: "입찰 예약",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        };
      case "BUY_NOW":
        return {
          icon: <ShoppingCart className="h-4 w-4" />,
          text: "즉시구매",
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      case "WATCH":
        return {
          icon: <Clock className="h-4 w-4" />,
          text: "관심상품",
          color: "text-purple-600",
          bgColor: "bg-purple-50",
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: "알 수 없음",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">장바구니를 불러오는 중...</p>
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
          <Button onClick={fetchCartItems}>다시 시도</Button>
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
                장바구니
              </h1>
              <p className="text-gray-600">
                선택한 상품들을 확인하고 구매하세요
              </p>
            </div>
            {items.length > 0 && (
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                전체 삭제
              </Button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ShoppingCart className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              장바구니가 비어있습니다
            </h3>
            <p className="text-gray-500 mb-4">
              관심있는 분재를 장바구니에 추가해보세요
            </p>
            <div className="flex justify-center space-x-4">
              <Button asChild>
                <Link href="/auctions">경매 상품 보기</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/buy-now">즉시구매 상품 보기</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Selection Controls */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedItems.size === items.length &&
                          items.length > 0
                        }
                        onChange={
                          selectedItems.size === items.length
                            ? deselectAll
                            : selectAll
                        }
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        전체 선택 ({selectedItems.size}/{items.length})
                      </span>
                    </label>
                  </div>
                  <div className="text-sm text-gray-500">
                    총 {items.length}개 상품
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {items.map((cartItem) => {
                  const typeInfo = getItemTypeInfo(cartItem);
                  const isSelected = selectedItems.has(cartItem.id);
                  const isLive = cartItem.item.status === "LIVE";

                  return (
                    <div
                      key={cartItem.id}
                      className={`bg-white rounded-lg shadow-sm p-4 border-2 transition-colors ${
                        isSelected
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItemSelection(cartItem.id)}
                          className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <div
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}
                                >
                                  {typeInfo.icon}
                                  <span className="ml-1">{typeInfo.text}</span>
                                </div>
                                {!isLive && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    종료됨
                                  </span>
                                )}
                              </div>

                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {cartItem.item.title}
                              </h3>

                              <p className="text-sm text-gray-500 mb-2">
                                {cartItem.item.species} •{" "}
                                {cartItem.item.seller.nickname || "익명"}
                              </p>

                              <div className="flex items-center space-x-4 text-sm">
                                <span className="text-lg font-bold text-green-600">
                                  {formatPrice(cartItem.item.currentPrice)}원
                                </span>
                                {cartItem.item.buyNowPrice && (
                                  <span className="text-blue-600">
                                    즉시구매:{" "}
                                    {formatPrice(cartItem.item.buyNowPrice)}원
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <div className="text-right text-sm text-gray-500">
                                <div>
                                  추가일:{" "}
                                  {new Date(
                                    cartItem.addedAt
                                  ).toLocaleDateString()}
                                </div>
                                {cartItem.maxBidAmount && (
                                  <div>
                                    최대입찰:{" "}
                                    {formatPrice(cartItem.maxBidAmount)}원
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => removeFromCart(cartItem.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                title="장바구니에서 제거"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center space-x-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/items/${cartItem.item.id}`}>
                                상세보기
                              </Link>
                            </Button>

                            {cartItem.type === "BID" && isLive && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  // 입찰 페이지로 이동 (구현 예정)
                                  alert("입찰 기능은 준비 중입니다.");
                                }}
                              >
                                입찰하기
                              </Button>
                            )}

                            {cartItem.type === "BUY_NOW" &&
                              cartItem.item.buyNowPrice &&
                              isLive && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // 즉시구매 처리 (구현 예정)
                                    alert("즉시구매 기능은 준비 중입니다.");
                                  }}
                                >
                                  즉시구매
                                </Button>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  주문 요약
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>선택된 상품</span>
                    <span>{selectedItems.size}개</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>즉시구매 가능</span>
                    <span>
                      {
                        getSelectedItems().filter(
                          (item) =>
                            item.type === "BUY_NOW" && item.item.buyNowPrice
                        ).length
                      }
                      개
                    </span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>총 금액</span>
                      <span className="text-green-600">
                        {formatPrice(getTotalAmount())}원
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={handleCheckout}
                      disabled={selectedItems.size === 0}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      선택 상품 구매하기
                    </Button>

                    <Button asChild variant="outline" className="w-full">
                      <Link href="/auctions">
                        <Gavel className="h-4 w-4 mr-2" />더 많은 상품 보기
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Help Text */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    구매 안내
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• 즉시구매 상품만 체크아웃이 가능합니다</li>
                    <li>• 입찰 예약은 개별 상품에서 진행하세요</li>
                    <li>• 관심상품은 알림을 받을 수 있습니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
