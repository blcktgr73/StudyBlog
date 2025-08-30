'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/supabase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Eye, Upload, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Category, Tag } from '@/lib/database/schema';

// Dynamically import markdown editor to avoid SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 border rounded-md">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

interface PostEditPageProps {
  params: Promise<{ slug: string }>;
}

export default function PostEditPage({ params }: PostEditPageProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  const [slug, setSlug] = useState<string>('');
  const [postId, setPostId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  // Get slug from params
  useEffect(() => {
    params.then(({ slug: paramSlug }) => {
      setSlug(paramSlug);
    });
  }, [params]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?next=/write');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load post data, categories, and tags
  useEffect(() => {
    const loadData = async () => {
      if (!slug || !isAuthenticated) return;

      setIsLoading(true);
      try {
        // Get the session token from Supabase client
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const [postRes, categoriesRes, tagsRes] = await Promise.all([
          fetch(`/api/posts?slug=${slug}`, { headers }),
          fetch('/api/categories'),
          fetch('/api/tags'),
        ]);
        
        if (postRes.ok) {
          const { posts } = await postRes.json();
          const post = posts[0];
          
          if (!post) {
            router.push('/404');
            return;
          }

          // Check if user is the author
          if (post.authorId !== user?.id) {
            router.push('/403');
            return;
          }

          // Set post data
          setPostId(post.id);
          setTitle(post.title);
          setContent(post.content);
          setCoverImage(post.coverImage || '');
          setSelectedCategory(post.categoryId || '');
          setSelectedTags(post.tags.map((tag: any) => tag.id));
          setIsPublished(post.isPublished);
        } else {
          router.push('/404');
          return;
        }
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
        
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setTags(tagsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        router.push('/404');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug, isAuthenticated, user?.id, router]);

  const handleSave = async (publish: boolean = false) => {
    console.log('handleSave called with publish:', publish);
    console.log('Current state:', { 
      user: !!user, 
      title: title.trim(), 
      content: content.length, 
      postId 
    });
    
    if (!user || !title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }

    console.log('Setting isSaving to true...');
    setIsSaving(true);
    
    try {
      console.log('Using auth store to get session...');
      // Try to get session directly from auth store or localStorage
      let accessToken = null;
      
      // Method 1: Try localStorage
      try {
        const storedSession = localStorage.getItem('sb-dhrzglinsvpyeqnhkcct-auth-token');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          accessToken = sessionData?.access_token;
          console.log('Got token from localStorage:', !!accessToken);
        }
      } catch (e) {
        console.log('localStorage method failed:', e);
      }
      
      // Method 2: If localStorage failed, try direct supabase call with timeout
      if (!accessToken) {
        try {
          console.log('Trying supabase.auth.getSession() with timeout...');
          const { data: { session } } = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
          ]) as any;
          
          accessToken = session?.access_token;
          console.log('Got token from supabase:', !!accessToken);
        } catch (e) {
          console.log('Supabase session failed:', e);
        }
      }
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('Authorization header added with token');
      } else {
        console.warn('No access token available, using cookies only');
      }

      console.log('Edit: Making PATCH request with headers:', headers);
      console.log('Request URL:', `/api/posts/${postId}`);

      const requestBody = {
        title: title.trim(),
        content: content.trim(),
        categoryId: selectedCategory || null,
        tagIds: selectedTags,
        isPublished: publish,
        coverImage: coverImage || null,
      };
      
      console.log('Request body:', requestBody);

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(requestBody),
      });

      console.log('Response received:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', response.status, errorData);
        throw new Error(`Failed to update post: ${response.status} - ${errorData}`);
      }

      console.log('Parsing response JSON...');
      const updatedPost = await response.json();
      console.log('Updated post:', updatedPost);
      
      console.log('Redirecting...');
      if (publish) {
        router.push(`/posts/${updatedPost.slug}`);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      console.log('Setting isSaving to false...');
      setIsSaving(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    
    try {
      const result = await uploadImage(file, 'covers');
      
      if (result.error) {
        alert(`Failed to upload image: ${result.error}`);
        return;
      }

      if (result.data) {
        setCoverImage(result.data.url);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (authLoading || !isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/posts/${slug}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Post
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Edit Post</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {isPublished ? 'Update & Publish' : 'Publish'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title */}
            <Card>
              <CardContent className="p-4">
                <Input
                  placeholder="Enter your post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
                />
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cover Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {coverImage && (
                  <div className="relative">
                    <img
                      src={coverImage}
                      alt="Cover"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setCoverImage('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div>
                  <label htmlFor="cover-upload">
                    <Button variant="outline" className="cursor-pointer" disabled={isUploadingImage} asChild>
                      <span>
                        {isUploadingImage ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {isUploadingImage ? 'Uploading...' : 'Upload Cover Image'}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Markdown Editor */}
            <Card>
              <CardContent className="p-0">
                <div data-color-mode="auto">
                  <MDEditor
                    value={content}
                    onChange={(value) => setContent(value || '')}
                    preview="edit"
                    hideToolbar={false}
                    textareaProps={{
                      placeholder: 'Write your post content in Markdown...',
                      style: {
                        fontSize: 16,
                        lineHeight: 1.6,
                        fontFamily: 'inherit',
                      },
                    }}
                    height={500}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Category Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Category</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Tags Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleTagToggle(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  {selectedTags.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Click on tags to select them
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Post Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Post Stats</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>Characters: {content.length}</div>
                <div>Words: {content.split(/\s+/).filter(Boolean).length}</div>
                <div>Reading time: ~{Math.ceil(content.split(/\s+/).filter(Boolean).length / 200)} min</div>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={isPublished ? "default" : "secondary"}>
                  {isPublished ? "Published" : "Draft"}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}