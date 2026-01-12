'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import NotificationBell from './NotificationBell';

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    
    // Listen for auth state changes (e.g., after signup/login)
    const supabase = createSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        // Fetch username when auth state changes
        fetchUsername(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUsername(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUsername = async (userId: string) => {
    const supabase = createSupabaseClient();
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', userId)
      .single();
    
    if (profileData?.username) {
      setUsername(profileData.username);
    }
  };

  const checkAuth = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    
    if (user) {
      await fetchUsername(user.id);
    }
  };

  return (
    <nav className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            RifTrade - Riftbound Card Swap
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/cards" className="hover:text-blue-600">
              Cards
            </Link>
            <Link href="/search" className="hover:text-blue-600">
              Search
            </Link>
            {isAuthenticated && <NotificationBell />}
            {isAuthenticated ? (
              <Link href="/profile" className="hover:text-blue-600">
                Profile
              </Link>
            ) : (
              <Link href="/login" className="hover:text-blue-600">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

