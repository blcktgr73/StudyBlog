# TASK: StudyHub 개발 태스크 정의서

## 전체 개발 로드맵

### Phase 1: 핵심 MVP (4개 Iteration)
- **목표**: 기본적인 블로그 기능으로 사용자가 글을 작성하고 읽을 수 있는 환경 구축
- **예상 기간**: 2-3주

### Phase 2: 커뮤니티 기능 (3개 Iteration) 
- **목표**: 댓글, 좋아요, 사용자 상호작용 기능 추가
- **예상 기간**: 2주

### Phase 3: 학습 도구 (3개 Iteration)
- **목표**: 스터디 그룹, 학습 추적 등 협업 학습 기능 구현
- **예상 기간**: 2-3주

---

## Phase 1: 핵심 MVP

### Iteration 1: 프로젝트 초기화 및 기본 UI 구축 ✅ (완료)
**목표**: Next.js 프로젝트 생성, 기본 레이아웃, 첫 배포  
**완료일**: 2024-08-29  
**실제 소요시간**: 1일

**작업 내용**:
1. **프로젝트 초기화** ✅
   - Next.js 14 + TypeScript 프로젝트 생성
   - 필요한 패키지 설치 (Tailwind, shadcn/ui, Zustand 등)
   - 기본 폴더 구조 설정

2. **기본 UI 컴포넌트 구축** ✅
   - shadcn/ui 초기화
   - 기본 레이아웃 (Header, Footer, MainLayout) 구현
   - 홈페이지 기본 구조 (Hero, Features, Latest Posts)
   - 다크/라이트 모드 구현

3. **Vercel 배포 설정** ✅
   - GitHub 연동 및 Git 서브모듈 이슈 해결
   - 첫 배포 성공: https://study-blog-gamma.vercel.app/
   - 의존성 문제 해결 (next-themes 누락)

**완료 기준**: ✅ 모두 달성
- [✅] localhost:3000에서 기본 레이아웃이 정상 동작
- [✅] Vercel에 성공적으로 배포
- [✅] 다크/라이트 모드 토글 동작
- [✅] 반응형 기본 레이아웃 완성

**해결된 주요 이슈**:
- Git 서브모듈 문제로 인한 배포 실패 → 일반 디렉토리로 변경
- 루트 package.json 충돌 → 제거하여 Next.js 감지 문제 해결
- next-themes 의존성 누락 → 추가 설치로 빌드 성공

**성과**: 완전한 MVP 기반 구축 완료, 다음 Iteration 준비 완료

---

### Iteration 2: 데이터베이스 설정 및 인증 시스템 🔐
**목표**: Supabase 연동, 사용자 회원가입/로그인 기능

**작업 내용**:
1. **Supabase 설정**
   - Supabase 프로젝트 생성
   - 환경 변수 설정
   - Drizzle ORM 설정

2. **데이터베이스 스키마 생성**
   - users, posts, categories, tags 테이블 생성
   - 관계 설정 및 인덱스 생성

3. **인증 시스템 구현**
   - Supabase Auth 설정
   - 회원가입/로그인 페이지
   - GitHub OAuth 연동
   - 인증 상태 관리 (Zustand)

**완료 기준**:
- [ ] Supabase 연결 및 테이블 생성 완료
- [ ] 이메일 회원가입/로그인 동작
- [ ] GitHub OAuth 로그인 동작
- [ ] 인증된 사용자만 접근 가능한 페이지 구현
- [ ] 사용자 세션 관리 정상 동작

**예상 소요 시간**: 2-3일

---

### Iteration 3: 게시글 CRUD 기능 📝
**목표**: 게시글 작성, 읽기, 수정, 삭제 기능

**작업 내용**:
1. **게시글 작성 기능**
   - 마크다운 에디터 구현 (@uiw/react-md-editor)
   - 제목, 내용, 태그, 카테고리 입력
   - 이미지 업로드 (Supabase Storage)
   - 임시저장 기능

2. **게시글 목록 및 상세 페이지**
   - 게시글 목록 페이지 (/posts)
   - 게시글 상세 페이지 (/posts/[slug])
   - 페이지네이션
   - 조회수 추적

