import { db } from './connection';
import { posts, categories, tags, postTags, users } from './schema';
import { eq, desc, asc, and, ilike, sql } from 'drizzle-orm';
import type { Post, NewPost, Category, Tag } from './schema';
import slugify from 'slugify';
import readingTime from 'reading-time';

// Post with author and category information
export type PostWithDetails = Post & {
  author: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
};

// Create slug from title
export function createSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

// Calculate reading time and excerpt
export function processPostContent(content: string) {
  const stats = readingTime(content);
  const excerpt = content
    .replace(/[#*`]/g, '') // Remove markdown formatting
    .split('\n')
    .find(line => line.trim().length > 0) // Find first non-empty line
    ?.slice(0, 160) + '...'; // Truncate to 160 chars
  
  return {
    readingTime: Math.ceil(stats.minutes),
    excerpt: excerpt || '',
  };
}

// Create a new post
export async function createPost(data: {
  title: string;
  content: string;
  authorId: string;
  categoryId?: string;
  tagIds?: string[];
  isPublished?: boolean;
  coverImage?: string;
}) {
  const slug = createSlug(data.title);
  const { readingTime, excerpt } = processPostContent(data.content);
  
  const newPost: NewPost = {
    title: data.title,
    slug,
    content: data.content,
    excerpt,
    authorId: data.authorId,
    categoryId: data.categoryId || null,
    isPublished: data.isPublished || false,
    readingTime,
    coverImage: data.coverImage || null,
    publishedAt: data.isPublished ? new Date() : null,
  };

  // Insert post
  const [post] = await db.insert(posts).values(newPost).returning();

  // Add tags if provided
  if (data.tagIds && data.tagIds.length > 0) {
    const tagRelations = data.tagIds.map(tagId => ({
      postId: post.id,
      tagId,
    }));
    await db.insert(postTags).values(tagRelations);
  }

  return post;
}

// Get post by slug with full details
export async function getPostBySlug(slug: string, userId?: string): Promise<PostWithDetails | null> {
  const result = await db
    .select({
      // Post fields
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      content: posts.content,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      authorId: posts.authorId,
      categoryId: posts.categoryId,
      isPublished: posts.isPublished,
      isPinned: posts.isPinned,
      viewCount: posts.viewCount,
      likeCount: posts.likeCount,
      commentCount: posts.commentCount,
      readingTime: posts.readingTime,
      seoTitle: posts.seoTitle,
      seoDescription: posts.seoDescription,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      // Author fields
      authorName: users.fullName,
      authorEmail: users.email,
      authorAvatar: users.avatarUrl,
      // Category fields
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryColor: categories.color,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(
      and(
        eq(posts.slug, slug),
        // Only show published posts unless user is the author
        userId 
          ? sql`(${posts.isPublished} = true OR ${posts.authorId} = ${userId})`
          : eq(posts.isPublished, true)
      )
    )
    .limit(1);

  if (result.length === 0) return null;

  const postData = result[0];

  // Get tags for this post
  const postTagsResult = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(postTags)
    .leftJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postData.id));

  // Increment view count
  await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, postData.id));

  return {
    id: postData.id,
    title: postData.title,
    slug: postData.slug,
    content: postData.content,
    excerpt: postData.excerpt,
    coverImage: postData.coverImage,
    authorId: postData.authorId,
    categoryId: postData.categoryId,
    isPublished: postData.isPublished,
    isPinned: postData.isPinned,
    viewCount: postData.viewCount + 1, // Include the increment
    likeCount: postData.likeCount,
    commentCount: postData.commentCount,
    readingTime: postData.readingTime,
    seoTitle: postData.seoTitle,
    seoDescription: postData.seoDescription,
    publishedAt: postData.publishedAt,
    createdAt: postData.createdAt,
    updatedAt: postData.updatedAt,
    author: {
      id: postData.authorId,
      fullName: postData.authorName,
      email: postData.authorEmail,
      avatarUrl: postData.authorAvatar,
    },
    category: postData.categoryName ? {
      id: postData.categoryId!,
      name: postData.categoryName,
      slug: postData.categorySlug!,
      color: postData.categoryColor,
    } : null,
    tags: postTagsResult,
  };
}

