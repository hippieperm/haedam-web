"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/item-card";
import {
  Gavel,
  ShoppingCart,
  TrendingUp,
  Shield,
  Clock,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { useState, useEffect } from "react";

interface Item {
  id: string;
  title: string;
  species: string;
  current_price: number;
  buy_now_price?: number;
  ends_at: string;
  status: string;
  seller: { nickname: string };
  media: { url: string }[];
  bids: any[];
  watchlists: any[];
}

export default function HomePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabase에서 상품 데이터 가져오기
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/items?status=LIVE&limit=4&sort=newest');
        const data = await response.json();
        
        if (data.success) {
          setItems(data.data.items || []);
        }
      } catch (error) {
        console.error('상품 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-green-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {user && (
              <div className="mb-6 p-4 bg-green-100 rounded-lg inline-block">
                <p className="text-lg text-green-800">
                  안녕하세요, <span className="font-bold">{user.nickname}</span>님!
                  분재경매에 오신 것을 환영합니다! 🎉
                </p>
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-bold text-black mb-6">
              전국 최대 규모
              <span className="text-green-600 block">분재 경매 플랫폼</span>
            </h1>
            <p className="text-xl text-black mb-8 max-w-3xl mx-auto">
              프리미엄 분재부터 초보자용까지, 다양한 분재를 경매와 즉시구매로
              만나보세요. 전문가가 검수한 신뢰할 수 있는 분재만을 제공합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Link href="/auctions" className="flex items-center">
                  <Gavel className="mr-2 h-5 w-5" />
                  경매 참여하기
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 border-green-200 text-green-700 bg-green-50 hover:border-green-400 hover:text-green-800 hover:bg-green-100 font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-sm"
              >
                <Link href="/buy-now" className="flex items-center">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  즉시구매
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              왜 분재경매를 선택해야 할까요?
            </h2>
            <p className="text-lg text-black">
              안전하고 투명한 거래로 최고의 분재 구매 경험을 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-black">전문가 검수</h3>
              <p className="text-black">
                모든 분재는 전문가의 꼼꼼한 검수를 거쳐 등록됩니다. 건강상태와
                품질을 보장합니다.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-black">실시간 경매</h3>
              <p className="text-black">
                실시간 입찰 시스템으로 공정하고 투명한 경매 진행. 자동연장으로
                충분한 입찰 기회를 제공합니다.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-black">신뢰할 수 있는 커뮤니티</h3>
              <p className="text-black">
                검증된 판매자와 구매자들로 구성된 안전한 거래 환경. 리뷰와 평점
                시스템으로 신뢰도를 확인하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Auctions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-black mb-2">인기 경매</h2>
              <p className="text-black">
                지금 가장 인기 있는 분재 경매를 확인해보세요
              </p>
            </div>
            <Button
              variant="outline"
              asChild
              className="border-2 border-green-200 text-green-700 bg-green-50 hover:border-green-400 hover:text-green-800 hover:bg-green-100 font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-sm"
            >
              <Link href="/auctions">전체보기</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // 로딩 스켈레톤
              [...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : items.length > 0 ? (
              items.map((item) => (
                <ItemCard 
                  key={item.id} 
                  item={{
                    id: item.id,
                    title: item.title,
                    species: item.species,
                    currentPrice: item.current_price,
                    buyNowPrice: item.buy_now_price,
                    endsAt: item.ends_at,
                    status: item.status,
                    coverImageUrl: item.media?.[0]?.url || "https://via.placeholder.com/400x400",
                    _count: { 
                      bids: item.bids?.length || 0, 
                      watchlists: item.watchlists?.length || 0 
                    },
                    seller: { nickname: item.seller?.nickname || "익명" },
                  }} 
                />
              ))
            ) : (
              // 등록된 상품이 없을 때
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Gavel className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">아직 등록된 경매가 없습니다</h3>
                  <p className="text-sm">첫 번째 분재를 등록해보세요!</p>
                </div>
                <Button asChild className="mt-4">
                  <Link href="/sell">상품 등록하기</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1,000+</div>
              <div className="text-green-100">성공한 경매</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-green-100">등록된 판매자</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-green-100">만족한 고객</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-lg text-black mb-8">
            회원가입하고 원하는 분재를 찾아보세요. 판매자로 등록하여 수익도
            창출할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Link href="/signup">무료 회원가입</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-2 border-green-200 text-green-700 bg-green-50 hover:border-green-400 hover:text-green-800 hover:bg-green-100 font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-sm"
            >
              <Link href="/sell">판매자 등록하기</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
