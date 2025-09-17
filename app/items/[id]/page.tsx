"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Eye,
  Clock,
  Gavel,
  ShoppingCart,
  Share2,
  Flag,
  Star,
  MapPin,
  Truck,
} from "lucide-react";
import { formatPrice, formatTimeRemaining } from "@/lib/utils";

interface Item {
  id: string;
  title: string;
  description?: string;
  species: string;
  style?: string;
  sizeClass?: string;
  heightCm?: number;
  crownWidthCm?: number;
  trunkDiameterCm?: number;
  ageYearsEst?: number;
  healthNotes?: string;
  originNotes?: string;
  careHistory?: string;
  coverImageUrl?: string;
  status: string;
  startPrice: number;
  currentPrice: number;
  buyNowPrice?: number;
  reservePrice?: number;
  bidStep: number;
  startsAt: string;
  endsAt: string;
  autoExtendMinutes?: number;
  shippingMethod: string;
  shippingFeePolicy?: string;
  packagingNotes?: string;
  viewCount: number;
  createdAt: string;
  seller: {
    id: string;
    nickname?: string;
    name?: string;
    profileImage?: string;
  };
  media: Array<{
    id: string;
    url: string;
    type: string;
    caption?: string;
  }>;
  bids: Array<{
    id: string;
    amount: number;
    bidder: {
      nickname?: string;
    };
    createdAt: string;
  }>;
  _count: {
    bids: number;
    watchlists: number;
  };
}

