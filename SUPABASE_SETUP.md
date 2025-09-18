# Supabase 설정 가이드

이 가이드는 분재경매 플랫폼을 Supabase로 설정하는 방법을 안내합니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `bonsai-auction`
   - Database Password: 강력한 비밀번호 설정
   - Region: `Asia Northeast (Seoul)` 선택
4. "Create new project" 클릭

## 2. 데이터베이스 스키마 설정

1. Supabase 대시보드에서 "SQL Editor" 메뉴 선택
2. "New query" 클릭
3. `supabase/schema.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 스키마 생성

## 3. API 키 확인

1. "Settings" → "API" 메뉴 선택
2. 다음 정보를 복사하여 `.env.local`에 설정:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`

## 4. Storage 버킷 생성

1. "Storage" 메뉴 선택
2. "Create a new bucket" 클릭
3. 다음 버킷들을 생성:

### item-media 버킷
- Name: `item-media`
- Public: ✅ (체크)
- File size limit: `50MB`
- Allowed MIME types: `image/*, video/*`

### profile-images 버킷
- Name: `profile-images`
- Public: ✅ (체크)
- File size limit: `10MB`
- Allowed MIME types: `image/*`

### temp-uploads 버킷
- Name: `temp-uploads`
- Public: ❌ (체크 해제)
- File size limit: `50MB`
- Allowed MIME types: `image/*, video/*`

## 5. RLS (Row Level Security) 정책 확인

스키마 실행 시 자동으로 RLS 정책이 생성됩니다. 필요에 따라 추가 정책을 설정할 수 있습니다.

## 6. 관리자 계정 생성

1. "Authentication" → "Users" 메뉴 선택
2. "Add user" 클릭
3. 관리자 이메일과 비밀번호 입력
4. 생성된 사용자의 UUID를 복사
5. SQL Editor에서 다음 쿼리 실행:

```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE id = '관리자_UUID';
```

## 7. 이메일 설정 (선택사항)

1. "Authentication" → "Settings" 메뉴 선택
2. "SMTP Settings" 섹션에서 이메일 서비스 설정
3. 또는 "Email Templates"에서 이메일 템플릿 커스터마이징

## 8. 환경 변수 설정

`.env.local` 파일에 다음 내용 추가:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# 관리자 계정
ADMIN_EMAIL="admin@bonsai-auction.com"
ADMIN_PASSWORD="your-admin-password"

# 이메일 서비스 (선택사항)
EMAIL_API_KEY="your-email-api-key"
EMAIL_FROM="noreply@bonsai-auction.com"

# 결제 시스템 (선택사항)
PAYMENT_API_KEY="your-payment-api-key"
PAYMENT_SECRET_KEY="your-payment-secret-key"

# 도메인
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# 개발/프로덕션 환경
NODE_ENV="development"
```

## 9. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 확인하세요.

## 10. 문제 해결

### 일반적인 문제들

1. **RLS 정책 오류**: 사용자 권한이 올바르게 설정되었는지 확인
2. **Storage 업로드 실패**: 버킷 권한과 MIME 타입 설정 확인
3. **인증 오류**: API 키가 올바르게 설정되었는지 확인

### 유용한 리소스

- [Supabase 문서](https://supabase.com/docs)
- [Next.js + Supabase 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth 가이드](https://supabase.com/docs/guides/auth)
- [Supabase Storage 가이드](https://supabase.com/docs/guides/storage)
