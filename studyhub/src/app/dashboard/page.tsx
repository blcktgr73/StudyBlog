'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase/client';
import { Loader2, User, LogOut, Plus, Edit, Eye, Calendar, Clock, Trash2, Home } from 'lucide-react';
import type { PostWithDetails } from '@/lib/database/posts';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, signOut, initialize } = useAuthStore();
  const [userPosts, setUserPosts] = useState<PostWithDetails[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts'>('all');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?next=/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return;
      
      try {
        // Get the session token from Supabase client
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`/api/posts?author=${user.id}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setUserPosts(data.posts);
        }
      } catch (error) {
        console.error('Error fetching user posts:', error);
      } finally {
        setPostsLoading(false);
      }
    };

    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleDeletePost = async (postId: string, postTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(postId);
    try {
      // Get the session token from Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to delete post: ${response.status} - ${errorData}`);
      }

      // Remove the deleted post from the state
      setUserPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p>Redirecting to login...</p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Debug: Log the first post to check isPublished field
  if (userPosts.length > 0) {
    console.log('First post data:', userPosts[0]);
    console.log('isPublished type:', typeof userPosts[0].isPublished);
    console.log('isPublished value:', userPosts[0].isPublished);
  }

  const publishedPosts = userPosts.filter(post => post.isPublished);
  const draftPosts = userPosts.filter(post => !post.isPublished);
  
  console.log('Total posts:', userPosts.length);
  console.log('Published posts:', publishedPosts.length);
  console.log('Draft posts:', draftPosts.length);
  
  const totalViews = userPosts.reduce((sum, post) => sum + post.viewCount, 0);
  const totalLikes = userPosts.reduce((sum, post) => sum + post.likeCount, 0);

  // Filter posts based on active tab
  const filteredPosts = (() => {
    switch (activeTab) {
      case 'published':
        return publishedPosts;
      case 'drafts':
        return draftPosts;
      default:
        return userPosts;
    }
  })();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link href="/write">
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Link>
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                  <p className="text-2xl font-bold">{userPosts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold">{publishedPosts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold">{draftPosts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Engagement</p>
                  <p className="text-2xl font-bold">{totalViews + totalLikes}</p>
                  <p className="text-xs text-muted-foreground mt-1">{totalViews} views • {totalLikes} likes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Name:</strong> {user.fullName || 'Not set'}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
              <div>
                <p><strong>GitHub:</strong> {user.githubUsername || 'Not connected'}</p>
                <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Posts</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/write">
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Link>
              </Button>
            </div>
            
            {/* Tabs */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
              <Button
                variant={activeTab === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('all')}
                className="px-3 py-1.5 h-auto text-sm"
              >
                All ({userPosts.length})
              </Button>
              <Button
                variant={activeTab === 'published' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('published')}
                className="px-3 py-1.5 h-auto text-sm"
              >
                Published ({publishedPosts.length})
              </Button>
              <Button
                variant={activeTab === 'drafts' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('drafts')}
                className="px-3 py-1.5 h-auto text-sm"
              >
                Drafts ({draftPosts.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'all' 
                    ? "You haven't written any posts yet." 
                    : activeTab === 'published' 
                    ? "No published posts yet." 
                    : "No drafts yet."
                  }
                </p>
                <Button asChild>
                  <Link href="/write">Write Your First Post</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Link href={`/posts/${post.slug}`} className="font-semibold hover:underline">
                          {post.title}
                        </Link>
                        {!post.isPublished && (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                        {post.category && (
                          <Badge 
                            variant="outline"
                            style={{ 
                              borderColor: post.category.color || undefined,
                              color: post.category.color || undefined 
                            }}
                          >
                            {post.category.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/write/${post.slug}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeletePost(post.id, post.title)}
                          disabled={deleteLoading === post.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deleteLoading === post.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readingTime}min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{post.viewCount}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {post.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{post.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}