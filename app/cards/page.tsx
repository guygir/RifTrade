'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/lib/supabase/types';
import { createSupabaseClient } from '@/lib/supabase/client';
import { getCardDisplayName } from '@/lib/card-display';
import PopularCards from '@/components/PopularCards';
import { useTradingPermission } from '@/lib/hooks/useTradingPermission';

export default function CardsPage() {
  const router = useRouter();
  const { isLoading: permissionLoading, isTradingEnabled } = useTradingPermission();
  const [cards, setCards] = useState<Card[]>([]);
  const [userHaveCards, setUserHaveCards] = useState<Set<string>>(new Set());
  const [userWantCards, setUserWantCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set(['OGN'])); // Default: only OGN
  const [showOwned, setShowOwned] = useState(true);
  const [showUnowned, setShowUnowned] = useState(true);

  useEffect(() => {
    // Redirect if trading is not enabled
    if (!permissionLoading && !isTradingEnabled) {
      router.push('/riftle');
    }
  }, [permissionLoading, isTradingEnabled, router]);

  useEffect(() => {
    if (isTradingEnabled) {
      loadCards();
      loadUserCards();
    }
  }, [isTradingEnabled]);

  const loadCards = async () => {
    try {
      setError(null);
      console.log('[CardsPage] Starting to load cards...');
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('set_code', { ascending: true })
        .order('sort_key', { ascending: true, nullsFirst: false })
        .order('collector_number');

      if (error) {
        // Don't show AbortError to users - it's a development-only issue
        if (error.message?.includes('AbortError') || error.name === 'AbortError') {
          console.log('[CardsPage] Request aborted (normal in development)');
          setLoading(false);
          return;
        }
        console.error('[CardsPage] Supabase error:', error);
        throw error;
      }
      
      console.log('[CardsPage] Loaded cards:', data?.length || 0);
      setCards(data || []);
      setLoading(false);
    } catch (err: any) {
      // Don't show AbortError to users
      if (err?.name === 'AbortError' || err?.message?.includes('AbortError')) {
        console.log('[CardsPage] Request aborted (normal in development)');
        setLoading(false);
        return;
      }
      console.error('[CardsPage] Error loading cards:', err);
      setError(err?.message || 'Failed to load cards. Please refresh the page.');
      setLoading(false);
    }
  };

  const loadUserCards = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profileData) return;

      const [haveResult, wantResult] = await Promise.all([
        supabase
          .from('profile_have_cards')
          .select('card_id')
          .eq('profile_id', profileData.id),
        supabase
          .from('profile_want_cards')
          .select('card_id')
          .eq('profile_id', profileData.id)
      ]);

      if (haveResult.data) {
        setUserHaveCards(new Set(haveResult.data.map(item => item.card_id).filter(Boolean)));
      }
      if (wantResult.data) {
        setUserWantCards(new Set(wantResult.data.map(item => item.card_id).filter(Boolean)));
      }
    } catch (err: any) {
      // Log but don't block - user cards are optional
      if (err?.name !== 'AbortError' && !err?.message?.includes('AbortError')) {
        console.error('Error loading user cards:', err);
      }
    }
  };

  const sets = Array.from(new Set(cards.map(c => c.set_code))).sort();
  
  const filteredCards = cards.filter(card => {
    // Search by name, collector number, or public_code
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      card.name.toLowerCase().includes(searchLower) ||
      card.collector_number.toLowerCase().includes(searchLower) ||
      (card.public_code && card.public_code.toLowerCase().includes(searchLower)) ||
      getCardDisplayName(card).toLowerCase().includes(searchLower);
    
    // Filter by selected sets
    const matchesSet = selectedSets.size === 0 || selectedSets.has(card.set_code);
    
    // Filter by owned/unowned
    const isOwned = userHaveCards.has(card.id) || userWantCards.has(card.id);
    const matchesOwnership = 
      (showOwned && isOwned) || 
      (showUnowned && !isOwned);
    
    return matchesSearch && matchesSet && matchesOwnership;
  });

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center">Loading cards...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Cards</h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                loadCards();
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Popular Cards Section */}
        <div className="mb-12">
          <PopularCards limit={12} showFilters={false} />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-12"></div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Card Browser</h1>
          
          <div className="flex flex-col gap-4 mb-4">
            <input
              type="text"
              placeholder="Search cards by name or number (e.g., '001' or 'Blazing Scorcher')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            
            <div className="flex flex-wrap gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Sets:</label>
                <div className="flex flex-wrap gap-2">
                  {sets.map(set => (
                    <label key={set} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSets.has(set)}
                        onChange={(e) => {
                          const newSets = new Set(selectedSets);
                          if (e.target.checked) {
                            newSets.add(set);
                          } else {
                            newSets.delete(set);
                          }
                          setSelectedSets(newSets);
                        }}
                        className="cursor-pointer"
                      />
                      <span className="text-sm">{set}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ownership:</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOwned}
                      onChange={(e) => setShowOwned(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">Owned</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showUnowned}
                      onChange={(e) => setShowUnowned(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">Unowned</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredCards.length} of {cards.length} cards
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-900 transition-shadow bg-white dark:bg-gray-800"
            >
              {card.image_url && (() => {
                const cardType = card.metadata?.classification?.type || card.metadata?.type;
                const isBattlefield = cardType === 'Battlefield';
                return (
                  <div className="relative w-full aspect-[63/88] mb-2 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                    <Image
                      src={card.image_url}
                      alt={card.name}
                      fill
                      className="rounded object-contain"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      style={isBattlefield ? { 
                        transform: 'rotate(90deg) scale(1.397)',
                        transformOrigin: 'center center'
                      } : undefined}
                    />
                  </div>
                );
              })()}
              <h3 className="font-semibold text-sm mb-1 dark:text-white">{getCardDisplayName(card)}</h3>
              {card.rarity && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.rarity}</p>
              )}
            </div>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No cards found. Try adjusting your search or filter.
          </div>
        )}
      </div>
    </main>
  );
}

