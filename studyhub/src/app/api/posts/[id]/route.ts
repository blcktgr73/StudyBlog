import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updatePost, deletePost } from '@/lib/database/posts';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/database/connection';
import { posts } from '@/lib/database/schema';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Params {
  id: string;
}

// PATCH /api/posts/[id] - Update a post
export async function PATCH(
  request: NextRequest, 
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user owns the post
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (existingPost.authorId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own posts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, categoryId, tagIds, isPublished, coverImage } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      if (isPublished && !existingPost.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (coverImage !== undefined) updateData.coverImage = coverImage;

    const updatedPost = await updatePost(id, updateData, tagIds);

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user owns the post
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (existingPost.authorId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own posts' },
        { status: 403 }
      );
    }

    await deletePost(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}