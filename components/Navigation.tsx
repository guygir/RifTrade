'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  return (
    <nav className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Riftbound Card Swap
          </Link>
          <div className="flex gap-4">
            <Link href="/cards" className="hover:text-blue-600">
              Cards
            </Link>
            <Link href="/search" className="hover:text-blue-600">
              Search
            </Link>
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

