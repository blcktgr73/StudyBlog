import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { createClient } from '@/lib/supabase/server';
import { getPostBySlug } from '@/lib/database/posts';
import { getPostBySlugSupabase } from '@/lib/database/posts-supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { PostActions } from '@/components/posts/post-actions';
import { 
  Calendar, 
  Clock, 
  Eye, 
  User, 
  ArrowLeft,
  Share2,
  Bookmark
} from 'lucide-react';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string, userId?: string) {
  try {
    const post = await getPostBySlugSupabase(slug);
    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  
  // Get current user if authenticated
  let currentUserId: string | undefined;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id;
  } catch (error) {
    // User not authenticated, that's fine
  }

  const post = await getPost(slug, currentUserId);

  if (!post) {
    notFound();
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isAuthor = currentUserId === post.authorId;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6">
        {/* Back Button */}
        <Link href="/posts">
          <Button variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Button>
        </Link>

        {/* Header */}
        <header className="mb-8">
          {/* Category */}
          {post.category && (
            <Link 
              href={`/posts?category=${post.category.slug}`}
              className="inline-block mb-4"
            >
              <Badge 
                variant="outline" 
                className="text-sm"
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
          <h1 className="text-4xl font-bold leading-tight mb-4">
            {post.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            {/* Author */}
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                {post.author.avatarUrl ? (
                  <img 
                    src={post.author.avatarUrl} 
                    alt={post.author.fullName || 'Author'} 
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Avatar>
              <span className="font-medium">
                {post.author.fullName || 'Anonymous'}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{post.readingTime} min read</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{post.viewCount} views</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>

            {/* Author Actions */}
            {isAuthor && (
              <Suspense fallback={<div>Loading...</div>}>
                <PostActions postId={post.id} postSlug={post.slug} />
              </Suspense>
            )}
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="mt-6 mb-8">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
              />
            </div>
          )}
        </header>

        {/* Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  // Custom styling for code blocks
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <code 
                        className={`${className} bg-muted px-2 py-1 rounded text-sm`} 
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <code 
                        className="bg-muted px-1 py-0.5 rounded text-sm" 
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  // Custom styling for links
                  a: ({ node, children, ...props }) => (
                    <a 
                      className="text-primary hover:underline" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        {post.tags.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <h3 className="text-lg font-semibold">Tags</h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link key={tag.id} href={`/posts?tag=${tag.slug}`}>
                    <Badge variant="secondary" className="hover:bg-secondary/80">
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Author Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                {post.author.avatarUrl ? (
                  <img 
                    src={post.author.avatarUrl} 
                    alt={post.author.fullName || 'Author'} 
                  />
                ) : (
                  <User className="h-8 w-8" />
                )}
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  {post.author.fullName || 'Anonymous Author'}
                </h3>
                <p className="text-muted-foreground">
                  Writer and content creator sharing insights about technology, 
                  education, and personal development.
                </p>
                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}