3. **게시글 관리**
   - 본인 게시글 수정/삭제
   - 공개/비공개 설정
   - SEO 메타 태그

**완료 기준**:
- [ ] 마크다운 에디터로 게시글 작성 가능
- [ ] 이미지 업로드 및 표시 정상 동작
- [ ] 게시글 목록에서 카드 형태로 표시
- [ ] 게시글 상세 페이지에서 마크다운 렌더링
- [ ] 작성자만 수정/삭제 가능
- [ ] 반응형으로 모든 기능 동작

**예상 소요 시간**: 3-4일

---

### Iteration 4: 검색 및 카테고리 기능 🔍
**목표**: 콘텐츠 탐색 기능 완성

**작업 내용**:
1. **검색 기능**
   - 전체 검색 (제목, 내용, 태그)
   - 검색 결과 페이지
   - 검색어 하이라이팅

2. **카테고리 시스템**
   - 카테고리 관리 페이지
   - 카테고리별 게시글 목록
   - 태그 시스템

3. **홈페이지 완성**
   - 최신 게시글 목록
   - 인기 게시글
   - 카테고리별 최신 글
   - 사이드바 (인기 태그, 최근 댓글 등)

**완료 기준**:
- [ ] 검색창에서 실시간 검색 가능
- [ ] 카테고리별 필터링 동작
- [ ] 태그 클릭시 관련 게시글 표시
- [ ] 홈페이지에 다양한 콘텐츠 섹션 표시
- [ ] 모바일에서도 검색/네비게이션 원활

**예상 소요 시간**: 2-3일

---

## Phase 2: 커뮤니티 기능

### Iteration 5: 댓글 시스템 💬
**목표**: 게시글에 댓글/대댓글 기능 추가

### Iteration 6: 좋아요 및 북마크 ❤️
**목표**: 사용자 상호작용 기능

### Iteration 7: 사용자 프로필 👤
**목표**: 개인 프로필 페이지 및 팔로우 기능

---

## Phase 3: 학습 도구

### Iteration 8: 개인 대시보드 📊
**목표**: 학습 통계 및 개인 관리 기능

### Iteration 9: 스터디 그룹 기초 👥
**목표**: 스터디 그룹 생성 및 참여

### Iteration 10: 학습 추적 도구 📈
**목표**: 진도 체크, 학습 목표 관리

---

## Iteration 1 상세 실행 계획

### 🎯 Iteration 1: 프로젝트 초기화 및 기본 UI 구축

Claude Code에서 다음 순서로 진행하겠습니다:

#### Step 1: 프로젝트 생성 및 기본 설정
```bash
# 실행할 명령어들
npx create-next-app@latest studyhub --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd studyhub
npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge lucide-react
npx shadcn-ui@latest init
```

#### Step 2: 기본 패키지 설치
```bash
# 추가 패키지 설치
npm install zustand next-themes framer-motion
npm install -D @types/node
```

#### Step 3: 폴더 구조 생성
```
src/
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   └── common/
├── lib/
├── hooks/
├── store/
└── types/
```

#### Step 4: 기본 컴포넌트 구현
- ThemeProvider 설정
- Header 컴포넌트 (로고, 네비게이션, 테마 토글)
- Footer 컴포넌트
- Layout 구조

#### Step 5: shadcn/ui 컴포넌트 추가
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add card
```

#### Step 6: 기본 페이지 구현
- 홈페이지 레이아웃
- 반응형 디자인 구현
- 다크/라이트 모드 토글

#### Step 7: Vercel 배포
- GitHub 저장소 생성
- Vercel 프로젝트 연결
- 첫 배포 수행

#### 완료 후 확인사항
1. **로컬 환경**: `npm run dev`로 localhost:3000 접속
2. **기능 테스트**: 다크/라이트 모드 토글 동작 확인
3. **반응형**: 모바일/데스크톱 레이아웃 확인
4. **배포**: Vercel URL로 접속하여 동작 확인

#### 다음 Iteration 준비
- Supabase 계정 생성
- GitHub OAuth 앱 등록 (다음 단계에서 사용)
