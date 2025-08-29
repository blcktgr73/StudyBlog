# TRD: StudyHub - 기술 요구사항 문서

## 1. 시스템 아키텍처 개요

### 1.1 전체 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (Supabase)    │
│   Vercel        │    │   Vercel        │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Assets    │    │   File Storage  │    │   Real-time     │
│   Vercel Edge   │    │   Supabase      │    │   Supabase      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 기술 스택 결정

## 2. 기술 스택 상세

### 2.1 Frontend Stack
```typescript
// 선택된 기술 스택
{
  "framework": "Next.js 14.2+ (App Router)",
  "language": "TypeScript 5.0+",
  "styling": "Tailwind CSS 3.4+",
  "ui_components": "shadcn/ui",
  "state_management": "Zustand",
  "forms": "React Hook Form + Zod",
  "markdown": "@uiw/react-md-editor",
  "icons": "Lucide React",
  "animations": "Framer Motion"
}
```

**결정 근거:**
- Next.js 14: 최신 App Router로 향상된 성능과 DX
- Zustand: Redux보다 간단하면서도 충분한 상태 관리
- shadcn/ui: 커스터마이징 가능한 고품질 컴포넌트
- @uiw/react-md-editor: 마크다운 편집기 중 가장 안정적

### 2.2 Backend & Database Stack
```typescript
{
  "database": "Supabase PostgreSQL",
  "orm": "Drizzle ORM",
  "authentication": "Supabase Auth",
  "file_storage": "Supabase Storage",
  "real_time": "Supabase Realtime",
  "api": "Next.js API Routes",
  "validation": "Zod",
  "email": "Resend"
}
```

**결정 근거:**
- Supabase: Firebase 대안으로 PostgreSQL 기반, 더 나은 개발자 경험
- Drizzle ORM: 타입 안전성과 성능 우수
- Resend: 개발자 친화적인 이메일 서비스

### 2.3 배포 및 인프라
```typescript
{
  "hosting": "Vercel",
  "domain": "Vercel Domains",
  "cdn": "Vercel Edge Network",
  "analytics": "Vercel Analytics",
  "monitoring": "Vercel Speed Insights",
  "error_tracking": "Sentry (선택적)"
}
```

## 3. 프로젝트 구조

### 3.1 디렉토리 구조
```
studyhub/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── .env.local
├── .env.example
├── src/
│   ├── app/                    # App Router
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── posts/
│   │   ├── groups/
│   │   ├── api/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # 재사용 컴포넌트
│   │   ├── ui/                 # shadcn/ui 컴포넌트
│   │   ├── layout/
│   │   ├── posts/
│   │   ├── auth/
│   │   └── common/
│   ├── lib/                    # 유틸리티 및 설정
│   │   ├── db/
│   │   ├── auth/
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── hooks/                  # 커스텀 훅
│   ├── store/                  # Zustand 스토어
│   └── types/                  # 타입 정의
├── public/
│   ├── images/
│   └── icons/
└── docs/                       # 문서
    ├── PRD.md
    ├── TRD.md
    └── API.md
```

### 3.2 라우팅 구조
```typescript
// App Router 구조
app/
├── page.tsx                    # 홈페이지
├── layout.tsx                  # 루트 레이아웃
├── loading.tsx                 # 글로벌 로딩
├── error.tsx                   # 에러 페이지
├── not-found.tsx              # 404 페이지
├── (auth)/                     # 인증 관련 그룹
│   ├── login/
│   └── signup/
├── posts/                      # 게시글
│   ├── page.tsx               # 게시글 목록
│   ├── [slug]/
│   ├── write/
│   └── edit/[id]/
├── categories/[slug]/          # 카테고리별 게시글
├── users/[username]/           # 사용자 프로필
├── dashboard/                  # 개인 대시보드
├── groups/                     # 스터디 그룹 (Phase 2)
└── api/                        # API 엔드포인트
    ├── posts/
    ├── auth/
    ├── users/
    └── upload/
```

