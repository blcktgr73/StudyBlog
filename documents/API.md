# API 명세서 - StudyHub

## 개요

StudyHub의 RESTful API 명세서입니다. 모든 API는 JSON 형태로 통신하며, 인증이 필요한 엔드포인트는 Authorization 헤더에 Bearer 토큰을 포함해야 합니다.

## Base URL

```
Development: http://localhost:3000/api
Production: https://study-blog-gamma.vercel.app/api
```

## 인증

```bash
# Authorization 헤더 형식
Authorization: Bearer <access_token>
```

## 응답 형식

### 성공 응답
```typescript
interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}
```

### 오류 응답
```typescript
interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}
```

### 페이지네이션 응답
```typescript
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## 인증 API

### 회원가입
```http
POST /api/auth/signup
```

**Request Body:**
```typescript
{
  email: string;
  password: string;
  username: string;
  displayName?: string;
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      username: string;
      displayName: string;
      avatarUrl?: string;
    };
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
  };
  message: "회원가입이 완료되었습니다.";
}
```

### 로그인
```http
POST /api/auth/signin
```

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

### GitHub OAuth
```http
GET /api/auth/github
```

### 로그아웃
```http
POST /api/auth/signout
```

**Headers:**
```
Authorization: Bearer <access_token>
```

### 세션 확인
```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <access_token>
```

---

## 사용자 API

### 사용자 프로필 조회
```http
GET /api/users/{username}
```

**Response:**
```typescript
{
  success: true;
  data: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    createdAt: string;
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
}
```

### 사용자 프로필 수정
```http
PUT /api/users/me
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```typescript
{
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}
```

---

## 게시글 API

### 게시글 목록 조회
```http
GET /api/posts
```

**Query Parameters:**
```typescript
{
  page?: number;        // 페이지 번호 (기본: 1)
  limit?: number;       // 페이지당 항목 수 (기본: 10, 최대: 50)
  category?: string;    // 카테고리 필터
  tag?: string;         // 태그 필터
  search?: string;      // 검색어 (제목, 내용)
  sort?: 'latest' | 'popular' | 'oldest';  // 정렬 (기본: latest)
  author?: string;      // 작성자 username
}
```

**Response:**
```typescript
{
  success: true;
  data: [
    {
      id: string;
      title: string;
      slug: string;
      excerpt: string;
      coverImage?: string;
      author: {
        username: string;
        displayName: string;
        avatarUrl?: string;
      };
      category: {
        name: string;
        slug: string;
        color: string;
      };
      tags: Array<{
        name: string;
        slug: string;
      }>;
      published: boolean;
      viewCount: number;
      likesCount: number;
      commentsCount: number;
      createdAt: string;
      updatedAt: string;
    }
  ];
  pagination: PaginationInfo;
}
```

### 게시글 상세 조회
```http
GET /api/posts/{slug}
```

**Response:**
```typescript
{
  success: true;
  data: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    coverImage?: string;
    author: UserInfo;
    category: CategoryInfo;
    tags: TagInfo[];
    published: boolean;
    viewCount: number;
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;      // 현재 사용자의 좋아요 여부
    isBookmarked: boolean; // 현재 사용자의 북마크 여부
    createdAt: string;
    updatedAt: string;
  };
}
```

### 게시글 작성
```http
POST /api/posts
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```typescript
{
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  categoryId: string;
  tags: string[];        // 태그 이름 배열
  published: boolean;
}
```

### 게시글 수정
```http
PUT /api/posts/{id}
```

**Headers:**
```
Authorization: Bearer <access_token>
```

### 게시글 삭제
```http
DELETE /api/posts/{id}
```

**Headers:**
```
Authorization: Bearer <access_token>
```

### 게시글 좋아요
```http
POST /api/posts/{id}/like
```

**Headers:**
```
Authorization: Bearer <access_token>
```

### 게시글 좋아요 취소
```http
DELETE /api/posts/{id}/like
```

**Headers:**
```
Authorization: Bearer <access_token>
```

### 게시글 북마크
```http
POST /api/posts/{id}/bookmark
```

**Headers:**
```
Authorization: Bearer <access_token>
```

---

## 댓글 API

### 댓글 목록 조회
```http
GET /api/posts/{postId}/comments
```

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  sort?: 'latest' | 'oldest';
}
```

