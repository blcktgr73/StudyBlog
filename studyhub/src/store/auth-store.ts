import { create } from 'zustand';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  githubUsername?: string;
  twitterUsername?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGitHub: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<User>) => Promise<{ error?: string }>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  supabaseUser: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        set({ isLoading: false });
        return;
      }

      if (session?.user) {
        // If we have a user, fetch their profile
        await get().refreshUser();
      } else {
        set({ 
          user: null, 
          supabaseUser: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await get().refreshUser();
        } else if (event === 'SIGNED_OUT') {
          set({ 
            user: null, 
            supabaseUser: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          set({ supabaseUser: session.user });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !supabaseUser) {
        set({ 
          user: null, 
          supabaseUser: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
        return;
      }

      // TODO: Fetch user profile from our database using Drizzle
      // For now, we'll use Supabase user data
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        fullName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
        avatarUrl: supabaseUser.user_metadata?.avatar_url,
        bio: undefined,
        website: undefined,
        githubUsername: supabaseUser.user_metadata?.user_name,
        twitterUsername: undefined,
        createdAt: supabaseUser.created_at,
        updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
      };

      set({ 
        user: userData, 
        supabaseUser, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error refreshing user:', error);
      set({ 
        user: null, 
        supabaseUser: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      // User will be automatically signed in if email confirmation is disabled
      // Otherwise, they need to check their email
      set({ isLoading: false });
      return {};
    } catch (error) {
      set({ isLoading: false });
      return { error: 'An unexpected error occurred' };
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      // The auth state change will trigger refreshUser
      return {};
    } catch (error) {
      set({ isLoading: false });
      return { error: 'An unexpected error occurred' };
    }
  },

  signInWithGitHub: async () => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      // OAuth will redirect, so loading state will be handled by the redirect
      return {};
    } catch (error) {
      set({ isLoading: false });
      return { error: 'An unexpected error occurred' };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
      }

      // The auth state change will clear the user state
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  },

  updateProfile: async (profile: Partial<User>) => {
    const { user, supabaseUser } = get();
    
    if (!user || !supabaseUser) {
      return { error: 'User not authenticated' };
    }

    set({ isLoading: true });

    try {
      // TODO: Update user profile in our database using Drizzle
      // For now, we'll update the Supabase user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.fullName,
          avatar_url: profile.avatarUrl,
        },
      });

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      // Update local state
      set({ 
        user: { ...user, ...profile }, 
        isLoading: false 
      });

      return {};
    } catch (error) {
      set({ isLoading: false });
      return { error: 'An unexpected error occurred' };
    }
  },
}));