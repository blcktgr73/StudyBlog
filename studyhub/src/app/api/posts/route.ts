import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPostSupabase, getPostsSupabase } from '@/lib/database/posts-supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/posts - Get posts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const categorySlug = searchParams.get('category') || undefined;
    const tagSlug = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;
    const authorId = searchParams.get('author') || undefined;

    // Check if user is requesting their own posts (can see drafts)
    const supabase = await createClient();
    
    // Try to get user from authorization header first, then fallback to cookies
    const authHeader = request.headers.get('authorization');
    let user = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    } else {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
    const isOwnPosts = user && authorId === user.id;

    // For slug queries, if user is authenticated, allow them to see their drafts too
    const slugQuery = searchParams.get('slug');
    const shouldShowDrafts = isOwnPosts || (user && slugQuery);

    console.log('GET /api/posts - Debug info:');
    console.log('- Current user:', user?.id);
    console.log('- Requested author:', authorId);
    console.log('- Slug query:', slugQuery);
    console.log('- isOwnPosts:', isOwnPosts);
    console.log('- shouldShowDrafts:', shouldShowDrafts);
    console.log('- published filter:', shouldShowDrafts ? undefined : true);
    
    const result = await getPostsSupabase({
      page,
      limit,
      categorySlug,
      tagSlug,
      search,
      authorId,
      slug: slugQuery,
      published: shouldShowDrafts ? undefined : true, // Show drafts for own posts or when editing
    });

    console.log('- Posts returned:', result.posts.length);
    console.log('- Posts is_published values:', result.posts.map(p => p.isPublished));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  console.log('POST /api/posts - Starting request processing');
  try {
    const supabase = await createClient();
    
    // Try to get user from authorization header first, then fallback to cookies
    const authHeader = request.headers.get('authorization');
    let user = null;
    let authError = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Using Authorization header token');
      const { data, error } = await supabase.auth.getUser(token);
      user = data.user;
      authError = error;
    } else {
      console.log('Using cookie-based authentication');
      const { data, error } = await supabase.auth.getUser();
      user = data.user;
      authError = error;
    }

    console.log('Auth check - User:', user ? `authenticated (${user.id})` : 'not authenticated');
    console.log('Auth error details:', authError);
    
    if (authError || !user) {
      console.log('Auth failed - authError:', authError?.message, 'user:', !!user);
      return NextResponse.json(
        { error: `Unauthorized - ${authError?.message || 'No user found'}` },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { title, content, categoryId, tagIds, isPublished, coverImage } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const post = await createPostSupabase({
      title,
      content,
      authorId: user.id,
      categoryId: categoryId || undefined,
      tagIds: tagIds || undefined,
      isPublished: Boolean(isPublished),
      coverImage: coverImage || undefined,
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}