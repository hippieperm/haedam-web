"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, User, ShoppingCart, Heart } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-green-600">
              분재경매
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="분재를 검색하세요..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/auctions" className="text-black hover:text-green-600">
              경매
            </Link>
            <Link href="/buy-now" className="text-black hover:text-green-600">
              즉시구매
            </Link>
            <Link href="/sell" className="text-black hover:text-green-600">
              판매하기
            </Link>
            <Link href="/wishlist" className="text-black hover:text-green-600">
              <Heart className="h-5 w-5" />
            </Link>
            <Link href="/cart" className="text-black hover:text-green-600">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild className="text-black">
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild className="text-black">
              <Link href="/signup">회원가입</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="분재를 검색하세요..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <Link
                href="/auctions"
                className="block px-3 py-2 text-black hover:text-green-600"
                onClick={() => setIsMenuOpen(false)}
              >
                경매
              </Link>
              <Link
                href="/buy-now"
                className="block px-3 py-2 text-black hover:text-green-600"
                onClick={() => setIsMenuOpen(false)}
              >
                즉시구매
              </Link>
              <Link
                href="/sell"
                className="block px-3 py-2 text-black hover:text-green-600"
                onClick={() => setIsMenuOpen(false)}
              >
                판매하기
              </Link>
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-black"
                    asChild
                  >
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      로그인
                    </Link>
                  </Button>
                  <Button className="w-full text-black" asChild>
                    <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                      회원가입
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