### 댓글 작성
```http
POST /api/posts/{postId}/comments
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```typescript
{
  content: string;
  parentId?: string;  // 대댓글인 경우
}
```

### 댓글 수정
```http
PUT /api/comments/{id}
```

**Headers:**
```
Authorization: Bearer <access_token>
```

### 댓글 삭제
```http
DELETE /api/comments/{id}
```

**Headers:**
```
Authorization: Bearer <access_token>
```

---

## 카테고리 API

### 카테고리 목록 조회
```http
GET /api/categories
```

**Response:**
```typescript
{
  success: true;
  data: [
    {
      id: string;
      name: string;
      slug: string;
      description?: string;
      color: string;
      postsCount: number;
    }
  ];
}
```

### 카테고리 생성
```http
POST /api/categories
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```typescript
{
  name: string;
  description?: string;
  color: string;  // HEX 컬러 코드
}
```

---

## 태그 API

### 태그 목록 조회
```http
GET /api/tags
```

**Query Parameters:**
```typescript
{
  search?: string;  // 태그 이름 검색
  limit?: number;   // 결과 수 제한 (기본: 20)
}
```

### 인기 태그 조회
```http
GET /api/tags/popular
```

---

## 파일 업로드 API

### 이미지 업로드
```http
POST /api/upload/image
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
```typescript
{
  file: File;  // 이미지 파일 (jpg, png, gif, webp)
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    url: string;        // 업로드된 이미지 URL
    filename: string;   // 파일명
    size: number;       // 파일 크기 (bytes)
    mimetype: string;   // MIME 타입
  };
}
```

**제한사항:**
- 최대 파일 크기: 5MB
- 지원 형식: jpg, jpeg, png, gif, webp
- 파일명은 UUID로 자동 생성

---

## 검색 API

### 통합 검색
```http
GET /api/search
```

**Query Parameters:**
```typescript
{
  q: string;           // 검색어 (필수)
  type?: 'posts' | 'users' | 'tags';  // 검색 타입 (기본: posts)
  page?: number;
  limit?: number;
}
```

### 게시글 검색
```http
GET /api/search/posts
```

### 사용자 검색
```http
GET /api/search/users
```

---

## 통계 API

### 대시보드 통계
```http
GET /api/stats/dashboard
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```typescript
{
  success: true;
  data: {
    postsCount: number;
    draftsCount: number;
    totalViews: number;
    totalLikes: number;
    followersCount: number;
    recentPosts: PostSummary[];
    popularPosts: PostSummary[];
  };
}
```

---

## 오류 코드

| HTTP Status | Code | Description |
|------------|------|-------------|
| 400 | VALIDATION_ERROR | 요청 데이터 검증 실패 |
| 401 | UNAUTHORIZED | 인증 토큰이 없거나 만료됨 |
| 403 | FORBIDDEN | 권한이 없음 |
| 404 | NOT_FOUND | 리소스를 찾을 수 없음 |
| 409 | CONFLICT | 중복된 데이터 (이메일, 사용자명 등) |
| 413 | PAYLOAD_TOO_LARGE | 업로드 파일이 너무 큼 |
| 429 | TOO_MANY_REQUESTS | 요청 횟수 제한 초과 |
| 500 | INTERNAL_SERVER_ERROR | 서버 내부 오류 |

## Rate Limiting

- 인증된 사용자: 1000 req/hour
- 비인증 사용자: 100 req/hour
- 파일 업로드: 10 req/hour

## WebSocket API (향후 구현)

### 실시간 알림
```javascript
// 연결
const ws = new WebSocket('wss://study-blog-gamma.vercel.app/api/ws');

// 메시지 타입
interface WSMessage {
  type: 'comment' | 'like' | 'follow' | 'mention';
  data: any;
  timestamp: string;
}
```

---

## 예제 코드

### JavaScript/TypeScript
```typescript
// API 클라이언트 예제
class StudyHubAPI {
  constructor(private baseUrl: string, private token?: string) {}

  async getPosts(params?: GetPostsParams): Promise<PaginatedResponse<Post>> {
    const url = new URL(`${this.baseUrl}/posts`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, value.toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });

    return response.json();
  }

  async createPost(data: CreatePostData): Promise<ApiResponse<Post>> {
    const response = await fetch(`${this.baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(data),
    });

    return response.json();
  }
}
```

### Python
```python
import requests

class StudyHubAPI:
    def __init__(self, base_url: str, token: str = None):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}

    def get_posts(self, **params):
        response = requests.get(
            f"{self.base_url}/posts",
            params=params,
            headers=self.headers
        )
        return response.json()

    def create_post(self, data):
        response = requests.post(
            f"{self.base_url}/posts",
            json=data,
            headers={**self.headers, "Content-Type": "application/json"}
        )
        return response.json()
```

---

## 변경 이력

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0.0 | 2024-08-29 | 초기 API 명세서 작성 |

## 지원

API 관련 문의나 버그 리포트는 [GitHub Issues](https://github.com/blcktgr73/StudyBlog/issues)에 등록해 주세요.