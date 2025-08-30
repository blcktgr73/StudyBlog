import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Test endpoint
export async function GET() {
  console.log('API: Upload GET endpoint called');
  return NextResponse.json({ message: 'Upload API is working' });
}

export async function POST(request: NextRequest) {
  console.log('API: Upload endpoint called');
  try {
    // Verify user is authenticated
    console.log('API: Checking authentication...');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('API: Authentication failed:', { authError, user: !!user });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('API: User authenticated:', user.id);

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string || 'posts';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('API: Starting image upload...', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    });

    // Check file size (5MB limit)
    if (file.size > 5242880) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, and GIF files are allowed' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    const filePath = `${path}/${fileName}`;

    console.log('API: Generated file path:', filePath);

    // Check if bucket exists (don't create, just verify)
    console.log('API: Checking if images bucket exists...');
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const imagesBucket = buckets?.find(bucket => bucket.name === 'images');
    
    if (!imagesBucket) {
      console.error('API: Images bucket does not exist');
      return NextResponse.json(
        { error: 'Images bucket not found. Please create "images" bucket in Supabase Dashboard with public access enabled.' },
        { status: 500 }
      );
    }
    
    console.log('API: Images bucket found:', imagesBucket.name);

    // Upload file using admin client
    console.log('API: Starting file upload to Supabase...');
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('API: Upload error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to upload image' },
        { status: 500 }
      );
    }

    console.log('API: Upload successful:', data);

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(filePath);

    console.log('API: Generated public URL:', urlData.publicUrl);

    return NextResponse.json({
      data: {
        path: filePath,
        url: urlData.publicUrl
      }
    });

  } catch (error) {
    console.error('API: Error in upload endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during upload' },
      { status: 500 }
    );
  }
}