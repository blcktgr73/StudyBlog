import { createClient } from '@/lib/supabase/server';
import type { PostWithDetails } from './posts';
import { createSlug, processPostContent } from './posts';

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
    tagSlug,
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
    const { data: posts, error, count } = await query
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
    const transformedPosts: PostWithDetails[] = (posts || []).map((post: Record<string, unknown>) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.cover_image,
      authorId: post.author_id,
      categoryId: post.category_id,
      isPublished: post.is_published,
      isPinned: post.is_pinned,
      viewCount: post.view_count,
      likeCount: post.like_count,
      commentCount: post.comment_count,
      readingTime: post.reading_time,
      publishedAt: post.published_at,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: {
        id: post.users?.id || post.author_id,
        fullName: post.users?.full_name || null,
        email: post.users?.email || '',
        avatarUrl: post.users?.avatar_url || null,
      },
      category: post.categories ? {
        id: post.categories.id,
        name: post.categories.name,
        slug: post.categories.slug,
        color: post.categories.color,
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
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.cover_image,
      authorId: post.author_id,
      categoryId: post.category_id,
      isPublished: post.is_published,
      isPinned: post.is_pinned,
      viewCount: post.view_count,
      likeCount: post.like_count,
      commentCount: post.comment_count,
      readingTime: post.reading_time,
      publishedAt: post.published_at,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: {
        id: post.author.id,
        fullName: post.author.full_name,
        email: post.author.email,
        avatarUrl: post.author.avatar_url,
      },
      category: post.category ? {
        id: post.category.id,
        name: post.category.name,
        slug: post.category.slug,
        color: post.category.color,
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
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.cover_image,
      authorId: post.author_id,
      categoryId: post.category_id,
      isPublished: post.is_published,
      isPinned: post.is_pinned,
      viewCount: post.view_count,
      likeCount: post.like_count,
      commentCount: post.comment_count,
      readingTime: post.reading_time,
      publishedAt: post.published_at,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: {
        id: post.users?.id || post.author_id,
        fullName: post.users?.full_name || null,
        email: post.users?.email || '',
        avatarUrl: post.users?.avatar_url || null,
      },
      category: post.categories ? {
        id: post.categories.id,
        name: post.categories.name,
        slug: post.categories.slug,
        color: post.categories.color,
      } : null,
      tags: [], // Temporarily empty tags for now
    };
  } catch (error) {
    console.error('Error fetching post by slug with Supabase:', error);
    return null;
  }
}