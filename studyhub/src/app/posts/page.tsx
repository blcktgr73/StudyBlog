'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Loader2, Search, Calendar, Clock, Eye, User, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PostWithDetails } from '@/lib/database/posts';

interface PostsResponse {
  posts: PostWithDetails[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

function PostsList() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [pagination, setPagination] = useState<PostsResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    setSearchQuery(search);
  }, [search]);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '6',
        });

        if (category) params.append('category', category);
        if (tag) params.append('tag', tag);
        if (search) params.append('search', search);

        const response = await fetch(`/api/posts?${params}`);
        if (!response.ok) throw new Error('Failed to fetch posts');

        const data: PostsResponse = await response.json();
        setPosts(data.posts);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [page, category, tag, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (category) params.append('category', category);
    if (tag) params.append('tag', tag);
    
    window.location.href = `/posts?${params}`;
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Blog Posts</h1>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Active Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {category && (
              <Badge variant="secondary">
                Category: {category}
                <Link href="/posts" className="ml-2 hover:text-destructive">×</Link>
              </Badge>
            )}
            {tag && (
              <Badge variant="secondary">
                Tag: {tag}
                <Link href="/posts" className="ml-2 hover:text-destructive">×</Link>
              </Badge>
            )}
            {search && (
              <Badge variant="secondary">
                Search: {search}
                <Link href="/posts" className="ml-2 hover:text-destructive">×</Link>
              </Badge>
            )}
          </div>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground">
              {search || category || tag
                ? 'Try adjusting your filters or search terms.'
                : 'Be the first to write a post!'}
            </p>
            <Link href="/write">
              <Button className="mt-4">Write Your First Post</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((post) => (
                <Card key={post.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                  {post.coverImage && (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardHeader className="flex-1">
                    {/* Category */}
                    {post.category && (
                      <Link 
                        href={`/posts?category=${post.category.slug}`}
                        className="inline-block mb-2"
                      >
                        <Badge 
                          variant="outline" 
                          style={{ 
                            borderColor: post.category.color || undefined,
                            color: post.category.color || undefined 
                          }}
                        >
                          {post.category.name}
                        </Badge>
                      </Link>
                    )}

                    {/* Title */}
                    <Link href={`/posts/${post.slug}`}>
                      <h2 className="text-xl font-bold line-clamp-2 hover:underline">
                        {post.title}
                      </h2>
                    </Link>

                    {/* Excerpt */}
                    <p className="text-muted-foreground line-clamp-3 mt-2">
                      {post.excerpt}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Link 
                            key={tag.id} 
                            href={`/posts?tag=${tag.slug}`}
                          >
                            <Badge variant="secondary" className="text-xs">
                              {tag.name}
                            </Badge>
                          </Link>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{post.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          {post.author.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt={post.author.fullName || 'Author'} />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                        </Avatar>
                        <span className="text-xs">
                          {post.author.fullName || 'Anonymous'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(post.publishedAt)}</span>
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  asChild={pagination.hasPrev}
                >
                  {pagination.hasPrev ? (
                    <Link href={`/posts?page=${pagination.page - 1}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}${search ? `&search=${search}` : ''}`}>
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Link>
                  ) : (
                    <span>
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </span>
                  )}
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  asChild={pagination.hasNext}
                >
                  {pagination.hasNext ? (
                    <Link href={`/posts?page=${pagination.page + 1}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}${search ? `&search=${search}` : ''}`}>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostsList />
    </Suspense>
  );
}