## 4. 데이터베이스 설계

### 4.1 스키마 구조 (Drizzle ORM)
```typescript
// 주요 테이블 구조
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  githubId: varchar('github_id', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  coverImage: text('cover_image'),
  authorId: uuid('author_id').references(() => users.id),
  categoryId: uuid('category_id').references(() => categories.id),
  published: boolean('published').default(false),
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### 4.2 인덱스 전략
```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_published_created ON posts(published, created_at DESC);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_comments_post ON comments(post_id, created_at);
CREATE INDEX idx_likes_post_user ON likes(post_id, user_id);
```

## 5. API 설계

### 5.1 REST API 엔드포인트
```typescript
// API 라우트 구조
GET    /api/posts              # 게시글 목록
POST   /api/posts              # 게시글 생성
GET    /api/posts/[id]         # 게시글 상세
PUT    /api/posts/[id]         # 게시글 수정
DELETE /api/posts/[id]         # 게시글 삭제

GET    /api/posts/[id]/comments # 댓글 목록
POST   /api/posts/[id]/comments # 댓글 작성

POST   /api/posts/[id]/like    # 좋아요
DELETE /api/posts/[id]/like    # 좋아요 취소

POST   /api/upload/image       # 이미지 업로드
GET    /api/users/[username]   # 사용자 정보

GET    /api/categories         # 카테고리 목록
GET    /api/tags              # 태그 목록
```

### 5.2 응답 형식 표준화
```typescript
// API 응답 타입
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## 6. 인증 및 보안

### 6.1 인증 시스템
```typescript
// Supabase Auth 설정
const supabaseAuthConfig = {
  providers: ['email', 'github'],
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  emailConfirmation: true,
  passwordMinLength: 8,
};

// 세션 관리
interface UserSession {
  user: User | null;
  session: Session | null;
  loading: boolean;
}
```

### 6.2 보안 정책
```typescript
// 보안 설정
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// CORS 설정
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://studyhub.com'] 
    : ['http://localhost:3000'],
  credentials: true,
};
```

## 7. 성능 최적화

### 7.1 Next.js 최적화
```typescript
// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'supabase.co' },
      { protocol: 'https', hostname: 'github.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@node-rs/argon2'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 7.2 캐싱 전략
```typescript
// 캐싱 정책
const cacheConfig = {
  posts: {
    revalidate: 300, // 5분
    tags: ['posts'],
  },
  user: {
    revalidate: 3600, // 1시간
    tags: ['user'],
  },
  static: {
    'max-age': 31536000, // 1년
    immutable: true,
  },
};
```

## 8. 개발 환경 설정

### 8.1 환경 변수
```bash
# .env.example
# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Email
RESEND_API_KEY=

# Upload
NEXT_PUBLIC_MAX_FILE_SIZE=5242880 # 5MB
```

### 8.2 개발 도구 설정
```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

### 8.3 코드 품질
```typescript
// ESLint + Prettier 설정
const eslintConfig = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    'prefer-const': 'error',
  },
};
```

## 9. 배포 및 CI/CD

### 9.1 Vercel 배포 설정
```typescript
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 9.2 자동화된 배포
```yaml
# GitHub Actions (선택적)
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: npm run type-check
```

## 10. 모니터링 및 로깅

### 10.1 성능 모니터링
```typescript
// 성능 지표 추적
const performanceConfig = {
  Core_Web_Vitals: true,
  Real_User_Monitoring: true,
  Server_Timing: true,
  Bundle_Analyzer: process.env.ANALYZE === 'true',
};
```

### 10.2 에러 처리
```typescript
// 에러 바운더리 및 로깅
const errorConfig = {
  captureUnhandledRejections: true,
  captureUncaughtExceptions: true,
  beforeSend: (event) => {
    // 민감한 정보 필터링
    return event;
  },
};
```
