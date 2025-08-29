# StudyHub 배포 가이드

## 개요

StudyHub의 로컬 개발부터 프로덕션 배포까지의 전체 가이드입니다.

---

## 🏠 로컬 개발 환경 설정

### 1. 시스템 요구사항

```bash
Node.js: >= 18.17.0 (권장: 20.x)
npm: >= 9.0.0
Git: 최신 버전
```

### 2. 프로젝트 클론

```bash
# 저장소 클론
git clone https://github.com/blcktgr73/StudyBlog.git
cd StudyBlog/studyhub

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 실제 값 입력
```

### 3. 개발 서버 실행

```bash
# 개발 서버 시작 (Turbopack 사용)
npm run dev

# 브라우저에서 확인
open http://localhost:3000
```

### 4. 개발용 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작 (빌드 후)
npm run start

# 린트 검사
npm run lint

# 타입 체크
npm run type-check

# 모든 검사 실행
npm run lint && npm run type-check && npm run build
```

---

## 🔧 환경 변수 설정

### .env.example
```bash
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# GitHub OAuth (소셜 로그인)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key

# Upload Settings
NEXT_PUBLIC_MAX_FILE_SIZE=5242880
NEXT_PUBLIC_ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp

# App Settings
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=StudyHub
```

### 환경별 설정

#### Development (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Production (.env.production)
```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://study-blog-gamma.vercel.app
```

---

## 🚀 Vercel 배포

### 1. Vercel CLI 설치 및 로그인

```bash
# Vercel CLI 설치
npm install -g vercel

# Vercel 로그인
vercel login
```

### 2. 첫 배포

```bash
# studyhub 디렉토리에서 실행
cd studyhub
vercel

# 프로젝트 설정
? What's your project's name? studyhub
? In which directory is your code located? ./
? Want to override the settings? [y/N] n

# 프로덕션 배포
vercel --prod
```

### 3. Vercel 웹 UI를 통한 배포

1. **https://vercel.com** 접속 및 GitHub 로그인
2. **"New Project"** 클릭
3. **StudyBlog** 저장소 선택
4. **배포 설정**:
   ```
   Framework Preset: Next.js
   Root Directory: studyhub
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   Development Command: npm run dev
   ```
5. **환경 변수 설정**: Production 환경에 필요한 환경변수 입력
6. **Deploy** 클릭

### 4. 환경 변수 설정 (Vercel Dashboard)

```bash
# CLI로 환경변수 설정
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add NEXTAUTH_SECRET
# ... 기타 필요한 환경변수들

# 또는 Vercel Dashboard > Settings > Environment Variables에서 설정
```

### 5. 자동 배포 설정

Vercel은 기본적으로 GitHub과 연동하여 자동 배포됩니다:
- **main 브랜치 푸시** → 프로덕션 배포
- **기타 브랜치 푸시** → 프리뷰 배포

---

## 🌐 도메인 설정

### 1. 커스텀 도메인 추가

```bash
# CLI로 도메인 추가
vercel domains add studyhub.com

# 또는 Vercel Dashboard > Domains에서 설정
```

### 2. DNS 설정

도메인 제공업체에서 다음 레코드 추가:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

### 3. SSL 인증서

Vercel이 자동으로 Let's Encrypt SSL 인증서를 발급합니다.

---

## 🔍 모니터링 및 로깅

### 1. Vercel Analytics

```typescript
// next.config.js에 추가
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@node-rs/argon2'],
  },
  // Vercel Analytics 활성화
  poweredByHeader: false,
  generateEtags: false,
};
```

### 2. 성능 모니터링

- **Vercel Speed Insights**: 자동 활성화
- **Core Web Vitals**: Vercel Dashboard에서 확인
- **Function Logs**: API 라우트 로그 확인

### 3. 오류 추적 (선택적)

```bash
# Sentry 설치 (선택적)
npm install @sentry/nextjs

# next.config.js에 Sentry 설정 추가
const { withSentryConfig } = require('@sentry/nextjs');
```

---

## 🗄️ 데이터베이스 배포 (Supabase)

### 1. Supabase 프로젝트 생성

1. **https://supabase.com** 접속
2. **New Project** 생성
3. 프로젝트 설정 완료 후 **API URL**과 **anon key** 복사

### 2. 데이터베이스 스키마 적용

```bash
# Drizzle ORM 설정 후
npm run db:generate
npm run db:migrate
```

### 3. Row Level Security (RLS) 설정

```sql
-- users 테이블 RLS 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- posts 테이블 RLS 정책
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts" ON posts
  FOR SELECT USING (published = true);

