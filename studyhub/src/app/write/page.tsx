'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Eye, Upload, X } from 'lucide-react';
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

export default function WritePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?next=/write');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load categories and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/tags'),
        ]);
        
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
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleSave = async (publish: boolean = false) => {
    if (!user || !title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }

    setIsSaving(true);
    
    try {
      // Get the session token from Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          categoryId: selectedCategory || null,
          tagIds: selectedTags,
          isPublished: publish,
          coverImage: coverImage || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', response.status, errorData);
        throw new Error(`Failed to save post: ${response.status} - ${errorData}`);
      }

      const post = await response.json();
      
      if (publish) {
        router.push(`/posts/${post.slug}`);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post. Please try again.');
    } finally {
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

    // For now, we'll just use a placeholder URL
    // In a real implementation, you'd upload to Supabase Storage
    const imageUrl = URL.createObjectURL(file);
    setCoverImage(imageUrl);
    
    // TODO: Implement actual image upload to Supabase Storage
    console.log('Image upload to be implemented:', file);
  };

  if (authLoading || !isAuthenticated) {
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
          <h1 className="text-3xl font-bold">Write New Post</h1>
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
              Publish
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
                    <Button variant="outline" className="cursor-pointer" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Cover Image
                      </span>
                    </Button>
                  </label>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
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
          </div>
        </div>
      </div>
    </div>
  );
}