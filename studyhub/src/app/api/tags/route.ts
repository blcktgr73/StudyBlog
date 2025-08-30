import { NextResponse } from 'next/server';
import { getTagsSupabase } from '@/lib/database/posts-supabase';

export async function GET() {
  console.log('GET /api/tags - Starting request');
  try {
    const tags = await getTagsSupabase();
    console.log('Tags fetched:', tags.length);
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}