export default function ItemDetailPage() {
  const params = useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [isWatching, setIsWatching] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBidModal, setShowBidModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/items/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setItem(data.data);
        setIsWatching(data.data._count.watchlists > 0);
      }
    } catch (error) {
      console.error("Failed to fetch item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async () => {
    if (!item || !bidAmount) return;

    try {
      const response = await fetch(`/api/items/${item.id}/bid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(bidAmount),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowBidModal(false);
        setBidAmount("");
        fetchItem(); // Refresh item data
      } else {
        alert(data.message || "입찰에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to place bid:", error);
      alert("입찰 중 오류가 발생했습니다.");
    }
  };

  const handleBuyNow = async () => {
    if (!item || !item.buyNowPrice) return;

    if (
      confirm(
        `정말로 ${formatPrice(item.buyNowPrice)}원에 즉시구매하시겠습니까?`
      )
    ) {
      try {
        const response = await fetch(`/api/items/${item.id}/buy-now`, {
          method: "POST",
        });

        const data = await response.json();

        if (data.success) {
          alert("즉시구매가 완료되었습니다.");
          fetchItem(); // Refresh item data
        } else {
          alert(data.message || "즉시구매에 실패했습니다.");
        }
      } catch (error) {
        console.error("Failed to buy now:", error);
        alert("즉시구매 중 오류가 발생했습니다.");
      }
    }
  };

  const toggleWatchlist = async () => {
    if (!item) return;

    try {
      const response = await fetch(`/api/items/${item.id}/watchlist`, {
        method: isWatching ? "DELETE" : "POST",
      });

      const data = await response.json();

      if (data.success) {
        setIsWatching(!isWatching);
        fetchItem(); // Refresh item data
      }
    } catch (error) {
      console.error("Failed to toggle watchlist:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">상품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            상품을 찾을 수 없습니다
          </h1>
          <p className="text-gray-600 mb-4">
            요청하신 상품이 존재하지 않거나 삭제되었습니다.
          </p>
          <Button asChild>
            <Link href="/auctions">경매 목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isLive = item.status === "LIVE";
  const timeRemaining = isLive ? formatTimeRemaining(item.endsAt) : null;
  const images = item.media.filter((m) => m.type === "IMAGE");
  const displayImages = item.coverImageUrl
    ? [item.coverImageUrl, ...images.map((m) => m.url)]
    : images.map((m) => m.url);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square relative bg-white rounded-lg overflow-hidden">
              <Image
                src={displayImages[selectedImage] || "/placeholder-bonsai.jpg"}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {isLive && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  경매중
                </div>
              )}
            </div>

            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square relative rounded-lg overflow-hidden ${
                      selectedImage === index ? "ring-2 ring-green-500" : ""
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${item.title} ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 12.5vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {item.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span>조회수 {item.viewCount}</span>
                <span>•</span>
                <span>입찰 {item._count.bids}회</span>
                <span>•</span>
                <span>관심 {item._count.watchlists}명</span>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-white rounded-lg p-6 border">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-700">
                    현재가
                  </span>
                  <span className="text-3xl font-bold text-green-600">
                    {formatPrice(item.currentPrice)}원
                  </span>
                </div>

                {item.buyNowPrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-gray-700">
                      즉시구매가
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(item.buyNowPrice)}원
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>시작가</span>
                  <span>{formatPrice(item.startPrice)}원</span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>입찰 단위</span>
                  <span>{formatPrice(item.bidStep)}원</span>
                </div>

                {isLive && timeRemaining && (
                  <div className="flex items-center text-red-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="font-medium">{timeRemaining}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isLive ? (
                <>
                  <Button
                    onClick={() => setShowBidModal(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Gavel className="h-5 w-5 mr-2" />
                    입찰하기
                  </Button>
                  {item.buyNowPrice && (
                    <Button
                      onClick={handleBuyNow}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      즉시구매
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">이 경매는 종료되었습니다</p>
                  <Button variant="outline" asChild>
                    <Link href="/auctions">다른 경매 보기</Link>
                  </Button>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={toggleWatchlist}
                  variant={isWatching ? "default" : "outline"}
                  className="flex-1"
                >
                  <Heart
                    className={`h-4 w-4 mr-2 ${
                      isWatching ? "fill-current" : ""
                    }`}
                  />
                  {isWatching ? "관심목록에서 제거" : "관심목록에 추가"}
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  공유
                </Button>
                <Button variant="outline">
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-4">판매자 정보</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {item.seller.profileImage ? (
                    <Image
                      src={item.seller.profileImage}
                      alt={item.seller.nickname || "판매자"}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="text-gray-500 font-medium">
                      {item.seller.nickname?.[0] || "?"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {item.seller.nickname || item.seller.name || "익명"}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Star className="h-4 w-4 mr-1" />
                    <span>평점 4.8 (24)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Item Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">상품 상세 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">수종</span>
                  <p className="font-medium">{item.species}</p>
                </div>
                {item.style && (
                  <div>
                    <span className="text-gray-600">수형</span>
                    <p className="font-medium">{item.style}</p>
                  </div>
                )}
                {item.sizeClass && (
                  <div>
                    <span className="text-gray-600">크기 분류</span>
                    <p className="font-medium">{item.sizeClass}</p>
                  </div>
                )}
                {item.heightCm && (
                  <div>
                    <span className="text-gray-600">높이</span>
                    <p className="font-medium">{item.heightCm}cm</p>
                  </div>
                )}
                {item.crownWidthCm && (
                  <div>
                    <span className="text-gray-600">수관폭</span>
                    <p className="font-medium">{item.crownWidthCm}cm</p>
                  </div>
                )}
                {item.trunkDiameterCm && (
                  <div>
                    <span className="text-gray-600">간경</span>
                    <p className="font-medium">{item.trunkDiameterCm}cm</p>
                  </div>
                )}
                {item.ageYearsEst && (
                  <div>
                    <span className="text-gray-600">추정 수령</span>
                    <p className="font-medium">{item.ageYearsEst}년</p>
                  </div>
                )}
              </div>
            </div>

            {item.description && (
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">상품 설명</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}

            {item.healthNotes && (
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">건강 상태</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {item.healthNotes}
                </p>
              </div>
            )}

            {item.careHistory && (
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">관리 이력</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {item.careHistory}
                </p>
              </div>
            )}
          </div>

          {/* Bidding History */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">입찰 현황</h3>
              <div className="space-y-3">
                {item.bids.slice(0, 10).map((bid, index) => (
                  <div
                    key={bid.id}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">{formatPrice(bid.amount)}원</p>
                      <p className="text-sm text-gray-500">
                        {bid.bidder.nickname || "익명"}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(bid.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
                {item.bids.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    아직 입찰이 없습니다
                  </p>
                )}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">배송 정보</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Truck className="h-4 w-4 mr-2 text-gray-400" />
                  <span>배송 방법: {item.shippingMethod}</span>
                </div>
                {item.shippingFeePolicy && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{item.shippingFeePolicy}</span>
                  </div>
                )}
                {item.packagingNotes && (
                  <p className="text-sm text-gray-600 mt-2">
                    {item.packagingNotes}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">입찰하기</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  입찰 금액 (원)
                </label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`최소 ${formatPrice(
                    item.currentPrice + item.bidStep
                  )}원`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  최소 입찰가: {formatPrice(item.currentPrice + item.bidStep)}원
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowBidModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleBid}
                  className="flex-1"
                  disabled={
                    !bidAmount ||
                    parseFloat(bidAmount) < item.currentPrice + item.bidStep
                  }
                >
                  입찰하기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
