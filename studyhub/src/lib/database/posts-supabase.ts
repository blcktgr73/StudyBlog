import { createClient } from '@/lib/supabase/server';
import type { PostWithDetails } from './posts';
import { createSlug, processPostContent } from './posts';

// Type for Supabase post data with joins
type SupabasePostData = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  author_id: string;
  category_id: string | null;
  is_published: boolean;
  is_pinned: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  reading_time: number;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  categories?: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  };
};

// Get posts using Supabase client instead of direct SQL
export async function getPostsSupabase(options: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
  authorId?: string;
  published?: boolean;
}) {
  const {
    page = 1,
    limit = 10,
    categorySlug,
    search,
    authorId,
    published = true,
  } = options;

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  try {
    // Build the query - start with simple query first
    let query = supabase
      .from('posts')
      .select(`
        *,
        users(id, full_name, email, avatar_url),
        categories(id, name, slug, color)
      `);

    // Apply filters
    if (published !== undefined) {
      query = query.eq('is_published', published);
    }

    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    if (categorySlug) {
      query = query.eq('category.slug', categorySlug);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%, excerpt.ilike.%${search}%`);
    }

    // Apply ordering and pagination
    const { data: posts, error } = await query
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .match(published !== undefined ? { is_published: published } : {});

    if (countError) {
      console.error('Count error:', countError);
    }

    // Transform the data to match our expected format
    const transformedPosts: PostWithDetails[] = (posts || []).map((post: SupabasePostData) => ({
      id: post.id as string,
      title: post.title as string,
      slug: post.slug as string,
      content: post.content as string,
      excerpt: post.excerpt as string | null,
      coverImage: post.cover_image as string | null,
      authorId: post.author_id as string,
      categoryId: post.category_id as string | null,
      isPublished: post.is_published as boolean,
      isPinned: post.is_pinned as boolean,
      viewCount: post.view_count as number,
      likeCount: post.like_count as number,
      commentCount: post.comment_count as number,
      readingTime: post.reading_time as number,
      seoTitle: post.seo_title as string | null,
      seoDescription: post.seo_description as string | null,
      publishedAt: post.published_at ? new Date(post.published_at) : null,
      createdAt: new Date(post.created_at),
      updatedAt: new Date(post.updated_at),
      author: {
        id: (post.users?.id || post.author_id) as string,
        fullName: (post.users?.full_name || null) as string | null,
        email: (post.users?.email || '') as string,
        avatarUrl: (post.users?.avatar_url || null) as string | null,
      },
      category: post.categories ? {
        id: post.categories.id as string,
        name: post.categories.name as string,
        slug: post.categories.slug as string,
        color: post.categories.color as string | null,
      } : null,
      tags: [], // Temporarily empty tags to get basic functionality working
    }));

    return {
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching posts with Supabase:', error);
    return {
      posts: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

// Create a new post using Supabase
export async function createPostSupabase(data: {
  title: string;
  content: string;
  authorId: string;
  categoryId?: string;
  tagIds?: string[];
  isPublished: boolean;
  coverImage?: string;
}): Promise<PostWithDetails | null> {
  // Use admin client temporarily until RLS policies are properly configured
  const { createAdminClient } = await import('@/lib/supabase/server');
  const supabase = await createAdminClient();
  
  try {
    const { title, content, authorId, categoryId, isPublished, coverImage } = data;
    
    // Create slug and process content
    const slug = createSlug(title);
    const { readingTime, excerpt } = processPostContent(content);
    
    // Insert the post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        title,
        slug,
        content,
        excerpt,
        cover_image: coverImage,
        author_id: authorId,
        category_id: categoryId,
        is_published: isPublished,
        reading_time: readingTime,
        published_at: isPublished ? new Date().toISOString() : null,
      })
      .select(`
        *,
        author:users!posts_author_id_fkey(id, full_name, email, avatar_url),
        category:categories!posts_category_id_fkey(id, name, slug, color)
      `)
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return null;
    }

    // Handle tags if provided
    if (data.tagIds && data.tagIds.length > 0 && post) {
      const tagInserts = data.tagIds.map(tagId => ({
        post_id: post.id,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from('post_tags')
        .insert(tagInserts);

      if (tagError) {
        console.error('Error linking tags:', tagError);
      }
    }

    // Transform the response
    return {
      id: post.id as string,
      title: post.title as string,
      slug: post.slug as string,
      content: post.content as string,
      excerpt: post.excerpt as string | null,
      coverImage: post.cover_image as string | null,
      authorId: post.author_id as string,
      categoryId: post.category_id as string | null,
      isPublished: post.is_published as boolean,
      isPinned: post.is_pinned as boolean,
      viewCount: post.view_count as number,
      likeCount: post.like_count as number,
      commentCount: post.comment_count as number,
      readingTime: post.reading_time as number,
      seoTitle: post.seo_title as string | null,
      seoDescription: post.seo_description as string | null,
      publishedAt: post.published_at ? new Date(post.published_at) : null,
      createdAt: new Date(post.created_at),
      updatedAt: new Date(post.updated_at),
      author: {
        id: post.author.id as string,
        fullName: post.author.full_name as string | null,
        email: post.author.email as string,
        avatarUrl: post.author.avatar_url as string | null,
      },
      category: post.category ? {
        id: post.category.id as string,
        name: post.category.name as string,
        slug: post.category.slug as string,
        color: post.category.color as string | null,
      } : null,
      tags: [], // Will be populated if tagIds were provided
    };
  } catch (error) {
    console.error('Error creating post with Supabase:', error);
    return null;
  }
}

// Get all categories using Supabase
export async function getCategoriesSupabase() {
  const supabase = await createClient();
  
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return categories || [];
  } catch (error) {
    console.error('Error fetching categories with Supabase:', error);
    return [];
  }
}

// Get all tags using Supabase
export async function getTagsSupabase() {
  const supabase = await createClient();
  
  try {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    return tags || [];
  } catch (error) {
    console.error('Error fetching tags with Supabase:', error);
    return [];
  }
}

// Get a single post by slug using Supabase
export async function getPostBySlugSupabase(slug: string): Promise<PostWithDetails | null> {
  const supabase = await createClient();

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        users(id, full_name, email, avatar_url),
        categories(id, name, slug, color)
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching post by slug:', error);
      return null;
    }

    if (!post) return null;

    // Transform the data
    return {
      id: post.id as string,
      title: post.title as string,
      slug: post.slug as string,
      content: post.content as string,
      excerpt: post.excerpt as string | null,
      coverImage: post.cover_image as string | null,
      authorId: post.author_id as string,
      categoryId: post.category_id as string | null,
      isPublished: post.is_published as boolean,
      isPinned: post.is_pinned as boolean,
      viewCount: post.view_count as number,
      likeCount: post.like_count as number,
      commentCount: post.comment_count as number,
      readingTime: post.reading_time as number,
      seoTitle: post.seo_title as string | null,
      seoDescription: post.seo_description as string | null,
      publishedAt: post.published_at ? new Date(post.published_at) : null,
      createdAt: new Date(post.created_at),
      updatedAt: new Date(post.updated_at),
      author: {
        id: (post.users?.id || post.author_id) as string,
        fullName: (post.users?.full_name || null) as string | null,
        email: (post.users?.email || '') as string,
        avatarUrl: (post.users?.avatar_url || null) as string | null,
      },
      category: post.categories ? {
        id: post.categories.id as string,
        name: post.categories.name as string,
        slug: post.categories.slug as string,
        color: post.categories.color as string | null,
      } : null,
      tags: [], // Temporarily empty tags for now
    };
  } catch (error) {
    console.error('Error fetching post by slug with Supabase:', error);
    return null;
  }
}