CREATE POLICY "Authors can manage own posts" ON posts
  FOR ALL USING (auth.uid() = author_id);
```

---

## 🔄 CI/CD 파이프라인

### GitHub Actions 설정 (선택적)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: studyhub/package-lock.json
      
      - name: Install dependencies
        run: |
          cd studyhub
          npm ci
      
      - name: Run tests
        run: |
          cd studyhub
          npm run lint
          npm run type-check
      
      - name: Build project
        run: |
          cd studyhub
          npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: studyhub
```

---

## 🔧 트러블슈팅

### 일반적인 문제들

#### 1. 빌드 실패
```bash
# 캐시 초기화
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

#### 2. 환경 변수 문제
```bash
# 로컬에서 환경변수 확인
printenv | grep SUPABASE
printenv | grep NEXTAUTH

# Vercel에서 환경변수 확인
vercel env ls
```

#### 3. TypeScript 오류
```bash
# 타입 체크
npm run type-check

# 의존성 타입 설치
npm install @types/node --save-dev
```

#### 4. 권한 문제
```bash
# 파일 권한 확인 (Linux/Mac)
chmod +x node_modules/.bin/next

# Windows에서 권한 문제시
npm run build -- --experimental-build-mode=compile
```

### Vercel 특정 문제들

#### 1. 함수 타임아웃
```typescript
// vercel.json 설정
{
  "functions": {
    "studyhub/src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

#### 2. 파일 크기 제한
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
      ],
    },
  },
};
```

#### 3. Edge Runtime 이슈
```typescript
// API 라우트에서 Node.js Runtime 강제 사용
export const runtime = 'nodejs';
```

---

## 📊 성능 최적화

### 1. 빌드 최적화

```javascript
// next.config.js
const nextConfig = {
  // 이미지 최적화
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-project.supabase.co',
      },
    ],
  },
  
  // 압축 활성화
  compress: true,
  
  // 번들 분석
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/node': '@sentry/browser',
      };
    }
    return config;
  },
};
```

### 2. 캐싱 전략

```typescript
// API 라우트 캐싱
export async function GET() {
  const response = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // 1시간 캐싱
  });
  
  return Response.json(await response.json());
}
```

### 3. 정적 생성 활용

```typescript
// 정적 페이지 생성
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}
```

---

## 🔒 보안 설정

### 1. 보안 헤더

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

### 2. 환경변수 보안

```bash
# 프로덕션에서만 사용할 민감한 정보
SUPABASE_SERVICE_KEY=  # 서버사이드에서만 사용
DATABASE_URL=          # 직접 접근용 (사용 금지)
NEXTAUTH_SECRET=       # JWT 서명용
```

### 3. API Rate Limiting

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Rate limiting 로직
  const response = NextResponse.next();
  
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', '99');
  
  return response;
}
```

---

## 📋 배포 체크리스트

### 배포 전 확인사항

- [ ] 모든 환경변수 설정 완료
- [ ] 로컬에서 프로덕션 빌드 성공 (`npm run build`)
- [ ] 린트 검사 통과 (`npm run lint`)
- [ ] 타입 체크 통과 (`npm run type-check`)
- [ ] 데이터베이스 스키마 적용 완료
- [ ] Supabase RLS 정책 설정 완료
- [ ] GitHub OAuth 앱 설정 (프로덕션 URL 추가)

### 배포 후 확인사항

- [ ] 홈페이지 정상 로딩
- [ ] 다크/라이트 모드 토글 동작
- [ ] 반응형 레이아웃 확인 (모바일/데스크톱)
- [ ] 환경변수가 올바르게 적용되었는지 확인
- [ ] SSL 인증서 정상 적용
- [ ] Performance 점수 확인 (Lighthouse)
- [ ] Vercel Functions 로그 확인

### 모니터링 설정

- [ ] Vercel Analytics 활성화
- [ ] Error tracking 설정 (Sentry 등)
- [ ] Uptime monitoring 설정
- [ ] 백업 정책 수립

---

## 🔗 참고 링크

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase 배포 가이드](https://supabase.com/docs/guides/platform)
- [GitHub Actions 워크플로우](https://docs.github.com/en/actions)

---

## 📞 지원

배포 관련 문제가 발생하면:
1. 이 문서의 트러블슈팅 섹션 확인
2. [GitHub Issues](https://github.com/blcktgr73/StudyBlog/issues) 등록
3. Vercel/Supabase 공식 문서 참조

---

*마지막 업데이트: 2024-08-29*