// Get posts with pagination and filtering
export async function getPosts(options: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
  authorId?: string;
  published?: boolean;
} = {}) {
  const {
    page = 1,
    limit = 10,
    categorySlug,
    tagSlug,
    search,
    authorId,
    published = true,
  } = options;

  const offset = (page - 1) * limit;

  let query = db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      authorId: posts.authorId,
      categoryId: posts.categoryId,
      isPublished: posts.isPublished,
      isPinned: posts.isPinned,
      viewCount: posts.viewCount,
      likeCount: posts.likeCount,
      commentCount: posts.commentCount,
      readingTime: posts.readingTime,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorName: users.fullName,
      authorEmail: users.email,
      authorAvatar: users.avatarUrl,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryColor: categories.color,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id));

  // Build WHERE conditions
  const conditions = [];
  
  if (published) {
    conditions.push(eq(posts.isPublished, true));
  }
  
  if (authorId) {
    conditions.push(eq(posts.authorId, authorId));
  }
  
  if (categorySlug) {
    conditions.push(eq(categories.slug, categorySlug));
  }
  
  if (search) {
    conditions.push(
      sql`(${ilike(posts.title, `%${search}%`)} OR ${ilike(posts.content, `%${search}%`)})`
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Add tag filtering if specified
  if (tagSlug) {
    query = query
      .innerJoin(postTags, eq(posts.id, postTags.postId))
      .innerJoin(tags, and(eq(postTags.tagId, tags.id), eq(tags.slug, tagSlug)));
  }

  // Get total count for pagination
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id));

  if (conditions.length > 0) {
    countQuery.where(and(...conditions));
  }

  if (tagSlug) {
    countQuery
      .innerJoin(postTags, eq(posts.id, postTags.postId))
      .innerJoin(tags, and(eq(postTags.tagId, tags.id), eq(tags.slug, tagSlug)));
  }

  // Execute queries
  const [postsResult, countResult] = await Promise.all([
    query
      .orderBy(desc(posts.isPinned), desc(posts.publishedAt), desc(posts.createdAt))
      .limit(limit)
      .offset(offset),
    countQuery,
  ]);

  const totalCount = countResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Get tags for each post
  const postIds = postsResult.map(post => post.id);
  const allTagsResult = postIds.length > 0 ? await db
    .select({
      postId: postTags.postId,
      tagId: tags.id,
      tagName: tags.name,
      tagSlug: tags.slug,
    })
    .from(postTags)
    .leftJoin(tags, eq(postTags.tagId, tags.id))
    .where(sql`${postTags.postId} = ANY(${postIds})`) : [];

  // Group tags by post ID
  const tagsByPostId = allTagsResult.reduce((acc, tag) => {
    if (!acc[tag.postId]) acc[tag.postId] = [];
    acc[tag.postId].push({
      id: tag.tagId,
      name: tag.tagName,
      slug: tag.tagSlug,
    });
    return acc;
  }, {} as Record<string, any[]>);

  // Format results
  const formattedPosts = postsResult.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    authorId: post.authorId,
    categoryId: post.categoryId,
    isPublished: post.isPublished,
    isPinned: post.isPinned,
    viewCount: post.viewCount,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    readingTime: post.readingTime,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: {
      id: post.authorId,
      fullName: post.authorName,
      email: post.authorEmail,
      avatarUrl: post.authorAvatar,
    },
    category: post.categoryName ? {
      id: post.categoryId!,
      name: post.categoryName,
      slug: post.categorySlug!,
      color: post.categoryColor,
    } : null,
    tags: tagsByPostId[post.id] || [],
  }));

  return {
    posts: formattedPosts,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Update post
export async function updatePost(id: string, data: Partial<NewPost>, tagIds?: string[]) {
  const updateData = { ...data };
  
  if (data.title) {
    updateData.slug = createSlug(data.title);
  }
  
  if (data.content) {
    const { readingTime, excerpt } = processPostContent(data.content);
    updateData.readingTime = readingTime;
    updateData.excerpt = excerpt;
  }
  
  updateData.updatedAt = new Date();
  
  // Update post
  const [updatedPost] = await db
    .update(posts)
    .set(updateData)
    .where(eq(posts.id, id))
    .returning();

  // Update tags if provided
  if (tagIds !== undefined) {
    // Remove existing tags
    await db.delete(postTags).where(eq(postTags.postId, id));
    
    // Add new tags
    if (tagIds.length > 0) {
      const tagRelations = tagIds.map(tagId => ({
        postId: id,
        tagId,
      }));
      await db.insert(postTags).values(tagRelations);
    }
  }

  return updatedPost;
}

// Delete post
export async function deletePost(id: string) {
  // Tags will be deleted automatically due to CASCADE
  await db.delete(posts).where(eq(posts.id, id));
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  return await db
    .select()
    .from(categories)
    .orderBy(asc(categories.name));
}

// Get all tags
export async function getTags(): Promise<Tag[]> {
  return await db
    .select()
    .from(tags)
    .orderBy(asc(tags.name));
}