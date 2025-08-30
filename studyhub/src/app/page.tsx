import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { BookOpen, Users, TrendingUp, Calendar, Clock, Eye, User } from "lucide-react"
import Link from "next/link"
import { getPostsSupabase } from "@/lib/database/posts-supabase"

async function getLatestPosts() {
  try {
    const result = await getPostsSupabase({
      page: 1,
      limit: 3,
      published: true,
    });
    return result.posts;
  } catch (error) {
    console.error('Error fetching latest posts:', error);
    return [];
  }
}

export default async function Home() {
  const latestPosts = await getLatestPosts();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Welcome to StudyHub
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                A platform for sharing knowledge and learning together. Write, read, and connect with fellow learners.
              </p>
            </div>
            <div className="space-x-4">
              <Button asChild>
                <Link href="/posts">Explore Posts</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/write">Start Writing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary" />
                <CardTitle>Share Knowledge</CardTitle>
                <CardDescription>
                  Write and share your learning experiences with the community
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary" />
                <CardTitle>Build Community</CardTitle>
                <CardDescription>
                  Connect with fellow learners and grow together
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary" />
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>
                  Monitor your learning journey and achievements
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Latest Posts Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Latest Posts
            </h2>
            <p className="mx-auto max-w-[600px] text-gray-500 md:text-lg dark:text-gray-400">
              Discover the most recent knowledge shared by our community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.length > 0 ? (
              latestPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  {post.coverImage && (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      {post.category && (
                        <Badge 
                          variant="secondary"
                          style={{ 
                            borderColor: post.category.color || undefined,
                            color: post.category.color || undefined 
                          }}
                        >
                          {post.category.name}
                        </Badge>
                      )}
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                    </div>
                    <Link href={`/posts/${post.slug}`}>
                      <CardTitle className="text-lg hover:underline line-clamp-2">
                        {post.title}
                      </CardTitle>
                    </Link>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          {post.author.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt={post.author.fullName || 'Author'} />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {post.author.fullName || 'Anonymous'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
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
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share your knowledge with the community!
                </p>
                <Button asChild>
                  <Link href="/write">Write Your First Post</Link>
                </Button>
              </div>
            )}
          </div>
          
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/posts">View All Posts</Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}