import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
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
  console.log('PATCH /api/posts/[id] - Starting request processing');
  try {
    const { id } = await context.params;
    
    const supabase = await createClient();
    
    // Try to get user from authorization header first, then fallback to cookies
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    let user = null;
    let authError = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('Using Authorization header token');
      const token = authHeader.substring(7);
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user owns the post using Admin client to access drafts
    console.log('Checking if post exists and user owns it...');
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, author_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPost) {
      console.error('Post not found:', fetchError);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (existingPost.author_id !== user.id) {
      console.log('User does not own this post');
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own posts' },
        { status: 403 }
      );
    }

    console.log('User owns the post, proceeding with update...');

    const body = await request.json();
    console.log('Request body:', body);
    const { title, content, categoryId, tagIds, isPublished, coverImage } = body;

    // Prepare update data for Supabase
    const updateData: any = {
      updated_at: new Date().toISOString() // Always update the timestamp
    };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (isPublished !== undefined) {
      updateData.is_published = isPublished;
      if (isPublished) {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (coverImage !== undefined) updateData.cover_image = coverImage;

    console.log('Update data:', updateData);

    // Debug: Check current post data structure
    const { data: currentPost, error: currentError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    
    console.log('Current post data:', currentPost);
    console.log('Current post fetch error:', currentError);

    // Update the post using Admin client to access drafts
    const { data: updatedPosts, error: updateError, count } = await supabaseAdmin
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select();

    console.log('Update result - data:', updatedPosts);
    console.log('Update result - error:', updateError);
    console.log('Update result - count:', count);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update post', details: updateError },
        { status: 500 }
      );
    }

    if (!updatedPosts || updatedPosts.length === 0) {
      console.error('No posts were updated');
      // Let's try a different approach - maybe RLS is blocking the update
      console.log('Attempting update with admin client...');
      
      const { data: adminUpdatedPosts, error: adminUpdateError } = await supabaseAdmin
        .from('posts')
        .update(updateData)
        .eq('id', id)
        .select();
      
      console.log('Admin update result - data:', adminUpdatedPosts);
      console.log('Admin update result - error:', adminUpdateError);
      
      if (adminUpdateError) {
        return NextResponse.json(
          { error: 'Failed to update post via admin', details: adminUpdateError },
          { status: 500 }
        );
      }
      
      if (!adminUpdatedPosts || adminUpdatedPosts.length === 0) {
        return NextResponse.json(
          { error: 'Post not found or update failed even with admin access' },
          { status: 404 }
        );
      }
      
      const updatedPost = adminUpdatedPosts[0];
      console.log('Post updated successfully via admin:', updatedPost);
      return NextResponse.json(updatedPost);
    }

    const updatedPost = updatedPosts[0];
    console.log('Post updated successfully:', updatedPost);

    // TODO: Handle tagIds update if needed
    if (tagIds && tagIds.length > 0) {
      console.log('Tag updates not implemented yet');
    }

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
  console.log('DELETE /api/posts/[id] - Starting request processing');
  try {
    const { id } = await context.params;
    
    const supabase = await createClient();
    
    // Try to get user from authorization header first, then fallback to cookies
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    let user = null;
    let authError = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('Using Authorization header token');
      const token = authHeader.substring(7);
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user owns the post using Admin client to access drafts
    console.log('Checking if post exists and user owns it...');
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, author_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPost) {
      console.error('Post not found:', fetchError);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (existingPost.author_id !== user.id) {
      console.log('User does not own this post');
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own posts' },
        { status: 403 }
      );
    }

    console.log('User owns the post, proceeding with delete...');

    // Delete the post using Admin client to access drafts
    const { data: deletedData, error: deleteError, count } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id)
      .select();

    console.log('Delete result - data:', deletedData);
    console.log('Delete result - error:', deleteError);
    console.log('Delete result - count:', count);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete post', details: deleteError },
        { status: 500 }
      );
    }

    if (!deletedData || deletedData.length === 0) {
      console.error('No posts were deleted - possible RLS issue');
      return NextResponse.json(
        { error: 'Post not found or delete failed' },
        { status: 404 }
      );
    }

    console.log(`Post deleted successfully - ${deletedData.length} row(s) affected`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}