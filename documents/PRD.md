# PRD: StudyHub - 협업 학습 블로그 플랫폼

## 1. 제품 개요

### 1.1 프로젝트 목표
여러 사람이 함께 학습하고 지식을 공유할 수 있는 블로그 플랫폼을 구축하여, 개인 학습의 한계를 넘어 집단 지성을 활용한 효과적인 학습 환경을 제공합니다.

### 1.2 타겟 사용자
- 개발자, 디자이너 등 IT 전문직 종사자
- 대학생 및 취업 준비생
- 새로운 기술이나 분야를 학습하는 모든 사람
- 지식 공유를 통해 성장하고자 하는 학습자

### 1.3 핵심 가치 제안
- **집단 학습**: 혼자보다 함께 학습할 때 더 효과적
- **지식 축적**: 개인의 학습 과정이 공동의 자산이 됨
- **상호 피드백**: 실시간으로 질문하고 답변받을 수 있는 환경
- **진도 관리**: 체계적인 학습 계획과 진도 추적

## 2. MVP 기능 정의

### 2.1 Phase 1 - 핵심 기능 (2-3주)

**사용자 인증**
- [필수] 이메일 회원가입/로그인
- [필수] GitHub OAuth 로그인
- [필수] 기본 프로필 관리

**콘텐츠 관리**
- [필수] 마크다운 에디터로 게시글 작성/수정/삭제
- [필수] 이미지 업로드 (클라우드 스토리지)
- [필수] 태그 시스템
- [필수] 카테고리 분류

**커뮤니티 기능**
- [필수] 댓글/대댓글
- [필수] 좋아요 기능
- [필수] 기본 검색 (제목, 내용)

### 2.2 Phase 2 - 학습 기능 강화 (3-4주)

**스터디 그룹**
- 스터디 그룹 생성/참여
- 그룹별 게시판
- 그룹 멤버 관리

**학습 도구**
- 북마크/즐겨찾기
- 학습 진도 체크리스트
- 개인 대시보드 (기본 통계)

**향상된 UX**
- 반응형 디자인 완성
- 다크/라이트 모드
- 무한 스크롤

### 2.3 Phase 3 - 고도화 (4-6주)

**고급 기능**
- 실시간 알림 시스템
- 고급 검색 및 필터링
- 추천 시스템
- 게임화 요소 (포인트, 뱃지)

## 3. 기술 스택

### 3.1 Frontend
```
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS + shadcn/ui
- State Management: Zustand
- Forms: React Hook Form + Zod
- Rich Text Editor: Tiptap 또는 MDX Editor
```

### 3.2 Backend & Database
```
- Database: Supabase (PostgreSQL + Real-time + Auth)
- File Storage: Supabase Storage
- API: Next.js API Routes
- ORM: Drizzle ORM 또는 Prisma
```

### 3.3 배포 & 인프라
```
- Hosting: Vercel
- Database: Supabase
- Domain: Vercel Domains
- Analytics: Vercel Analytics
```

### 3.4 개발 도구
```
- TypeScript
- ESLint + Prettier
- Husky (Git hooks)
- Commitizen (Conventional commits)
```

## 4. 데이터베이스 스키마

### 4.1 핵심 테이블
```sql
-- Users
users (
  id, email, username, avatar_url, 
  created_at, updated_at, github_id
)

-- Posts
posts (
  id, title, content, excerpt, slug,
  user_id, category_id, published,
  created_at, updated_at, view_count
)

-- Categories
categories (
  id, name, slug, description, color
)

-- Tags
tags (id, name, slug)
post_tags (post_id, tag_id)

-- Comments
comments (
  id, content, post_id, user_id, parent_id,
  created_at, updated_at
)

-- Likes
likes (id, post_id, user_id, created_at)

-- Study Groups (Phase 2)
study_groups (
  id, name, description, owner_id,
  created_at, is_private
)

group_members (
  id, group_id, user_id, role, joined_at
)
```

## 5. 주요 화면 구성

### 5.1 페이지 구조
```
/ (홈페이지 - 최신/인기 게시글)
/posts (전체 게시글 목록)
/posts/[slug] (게시글 상세)
/write (게시글 작성)
/categories/[slug] (카테고리별 게시글)
/users/[username] (사용자 프로필)
/dashboard (개인 대시보드)
/groups (스터디 그룹 목록) - Phase 2
/groups/[id] (스터디 그룹 상세) - Phase 2
```

### 5.2 컴포넌트 구조
```
components/
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
├── posts/
│   ├── PostCard.tsx
│   ├── PostList.tsx
│   ├── PostDetail.tsx
│   └── PostEditor.tsx
├── common/
│   ├── Button.tsx
│   ├── Modal.tsx
│   └── SearchBar.tsx
└── auth/
    ├── LoginForm.tsx
    └── SignupForm.tsx
```

## 6. 개발 일정

### 6.1 Week 1-2: 기반 구축
- [ ] 프로젝트 초기 설정 (Next.js + TypeScript)
- [ ] Supabase 설정 및 데이터베이스 구성
- [ ] 기본 UI 컴포넌트 개발 (shadcn/ui)
- [ ] 인증 시스템 구현

### 6.2 Week 3-4: 핵심 기능
- [ ] 게시글 CRUD 기능
- [ ] 마크다운 에디터 구현
- [ ] 댓글 시스템
- [ ] 기본 검색 기능

### 6.3 Week 5-6: UX 개선
- [ ] 반응형 디자인 완성
- [ ] 성능 최적화
- [ ] Vercel 배포 및 도메인 설정
- [ ] 기본 SEO 설정

## 7. 성공 지표 (KPI)

### 7.1 사용자 지표
- 월간 활성 사용자 수 (MAU)
- 사용자 재방문율
- 평균 세션 시간

### 7.2 콘텐츠 지표
- 일일 게시글 수
- 댓글 참여율
- 게시글 조회수

### 7.3 기술적 지표
- 페이지 로딩 속도 (< 3초)
- 서버 응답 시간 (< 500ms)
- 에러율 (< 1%)

## 8. 위험 요소 및 대응책

### 8.1 기술적 위험
**위험**: Supabase 무료 플랜 한계
**대응**: 사용량 모니터링 및 필요시 유료 플랜 전환

**위험**: 대용량 파일 업로드 시 성능 저하
**대응**: 파일 크기 제한 및 이미지 최적화 구현

### 8.2 비즈니스 위험
**위험**: 초기 사용자 확보 어려움
**대응**: 개발자 커뮤니티 대상 베타 테스트 진행

**위험**: 콘텐츠 품질 관리
**대응**: 신고 시스템 및 기본적인 모더레이션 도구 구현

## 9. 배포 및 런칭 계획

### 9.1 개발 환경
- Development: `localhost:3000`
- Staging: `staging.studyhub.vercel.app`
- Production: `studyhub.com` (또는 사용 가능한 도메인)

### 9.2 배포 프로세스
1. GitHub Actions을 통한 자동 배포
2. Vercel Preview 배포로 기능 검증
3. Staging 환경에서 통합 테스트
4. Production 배포

### 9.3 모니터링
- Vercel Analytics로 성능 모니터링
- Sentry로 에러 추적
- Supabase 대시보드로 데이터베이스 모니터링
