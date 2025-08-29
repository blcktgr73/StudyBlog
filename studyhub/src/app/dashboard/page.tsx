'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { Loader2, User, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, signOut, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?next=/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile</span>
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Name:</strong> {user.fullName || 'Not set'}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>GitHub:</strong> {user.githubUsername || 'Not connected'}</p>
              <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Posts</CardTitle>
              <CardDescription>Manage your blog posts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No posts yet</p>
              <Button className="mt-4" disabled>
                Write your first post
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Your reading stats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Posts:</strong> 0</p>
                <p><strong>Views:</strong> 0</p>
                <p><strong>Likes:</strong> 0</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to StudyHub! 🎉</CardTitle>
            <CardDescription>
              Your authentication system is working! This is a protected page that only authenticated users can see.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                You&apos;ve successfully completed <strong>Iteration 2</strong> of the StudyHub development process:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>✅ Supabase project and environment variables set up</li>
                <li>✅ Drizzle ORM configured with database schema</li>
                <li>✅ Authentication system implemented</li>
                <li>✅ Sign up and login pages created</li>
                <li>✅ GitHub OAuth integration ready</li>
                <li>✅ Zustand state management for auth</li>
                <li>✅ Protected routes and session management</li>
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                Next: <strong>Iteration 3</strong> - Blog post CRUD functionality with markdown editor.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}