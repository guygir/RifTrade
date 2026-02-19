'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isTradingEnabled, setIsTradingEnabled] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Listen for auth state changes (e.g., after signup/login)
    const supabase = createSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      try {
        if (session?.user) {
          setIsAuthenticated(true);
          // Fetch username when auth state changes
          fetchUsername(session.user.id).catch((err: any) => {
            // Ignore AbortError - it's expected when component unmounts or React Strict Mode double-renders
            if (err?.name !== 'AbortError' && !err?.message?.includes('AbortError')) {
              console.error('Error in auth state change callback:', err);
            }
          });
        } else {
          setIsAuthenticated(false);
          setUsername(null);
        }
      } catch (err: any) {
        // Ignore AbortError - it's expected when component unmounts or React Strict Mode double-renders
        if (err?.name !== 'AbortError' && !err?.message?.includes('AbortError')) {
          console.error('Error in auth state change callback:', err);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUsername = async (userId: string) => {
    try {
      const supabase = createSupabaseClient();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, is_trading_enabled')
        .eq('user_id', userId)
        .single();
      
      if (profileData?.username) {
        setUsername(profileData.username);
      }
      
      // Set trading enabled status (default to true for existing users without the field)
      setIsTradingEnabled(profileData?.is_trading_enabled ?? true);
    } catch (err: any) {
      // Ignore AbortError - it's expected when component unmounts or React Strict Mode double-renders
      if (err?.name === 'AbortError' || err?.message?.includes('AbortError')) {
        return;
      }
      console.error('Error fetching username:', err);
    }
  };

  const checkAuth = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        await fetchUsername(user.id);
      }
    } catch (err: any) {
      // Ignore AbortError - it's expected when component unmounts or React Strict Mode double-renders
      if (err?.name === 'AbortError' || err?.message?.includes('AbortError')) {
        return;
      }
      console.error('Error checking auth:', err);
    }
  };

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            RifTrade - Riftbound Card Swap
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/riftle" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Riftle
            </Link>
            {/* Only show trading features for users with trading enabled */}
            {isTradingEnabled && (
              <>
                <Link href="/cards" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                  Cards
                </Link>
                <Link href="/search" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                  Search
                </Link>
              </>
            )}
            {isAuthenticated && isTradingEnabled && <NotificationBell />}
            {isAuthenticated ? (
              isTradingEnabled ? (
                <Link href="/profile" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                  Profile
                </Link>
              ) : null
            ) : (
              <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Login
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

