# 🚀 분재경매 프로덕션 배포 가이드

## 📋 배포 전 체크리스트

### 1. 환경변수 설정

```bash
# .env.production 파일 생성
cp env.example .env.production

# 필수 환경변수 설정
DATABASE_URL="postgresql://username:password@your-db-host:5432/bonsai_auction"
JWT_SECRET="your-super-secure-jwt-secret-key"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-secure-admin-password"
EMAIL_API_KEY="your-sendgrid-api-key"
PAYMENT_API_KEY="your-toss-payment-api-key"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
SENTRY_DSN="your-sentry-dsn"
```

### 2. 데이터베이스 설정

```bash
# 프로덕션 데이터베이스 마이그레이션
npm run prisma:migrate:deploy

# 시드 데이터 생성 (선택사항)
npm run prisma:seed
```

## 🌐 배포 옵션

### 옵션 1: Vercel (권장)

1. **Vercel 계정 생성**: [vercel.com](https://vercel.com)
2. **GitHub 연동**: 프로젝트를 GitHub에 푸시
3. **환경변수 설정**: Vercel 대시보드에서 환경변수 추가
4. **자동 배포**: main 브랜치 푸시 시 자동 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### 옵션 2: AWS (EC2 + RDS)

1. **EC2 인스턴스 생성**: Ubuntu 20.04 LTS
2. **RDS PostgreSQL 생성**: Multi-AZ 설정
3. **Docker 설치 및 실행**:

```bash
# 서버 접속 후
sudo apt update
sudo apt install docker.io docker-compose

# 프로젝트 클론
git clone <your-repo>
cd haedam-web

# Docker 컨테이너 실행
docker-compose up -d
```

### 옵션 3: DigitalOcean App Platform

1. **App Platform 생성**: GitHub 연동
2. **환경변수 설정**: 대시보드에서 설정
3. **자동 배포**: 코드 푸시 시 자동 배포

## 🔧 프로덕션 최적화

### 1. Next.js 설정

```typescript
// next.config.ts
const nextConfig = {
  output: "standalone", // Docker용
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};
```

### 2. 데이터베이스 최적화

```sql
-- 인덱스 생성
CREATE INDEX CONCURRENTLY idx_items_status_ends_at ON items(status, ends_at);
CREATE INDEX CONCURRENTLY idx_bids_item_id_amount ON bids(item_id, amount DESC);
CREATE INDEX CONCURRENTLY idx_orders_buyer_id ON orders(buyer_id);
```

### 3. CDN 설정 (CloudFlare)

- **캐싱 규칙**: 정적 파일 1년, API 1분
- **보안 설정**: DDoS 보호, WAF 활성화
- **SSL/TLS**: Full (Strict) 모드

## 📊 모니터링 설정

### 1. Sentry 에러 추적

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

### 2. Google Analytics

```typescript
// lib/gtag.ts
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;
```

### 3. Uptime 모니터링

- **UptimeRobot**: 무료 5분 간격 체크
- **Pingdom**: 상세 성능 분석
- **New Relic**: APM (유료)

## 🔒 보안 설정

### 1. SSL 인증서

```bash
# Let's Encrypt (Certbot)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 2. 방화벽 설정

```bash
# UFW 설정
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 3. 보안 헤더 (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## 🚨 백업 전략

### 1. 데이터베이스 백업

```bash
# 자동 백업 스크립트
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
aws s3 cp backup_*.sql s3://your-backup-bucket/
```

### 2. 이미지 백업

- **S3 Cross-Region Replication**: 자동 복제
- **S3 Lifecycle**: 오래된 파일 아카이브

## 📈 성능 최적화

### 1. 이미지 최적화

```typescript
// next.config.ts
images: {
  formats: ['image/webp', 'image/avif'],
  minimumCacheTTL: 60,
}
```

### 2. Redis 캐싱

```typescript
// lib/redis.ts
import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL);
```

### 3. CDN 설정

- **CloudFlare**: 무료 CDN
- **AWS CloudFront**: 고성능 CDN
- **Vercel Edge Network**: 자동 CDN

## 🔄 CI/CD 파이프라인

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

## 📞 장애 대응

### 1. 모니터링 알림

- **Slack/Discord**: 에러 알림
- **이메일**: 중요 알림
- **SMS**: 긴급 알림 (PagerDuty)

### 2. 롤백 전략

```bash
# Vercel 롤백
vercel rollback <deployment-url>

# Docker 롤백
docker-compose down
docker-compose up -d --scale app=0
docker-compose up -d
```

## 💰 비용 최적화

### 1. 서버 비용

- **Vercel Pro**: $20/월 (권장)
- **AWS EC2 t3.micro**: $8/월
- **DigitalOcean Basic**: $12/월

### 2. 데이터베이스 비용

- **Vercel Postgres**: $20/월
- **AWS RDS t3.micro**: $15/월
- **PlanetScale**: $29/월

### 3. 스토리지 비용

- **AWS S3**: $0.023/GB/월
- **Cloudinary**: $89/월 (25GB)
- **Vercel Blob**: $0.15/GB/월

## 🎯 성공 지표 (KPI)

### 1. 기술적 지표

- **Uptime**: 99.9% 이상
- **응답시간**: 2초 이하
- **에러율**: 1% 이하

### 2. 비즈니스 지표

- **일일 활성 사용자**: DAU
- **경매 성공률**: 80% 이상
- **사용자 만족도**: 4.5/5 이상

---

## 🆘 문제 해결

### 자주 발생하는 문제들

1. **데이터베이스 연결 실패**

   ```bash
   # 연결 확인
   psql $DATABASE_URL
   ```

2. **이미지 업로드 실패**

   ```bash
   # S3 권한 확인
   aws s3 ls s3://your-bucket
   ```

3. **이메일 발송 실패**
   ```bash
   # SendGrid API 키 확인
   curl -X GET "https://api.sendgrid.com/v3/user/account" \
     -H "Authorization: Bearer $EMAIL_API_KEY"
   ```

### 지원 채널

- **GitHub Issues**: 버그 리포트
- **Slack**: 실시간 지원
- **이메일**: support@bonsai-auction.com
