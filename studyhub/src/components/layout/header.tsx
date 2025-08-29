"use client"

import Link from "next/link"
import { BookOpen, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { useAuthStore } from "@/store/auth-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar } from "@/components/ui/avatar"

export function Header() {
  const { user, isAuthenticated, signOut } = useAuthStore();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        {/* Logo */}
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <BookOpen className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">StudyHub</span>
          </Link>
        </div>
        
        {/* Mobile Logo */}
        <div className="mr-4 flex md:hidden">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <BookOpen className="h-6 w-6" />
            <span className="font-bold">StudyHub</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/posts"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Posts
          </Link>
          <Link
            href="/categories"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Categories
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search will go here in next iteration */}
          </div>
          <nav className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/write">Write</Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.fullName || user.email} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.fullName || 'User'}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </>
            )}
            
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}