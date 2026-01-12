'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Profile, UserMatch } from '@/lib/supabase/types';
import { getNewMatchesCount, markMatchesAsRead, detectAndStoreMatches } from '@/lib/match-storage';

interface MatchWithProfile extends UserMatch {
  matched_profile: Profile;
}

export default function NotificationBell() {
  const pathname = usePathname();
  const [newMatchesCount, setNewMatchesCount] = useState(0);
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const checkingRef = useRef(false); // Prevent concurrent checks
  const profileIdRef = useRef<string | null>(null); // Cache profile ID

  // Memoize checkMatches to prevent recreation on every render
  const checkMatches = useCallback(async () => {
    // Prevent concurrent calls
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setNewMatchesCount(0);
        setMatches([]);
        profileIdRef.current = null;
        return;
      }

      // Use cached profile ID if available, otherwise fetch it
      let profileId = profileIdRef.current;
      if (!profileId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) return;
        profileId = profile.id;
        profileIdRef.current = profileId;
      }

      // Recalculate matches to ensure they're up-to-date (picks up changes from other users)
      // Then get new matches count
      if (profileId) {
        // Recalculate matches first to ensure we have the latest data
        await detectAndStoreMatches(profileId);
        // Then get the count of new matches
        const count = await getNewMatchesCount(profileId);
        setNewMatchesCount(count);
      }

      // Note: Don't auto-load matches here - only load when bell is clicked
    } finally {
      checkingRef.current = false;
    }
  }, []); // Empty deps - use refs for isOpen to avoid recreating

  useEffect(() => {
    // Check for matches count when component mounts or route changes (page loads/navigates)
    checkMatches();
  }, [checkMatches, pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadMatches = async (profileId: string) => {
    setLoading(true);
    const supabase = createSupabaseClient();

    try {
      const { data: matchesData, error } = await supabase
        .from('user_matches')
        .select(`
          *,
          matched_profile:profiles!user_matches_matched_profile_id_fkey(*)
        `)
        .eq('user_profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setMatches((matchesData || []) as MatchWithProfile[]);
    } catch (err) {
      console.error('Error loading matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = async () => {
    if (!isOpen) {
      // Opening dropdown - load matches
      // Use cached profile ID if available
      if (profileIdRef.current) {
        await loadMatches(profileIdRef.current);
      } else {
        // Fallback: get profile ID if not cached
        const supabase = createSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            profileIdRef.current = profile.id;
            await loadMatches(profile.id);
          }
        }
      }
    }
    
    setIsOpen(!isOpen);
  };

  const handleMatchClick = async (matchId: string) => {
    // Mark this specific match as read when user clicks on it
    if (profileIdRef.current) {
      const supabase = createSupabaseClient();
      await supabase
        .from('user_matches')
        .update({ is_new: false, updated_at: new Date().toISOString() })
        .eq('id', matchId)
        .eq('user_profile_id', profileIdRef.current);
      
      // Update local state
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, is_new: false } : m));
      setNewMatchesCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Notifications"
      >
        <svg
          className={`w-6 h-6 ${newMatchesCount > 0 ? 'text-red-600' : 'text-gray-600'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {newMatchesCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {newMatchesCount > 9 ? '9+' : newMatchesCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Matches</h3>
            <p className="text-sm text-gray-600">
              {matches.length === 0 ? 'No matches yet' : `${matches.length} match${matches.length !== 1 ? 'es' : ''}`}
            </p>
          </div>

          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : matches.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No matches found. Update your have/want lists to find trading partners!
            </div>
          ) : (
            <div className="divide-y">
              {matches.map((match) => (
                <Link
                  key={match.id}
                  href={match.matched_profile.username ? `/${match.matched_profile.username}` : '#'}
                  onClick={() => {
                    handleMatchClick(match.id);
                    setIsOpen(false);
                  }}
                  className={`block p-4 hover:bg-gray-50 transition-colors ${
                    match.is_new ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {match.matched_profile.display_name}
                        </span>
                        {match.is_new && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {match.match_count} matching card{match.match_count !== 1 ? 's' : ''}
                      </p>
                      {match.matched_profile.trading_locations && (
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {match.matched_profile.trading_locations}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
