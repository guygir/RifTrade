'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Card, Profile } from '@/lib/supabase/types';
import { getCardDisplayName } from '@/lib/card-display';
import { calculateMatches } from '@/lib/match-calculator';
import { detectAndStoreMatches } from '@/lib/match-storage';
import { validateUsernameFromUrl } from '@/lib/validate-username';
import { sanitizeText, sanitizeContactInfo } from '@/lib/sanitize';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = params?.username as string;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [haveCards, setHaveCards] = useState<Array<Card & { quantity: number }>>([]);
  const [wantCards, setWantCards] = useState<Array<Card & { quantity: number }>>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [matchedCards, setMatchedCards] = useState<Array<{ card: Card; haveQuantity: number; wantQuantity: number }>>([]);
  const [matchScore, setMatchScore] = useState(0);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);

  useEffect(() => {
    // Validate username from URL parameter
    const validation = validateUsernameFromUrl(rawUsername);
    if (!validation.valid) {
      console.error('[UserProfilePage] Invalid username:', validation.error);
      setNotFound(true);
      setLoading(false);
      return;
    }

    if (validation.sanitized) {
      loadProfile(validation.sanitized);
    }
  }, [rawUsername]);

  // Redirect to profile editor if viewing own profile
  useEffect(() => {
    if (isOwnProfile && !loading) {
      router.push('/profile');
    }
  }, [isOwnProfile, loading, router]);

  const loadProfile = async (username: string) => {
    if (!username) return;
    
    setLoading(true);
    setNotFound(false);
    const supabase = createSupabaseClient();
    
    try {
      // Fetch profile by username (case-insensitive)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .single();

      if (profileError || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Check if this is the current user's profile
      const { data: { user } } = await supabase.auth.getUser();
      const ownProfile = user?.id === profileData.user_id;
      setIsOwnProfile(ownProfile);

      // Get current user's profile ID for match calculation (only if not own profile)
      if (user && !ownProfile) {
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (currentUserProfile) {
          setCurrentUserProfileId(currentUserProfile.id);
          
          // Recalculate and store matches for current user (picks up changes from other users)
          // Do this in background to avoid blocking profile display
          detectAndStoreMatches(currentUserProfile.id).catch(err => {
            console.error('Error recalculating matches:', err);
          });
          
          // Calculate and display matches between current user and this profile
          await calculateAndDisplayMatches(currentUserProfile.id, profileData.id);
        }
      } else {
        // Reset match data if viewing own profile
        setMatchScore(0);
        setMatchedCards([]);
      }

      // Load have cards
      const { data: haveData } = await supabase
        .from('profile_have_cards')
        .select('quantity, cards(*)')
        .eq('profile_id', profileData.id);

      if (haveData) {
        const cardsWithQuantity = haveData
          .map((item: any) => ({
            ...item.cards,
            quantity: item.quantity || 1,
          }))
          .filter((item: any) => item.id)
          .sort((a: any, b: any) => {
            if (a.set_code !== b.set_code) {
              return (a.set_code || '').localeCompare(b.set_code || '');
            }
            if (!a.sort_key && !b.sort_key) return 0;
            if (!a.sort_key) return 1;
            if (!b.sort_key) return -1;
            return a.sort_key.localeCompare(b.sort_key, undefined, { numeric: true, sensitivity: 'base' });
          });
        setHaveCards(cardsWithQuantity);
      }

      // Load want cards
      const { data: wantData } = await supabase
        .from('profile_want_cards')
        .select('quantity, cards(*)')
        .eq('profile_id', profileData.id);

      if (wantData) {
        const cardsWithQuantity = wantData
          .map((item: any) => ({
            ...item.cards,
            quantity: item.quantity || 1,
          }))
          .filter((item: any) => item.id)
          .sort((a: any, b: any) => {
            if (a.set_code !== b.set_code) {
              return (a.set_code || '').localeCompare(b.set_code || '');
            }
            if (!a.sort_key && !b.sort_key) return 0;
            if (!a.sort_key) return 1;
            if (!b.sort_key) return -1;
            return a.sort_key.localeCompare(b.sort_key, undefined, { numeric: true, sensitivity: 'base' });
          });
        setWantCards(cardsWithQuantity);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const calculateAndDisplayMatches = async (currentUserId: string, viewedProfileId: string) => {
    try {
      // Get current user's matches
      const matches = await calculateMatches(currentUserId);
      
      // Find the match with the viewed profile
      const match = matches.find(m => m.matchedProfileId === viewedProfileId);
      
      if (match) {
        setMatchScore(match.matchCount);
        setMatchedCards(match.matchedCards);
      } else {
        setMatchScore(0);
        setMatchedCards([]);
      }
    } catch (err) {
      console.error('Error calculating matches:', err);
      setMatchScore(0);
      setMatchedCards([]);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your profile data, cards, and matches.')) {
      return;
    }

    setDeleting(true);
    const supabase = createSupabaseClient();
    
    try {
      // Delete user from auth (this will cascade delete profile and related data)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Note: Supabase doesn't allow deleting auth.users directly from client
        // We need to delete the profile, which will cascade delete related data
        // Then sign out the user
        // For full account deletion, you'd need a server-side function or admin API
        
        // Delete profile (cascade will handle related data)
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile!.id);

        if (error) throw error;

        // Sign out
        await supabase.auth.signOut();
        
        // Redirect to home
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      alert('Error deleting account: ' + err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The user profile you're looking for doesn't exist.</p>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  // Show loading message while redirecting to profile editor
  if (isOwnProfile && !loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <p>Redirecting to profile editor...</p>
        </div>
      </main>
    );
  }

  // Read-only view for other users
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">{sanitizeText(profile.display_name)}'s Profile</h1>
          <Link href="/" className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
            Home
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          
          <div className="space-y-3">
            <div>
              <strong className="text-sm text-gray-600 dark:text-gray-400">Contact:</strong>
              <p className="mt-1" dangerouslySetInnerHTML={{ __html: sanitizeContactInfo(profile.contact_info) }} />
            </div>
            
            {profile.trading_locations && (
              <div>
                <strong className="text-sm text-gray-600 dark:text-gray-400">Trading Locations:</strong>
                <p className="mt-1">{sanitizeText(profile.trading_locations)}</p>
              </div>
            )}
          </div>
        </div>

        {!isOwnProfile && matchScore > 0 && matchedCards.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Matches: {matchScore} matching card{matchScore !== 1 ? 's' : ''}
            </h2>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
              <ul className="text-sm text-blue-800 dark:text-blue-300 list-disc list-inside space-y-1">
                {matchedCards.map((match, idx) => {
                  // Determine match direction based on which cards are involved
                  // If the card is in their have list, you want it and they have it
                  // If the card is in their want list, you have it and they want it
                  const isInTheirHave = haveCards.some(c => c.id === match.card.id);
                  const isInTheirWant = wantCards.some(c => c.id === match.card.id);
                  
                  let matchText = '';
                  if (isInTheirHave) {
                    // They have it, you want it
                    matchText = `You want ${match.wantQuantity}, They have ${match.haveQuantity}`;
                  } else if (isInTheirWant) {
                    // They want it, you have it
                    matchText = `You have ${match.haveQuantity}, They want ${match.wantQuantity}`;
                  } else {
                    // Fallback (shouldn't happen)
                    matchText = `You want ${match.wantQuantity}, They have ${match.haveQuantity}`;
                  }
                  
                  return (
                    <li key={idx}>
                      {getCardDisplayName(match.card)} - {matchText}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cards I Have ({haveCards.length})</h2>
          {haveCards.length > 0 ? (
            <CardImageGrid cards={haveCards} />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No cards listed.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Cards I Want ({wantCards.length})</h2>
          {wantCards.length > 0 ? (
            <CardImageGrid cards={wantCards} />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No cards listed.</p>
          )}
        </div>
      </div>
    </main>
  );
}

function CardImageGrid({ cards }: { cards: Array<Card & { quantity: number }> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <CardImage key={card.id} card={card} />
      ))}
    </div>
  );
}

function CardImage({ card }: { card: Card & { quantity: number } }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg dark:hover:shadow-gray-900 transition-shadow group bg-white dark:bg-gray-800">
      {card.image_url && !imageError ? (
        <>
          {imageLoading && (
            <div className="w-full aspect-[63/88] bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
              <div className="text-xs text-gray-400 dark:text-gray-500">Loading...</div>
            </div>
          )}
          <img
            src={card.image_url}
            alt={card.name}
            className={`w-full aspect-[63/88] object-cover ${imageLoading ? 'hidden' : ''}`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            loading="lazy"
          />
        </>
      ) : (
        <div className="w-full aspect-[63/88] bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 p-2 text-center">
          {card.name}
        </div>
      )}
      {card.quantity > 1 && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {card.quantity}
        </div>
      )}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <p className="text-white text-sm font-medium text-center px-2">
          {getCardDisplayName(card)}
        </p>
      </div>
    </div>
  );
}
