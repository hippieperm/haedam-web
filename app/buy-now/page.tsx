"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/item-card";
import { Search, Filter, SortAsc, SortDesc, ShoppingCart } from "lucide-react";

interface Item {
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
}

export default function BuyNowPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: "LIVE",
        page: currentPage.toString(),
        limit: "12",
        sort: sortBy,
        hasBuyNow: "true", // 즉시구매 가능한 상품만
      });

      if (search) params.append("search", search);
      if (species) params.append("species", species);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);

      const response = await fetch(`/api/items?${params}`);
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

  useEffect(() => {
    fetchItems();
  }, [currentPage, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchItems();
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const speciesOptions = [
    "소나무",
    "주목",
    "진백",
    "흑송",
    "단풍",
    "벚나무",
    "은행나무",
    "느티나무",
    "참나무",
    "기타",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">즉시구매</h1>
          <p className="text-black">즉시구매가 설정된 분재를 바로 구매하세요</p>
        </div>

        {/* Features */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                즉시구매의 장점
              </h3>
              <ul className="text-green-800 space-y-1">
                <li>• 경매 대기 없이 바로 구매 가능</li>
                <li>• 고정된 가격으로 안정적인 구매</li>
                <li>• 즉시 결제 및 배송 처리</li>
                <li>• 다른 구매자와의 경쟁 없음</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search and Species */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  검색어
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="상품명, 수종, 설명으로 검색..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  수종
                </label>
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">전체</option>
                  {speciesOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  최소 가격 (원)
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  최대 가격 (원)
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="제한 없음"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex justify-end">
              <Button type="submit" className="px-8">
                검색
              </Button>
            </div>
          </form>
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="text-sm font-medium text-black">정렬:</span>
            <div className="flex space-x-2">
              <Button
                variant={sortBy === "newest" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortChange("newest")}
              >
                최신순
              </Button>
              <Button
                variant={sortBy === "price_asc" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortChange("price_asc")}
              >
                <SortAsc className="h-4 w-4 mr-1" />
                가격 낮은순
              </Button>
              <Button
                variant={sortBy === "price_desc" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortChange("price_desc")}
              >
                <SortDesc className="h-4 w-4 mr-1" />
                가격 높은순
              </Button>
            </div>
          </div>
          <div className="text-sm text-black">총 {items.length}개의 상품</div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ShoppingCart className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-black mb-2">
              즉시구매 가능한 상품이 없습니다
            </h3>
            <p className="text-black mb-4">
              다른 검색 조건을 시도하거나 경매 상품을 확인해보세요
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => {
                  setSearch("");
                  setSpecies("");
                  setMinPrice("");
                  setMaxPrice("");
                  setCurrentPage(1);
                  fetchItems();
                }}
              >
                필터 초기화
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auctions">경매 상품 보기</Link>
              </Button>
            </div>
          </div>
        )}

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
