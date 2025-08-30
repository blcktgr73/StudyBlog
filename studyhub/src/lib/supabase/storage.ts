import { supabase } from './client';

// Test Supabase Storage connection
export async function testStorageConnection() {
  try {
    console.log('Testing Supabase Storage connection...');
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Storage connection error:', error);
      return { error: error.message };
    }
    console.log('Storage connection successful. Buckets:', data);
    return { data };
  } catch (error) {
    console.error('Storage connection test failed:', error);
    return { error: 'Failed to connect to storage' };
  }
}

// Check if images bucket exists (don't try to create)
export async function checkImagesBucket() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Error listing buckets:', error);
      return { error: error.message };
    }
    
    const imagesBucket = buckets?.find(bucket => bucket.name === 'images');
    
    if (!imagesBucket) {
      console.error('Images bucket does not exist');
      return { error: 'Images bucket not found. Please create it manually in Supabase Dashboard.' };
    }
    
    console.log('Images bucket found:', imagesBucket);
    return { data: imagesBucket };
  } catch (error) {
    console.error('Error in checkImagesBucket:', error);
    return { error: error.message || 'Failed to check storage bucket' };
  }
}

// Upload image to Supabase Storage
export async function uploadImage(file: File, path?: string): Promise<{
  data?: { path: string; url: string };
  error?: string;
}> {
  console.log('Starting image upload...', { 
    fileName: file.name, 
    fileSize: file.size, 
    fileType: file.type 
  });
  
  try {
    // Generate unique filename
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    const filePath = path ? `${path}/${fileName}` : `posts/${fileName}`;

    console.log('Generated file path:', filePath);

    // Check file size (5MB limit)
    if (file.size > 5242880) {
      console.log('File size too large:', file.size);
      return { error: 'File size must be less than 5MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      console.log('Invalid file type:', file.type);
      return { error: 'Only JPEG, PNG, WebP, and GIF files are allowed' };
    }

    // Check if bucket exists
    console.log('Checking if bucket exists...');
    const bucketResult = await checkImagesBucket();
    if (bucketResult.error) {
      console.error('Bucket check failed:', bucketResult.error);
      return { error: bucketResult.error };
    }
    console.log('Bucket ready');

    // Upload file
    console.log('Starting file upload to Supabase...');
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { error: error.message || 'Failed to upload image' };
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    console.log('Generated public URL:', urlData.publicUrl);

    return {
      data: {
        path: filePath,
        url: urlData.publicUrl
      }
    };
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return { error: 'An unexpected error occurred during upload' };
  }
}

// Delete image from Supabase Storage
export async function deleteImage(path: string): Promise<{
  data?: any;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { error: error.message || 'Failed to delete image' };
    }

    return { data };
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return { error: 'An unexpected error occurred during deletion' };
  }
}

// Get image URL from path
export function getImageUrl(path: string): string {
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(path);
  
  return data.publicUrl;
}