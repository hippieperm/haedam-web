import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="text-2xl font-bold text-green-400 mb-4">
              분재경매
            </div>
            <p className="text-gray-300 mb-4">
              전국 최대 규모의 분재 경매 플랫폼
            </p>
            <div className="text-sm text-gray-300">
              <p>대표: 환기님</p>
              <p>사업자등록번호: 123-45-67890</p>
              <p>통신판매업신고: 제2024-서울강남-00000호</p>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">서비스</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link
                  href="/auctions"
                  className="hover:text-green-400 transition-colors"
                >
                  경매
                </Link>
              </li>
              <li>
                <Link
                  href="/buy-now"
                  className="hover:text-green-400 transition-colors"
                >
                  즉시구매
                </Link>
              </li>
              <li>
                <Link
                  href="/sell"
                  className="hover:text-green-400 transition-colors"
                >
                  판매하기
                </Link>
              </li>
              <li>
                <Link
                  href="/guide"
                  className="hover:text-green-400 transition-colors"
                >
                  이용가이드
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">고객지원</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link
                  href="/faq"
                  className="hover:text-green-400 transition-colors"
                >
                  자주묻는질문
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-green-400 transition-colors"
                >
                  문의하기
                </Link>
              </li>
              <li>
                <Link
                  href="/notice"
                  className="hover:text-green-400 transition-colors"
                >
                  공지사항
                </Link>
              </li>
              <li>
                <p>고객센터: 1588-1234</p>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">약관 및 정책</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-green-400 transition-colors"
                >
                  이용약관
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-green-400 transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link
                  href="/auction-policy"
                  className="hover:text-green-400 transition-colors"
                >
                  경매정책
                </Link>
              </li>
              <li>
                <Link
                  href="/dispute"
                  className="hover:text-green-400 transition-colors"
                >
                  분쟁해결
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2024 분재경매. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
