'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Deck {
  id: string;
  deck_name: string;
  champions: string[];
  tier_rank: string;
  popularity_score: number;
  view_count: number | null;
  source_url: string;
  metadata: {
    imageUrl?: string;
    source?: string;
    displayName?: string;
  };
}

interface DecksByTier {
  [tier: string]: Deck[];
}

export default function PopularDecksByTier() {
  const [decksByTier, setDecksByTier] = useState<DecksByTier>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheAge, setCacheAge] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchDecks();
  }, []);

  async function fetchDecks() {
    try {
      setLoading(true);
      setError(null);

      // Fetch all decks (no limit)
      const response = await fetch('/api/meta/decks?limit=100');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch decks');
      }

      // Group decks by tier
      const grouped: DecksByTier = {};
      const tiers = ['S', '1', '2', '3', '4'];
      
      tiers.forEach(tier => {
        grouped[tier] = (data.data || []).filter((deck: Deck) => deck.tier_rank === tier);
      });

      setDecksByTier(grouped);
      setCacheAge(data.cache?.age_formatted || '');
    } catch (err) {
      console.error('Error fetching popular decks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load decks');
    } finally {
      setLoading(false);
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S': return 'bg-red-500 text-white';
      case '1': return 'bg-orange-500 text-white';
      case '2': return 'bg-yellow-500 text-white';
      case '3': return 'bg-green-500 text-white';
      case '4': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Popular Decks by Tier</h2>
        </div>
        <div className="space-y-6">
          {['S', '1', '2'].map((tier) => (
            <div key={tier} className="animate-pulse">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-40 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Popular Decks by Tier</h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            <strong>Error:</strong> {error}
          </p>
          <button
            onClick={fetchDecks}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const tiers = ['S', '1', '2', '3', '4']; // Show all tiers (S, A, B, C, D)
  const hasAnyDecks = tiers.some(tier => decksByTier[tier]?.length > 0);

  const getTierLabel = (tier: string) => {
    // Convert numeric tiers to letters for display
    if (tier === '1') return 'A';
    if (tier === '2') return 'B';
    if (tier === '3') return 'C';
    if (tier === '4') return 'D';
    return tier; // S stays S
  };

  if (!hasAnyDecks) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Popular Decks by Tier</h2>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No popular decks available yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Popular Decks by Tier</h2>
          {cacheAge && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Updated {cacheAge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isExpanded ? 'Click to minimize' : 'Click to expand'}
          </span>
          <svg
            className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Tier Rows - Collapsible */}
      {isExpanded && (
        <div className="space-y-6">
        {tiers.map((tier) => {
          const decks = decksByTier[tier] || [];
          if (decks.length === 0) return null;

          return (
            <div key={tier}>
              {/* Tier Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`px-4 py-2 rounded-lg text-lg font-bold ${getTierColor(tier)}`}>
                  Tier {getTierLabel(tier)}
                </div>
              </div>

              {/* Horizontal Scrollable Deck List */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {decks.map((deck) => {
                  // Use displayName from metadata if available (includes emojis), otherwise fall back to deck_name
                  const displayName = deck.metadata?.displayName || deck.deck_name;
                  
                  // Extract trend indicator and clean name
                  const hasTrendUp = displayName.includes('🔼');
                  const hasTrendDown = displayName.includes('🔽');
                  const cleanName = displayName.replace(/[🔼🔽]/g, '').trim();
                  
                  return (
                    <a
                      key={deck.id}
                      href={deck.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-40 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group bg-white dark:bg-gray-800"
                    >
                      {/* Compact Deck Image */}
                      <div className="relative h-32 bg-gray-100 dark:bg-gray-800">
                        {deck.metadata.imageUrl ? (
                          <img
                            src={deck.metadata.imageUrl}
                            alt={displayName}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Compact Deck Info */}
                      <div className="p-2">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {cleanName}
                        </h3>

                        {/* Champions - compact */}
                        {deck.champions && deck.champions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {deck.champions.slice(0, 2).map((champion, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                              >
                                {champion}
                              </span>
                            ))}
                            {deck.champions.length > 2 && (
                              <span className="px-1.5 py-0.5 text-xs text-gray-500">
                                +{deck.champions.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Trend Indicators - Below champion tags */}
                        {(hasTrendUp || hasTrendDown) && (
                          <div className="mt-1">
                            {hasTrendUp && (
                              <span className="inline-block px-1.5 py-0.5 text-xs font-bold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                                INCREASED!
                              </span>
                            )}
                            {hasTrendDown && (
                              <span className="inline-block px-1.5 py-0.5 text-xs font-bold bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                                DECREASED!
                              </span>
                            )}
                          </div>
                        )}

                        {/* Compact Stats */}
                        {deck.view_count && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <span title="Views">👁 {deck.view_count > 1000 ? `${(deck.view_count / 1000).toFixed(1)}k` : deck.view_count}</span>
                          </div>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}

// Made with Bob
