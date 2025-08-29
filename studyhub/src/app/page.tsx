import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function Home() {
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
            {/* Placeholder posts - will be replaced with real data */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="secondary">Tutorial</Badge>
                    <span className="text-sm text-gray-500">2 days ago</span>
                  </div>
                  <CardTitle className="text-lg">
                    Getting Started with Next.js 14
                  </CardTitle>
                  <CardDescription>
                    Learn the basics of building modern web applications with Next.js 14 and React.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>By John Doe</span>
                    <span>•</span>
                    <span>5 min read</span>
                  </div>
                </CardContent>
              </Card>
            ))}
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