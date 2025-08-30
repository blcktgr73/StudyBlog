import { NextResponse } from 'next/server';
import { getCategoriesSupabase } from '@/lib/database/posts-supabase';

export async function GET() {
  console.log('GET /api/categories - Starting request');
  try {
    const categories = await getCategoriesSupabase();
    console.log('Categories fetched:', categories.length);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}