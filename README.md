# 분재경매 - Bonsai Auction Platform

전국 최대 규모의 분재 경매 및 즉시구매 플랫폼입니다. 분재 애호가들이 안전하고 투명하게 거래할 수 있는 온라인 마켓플레이스를 제공합니다.

## 🌱 주요 기능

### 👥 사용자 관리
- 이메일/비밀번호 회원가입 및 로그인
- JWT 기반 인증 시스템
- 사용자 권한 관리 (일반회원/판매자/관리자)
- 프로필 관리 및 주소록

### 🏛️ 관리자 기능
- 상품 검수 및 승인/거부
- 경매 관리 (시작/중단/종료)
- 사용자 관리 및 제재
- 신고 처리 및 분쟁 해결
- 감사 로그 추적

### 🎯 경매 시스템
- 실시간 입찰 시스템
- 프록시 입찰 (자동 입찰)
- 자동연장 (안티 스나이핑)
- 예약가 설정
- 즉시구매 옵션

### 🛍️ 상품 관리
- 상세한 분재 정보 (수종, 수형, 크기, 수령 등)
- 다중 이미지/동영상 업로드
- 태그 시스템
- 관심목록 (찜하기)
- 검색 및 필터링

### 💳 결제 및 정산
- 다양한 결제 수단 지원
- 구매자 프리미엄 및 판매자 수수료
- 자동 정산 시스템
- 에스크로 서비스

### 📱 알림 시스템
- 입찰 경쟁 알림
- 경매 시작/종료 알림
- 결제 및 배송 상태 알림
- 이메일/푸시 알림

## 🛠️ 기술 스택

### Frontend
- **Next.js 15** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 유틸리티 CSS 프레임워크
- **Lucide React** - 아이콘 라이브러리
- **React Hook Form** - 폼 관리
- **Zod** - 스키마 검증

### Backend
- **Next.js API Routes** - 서버리스 API
- **Prisma** - ORM
- **PostgreSQL** - 데이터베이스
- **JWT (jose)** - 인증
- **bcryptjs** - 비밀번호 해싱

### DevOps & Tools
- **Docker** - 컨테이너화
- **Vercel** - 배포 플랫폼
- **GitHub Actions** - CI/CD

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+
- PostgreSQL 12+
- npm 또는 yarn

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd bonsai-auction
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.example`을 복사하여 `.env.local` 파일을 생성하고 필요한 값들을 설정하세요.

```bash
cp .env.example .env.local
```

주요 환경 변수:
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `JWT_SECRET`: JWT 서명용 시크릿
- `ADMIN_USERNAME`: 관리자 아이디
- `ADMIN_PASSWORD`: 관리자 비밀번호

### 4. 데이터베이스 설정
```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션
npm run prisma:migrate

# 시드 데이터 생성
npm run prisma:seed
```

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📁 프로젝트 구조

```
bonsai-auction/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈페이지
├── components/            # React 컴포넌트
│   ├── ui/               # 재사용 가능한 UI 컴포넌트
│   ├── header.tsx        # 헤더 컴포넌트
│   └── footer.tsx        # 푸터 컴포넌트
├── lib/                  # 유틸리티 및 설정
│   ├── auth.ts          # 인증 로직
│   ├── prisma.ts        # Prisma 클라이언트
│   ├── utils.ts         # 공통 유틸리티
│   ├── middleware/      # 미들웨어
│   ├── services/        # 비즈니스 로직
│   └── validations/     # 스키마 검증
├── prisma/              # Prisma 설정
│   ├── schema.prisma    # 데이터베이스 스키마
│   └── seed.ts          # 시드 데이터
└── public/              # 정적 파일
```

## 🗄️ 데이터베이스 스키마

주요 테이블:
- **users**: 사용자 정보
- **items**: 분재 상품 정보
- **bids**: 입찰 내역
- **orders**: 주문 정보
- **notifications**: 알림
- **audit_logs**: 감사 로그

자세한 스키마는 `prisma/schema.prisma` 파일을 참고하세요.

## 🔐 보안 고려사항

- JWT 토큰 기반 인증
- 비밀번호 해싱 (bcrypt)
- 입력값 검증 (Zod)
- CSRF 보호
- 레이트 리미팅
- 관리자 권한 분리

## 📜 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 연락처

프로젝트 관련 문의: [이메일 주소]

프로젝트 링크: [https://github.com/your-username/bonsai-auction](https://github.com/your-username/bonsai-auction)
