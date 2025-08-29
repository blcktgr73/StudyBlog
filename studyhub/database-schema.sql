-- StudyHub Database Schema
-- Execute this script in Supabase SQL Editor
-- 
-- This script creates all necessary tables for StudyHub application:
-- - users: User profiles extending Supabase auth.users
-- - categories: Blog post categories
-- - tags: Blog post tags
-- - posts: Blog posts with full content management
-- - post_tags: Many-to-many relationship between posts and tags
--
-- Version: Iteration 2
-- Created: 2024-08-29

-- 1. Users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    github_username TEXT,
    twitter_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Categories 테이블 생성
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Tags 테이블 생성
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Posts 테이블 생성
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image TEXT,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT FALSE NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    view_count INTEGER DEFAULT 0 NOT NULL,
    like_count INTEGER DEFAULT 0 NOT NULL,
    comment_count INTEGER DEFAULT 0 NOT NULL,
    reading_time INTEGER,
    seo_title TEXT,
    seo_description TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Post Tags 관계 테이블
CREATE TABLE IF NOT EXISTS public.post_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(post_id, tag_id)
);

-- 6. 인덱스 생성
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS categories_slug_idx ON public.categories(slug);
CREATE INDEX IF NOT EXISTS tags_slug_idx ON public.tags(slug);
CREATE INDEX IF NOT EXISTS posts_slug_idx ON public.posts(slug);
CREATE INDEX IF NOT EXISTS posts_author_idx ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS posts_category_idx ON public.posts(category_id);
CREATE INDEX IF NOT EXISTS posts_published_idx ON public.posts(is_published, published_at);
CREATE INDEX IF NOT EXISTS post_tags_post_tag_idx ON public.post_tags(post_id, tag_id);

-- 7. RLS 정책 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- Users 정책
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Posts 정책
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can view own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can insert own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;

CREATE POLICY "Anyone can view published posts" ON public.posts FOR SELECT USING (is_published = true);
CREATE POLICY "Authors can view own posts" ON public.posts FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Authors can insert own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- Categories와 Tags 정책
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view tags" ON public.tags;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);

-- Post Tags 정책
DROP POLICY IF EXISTS "Anyone can view post tags" ON public.post_tags;
DROP POLICY IF EXISTS "Authors can manage post tags" ON public.post_tags;
CREATE POLICY "Anyone can view post tags" ON public.post_tags FOR SELECT USING (true);
CREATE POLICY "Authors can manage post tags" ON public.post_tags FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_tags.post_id 
        AND posts.author_id = auth.uid()
    )
);

-- 8. 새 사용자 자동 추가 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. 기본 데이터 삽입
INSERT INTO public.categories (name, slug, description, color) VALUES
    ('Technology', 'technology', 'Programming, Software Development, Tech News', '#3B82F6'),
    ('Education', 'education', 'Learning Resources, Tutorials, Study Tips', '#10B981'),
    ('Career', 'career', 'Job Search, Career Development, Professional Growth', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.tags (name, slug, description) VALUES
    ('JavaScript', 'javascript', 'JavaScript programming language'),
    ('React', 'react', 'React library for building user interfaces'),
    ('Next.js', 'nextjs', 'React framework for production'),
    ('TypeScript', 'typescript', 'Typed JavaScript'),
    ('Web Development', 'web-development', 'Frontend and backend web development'),
    ('Tutorial', 'tutorial', 'Step-by-step learning content')
ON CONFLICT (name) DO NOTHING;

-- 완료 확인
SELECT 'StudyHub database setup completed! Check Table Editor.' as message;