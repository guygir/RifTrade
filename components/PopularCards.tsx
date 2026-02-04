'use client';

import { useEffect, useState } from 'react';

interface Card {
  id: string;
  card_id: string;
  usage_count: number;
  usage_percentage: number;
  weighted_score?: number;
  weighted_percentage?: number;
  tier_distribution: Record<string, number>;
  champions_by_tier?: Record<string, string[]>;
  have_count?: number;
  want_count?: number;
  cards: {
    id: string;
    name: string;
    rarity: string;
    set_code: string;
    collector_number: string;
    image_url: string;
    metadata?: any;
  };
}

interface PopularCardsProps {
  limit?: number;
  showFilters?: boolean;
}

export default function PopularCards({ limit = 12, showFilters = false }: PopularCardsProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minUsage, setMinUsage] = useState<number>(0);
  const [cacheAge, setCacheAge] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchCards();
  }, [minUsage, limit]);

  async function fetchCards() {
    try {
      setLoading(true);
      setError(null);

      // Request more cards than needed since we filter out runes
      const params = new URLSearchParams({
        limit: (limit * 2).toString(), // Request double to account for rune filtering
        offset: '0',
      });

      if (minUsage > 0) {
        params.append('minUsage', minUsage.toString());
      }

      const response = await fetch(`/api/meta/cards?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cards');
      }

      // Filter out runes (cards with "Rune" in the name or rarity) and limit to requested amount
      const filteredCards = (data.data || [])
        .filter((card: Card) => {
          const isRune = card.cards.name.toLowerCase().includes('rune') ||
                        card.cards.rarity.toLowerCase().includes('rune');
          return !isRune;
        })
        .slice(0, limit); // Limit to requested number after filtering

      setCards(filteredCards);
      setCacheAge(data.cache?.age_formatted || '');
    } catch (err) {
      console.error('Error fetching popular cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'champion': return 'text-yellow-600 dark:text-yellow-400';
      case 'rare': return 'text-blue-600 dark:text-blue-400';
      case 'uncommon': return 'text-green-600 dark:text-green-400';
      case 'common': return 'text-gray-600 dark:text-gray-400';
      case 'showcase': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTierLabel = (tier: string) => {
    // Convert numeric tiers to letters
    if (tier === '1') return 'A';
    if (tier === '2') return 'B';
    if (tier === '3') return 'C';
    if (tier === '4') return 'D';
    return tier; // S stays S
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Popular Cards</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 animate-pulse">
              <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Popular Cards</h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            <strong>Error:</strong> {error}
          </p>
          <button
            onClick={fetchCards}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Popular Cards</h2>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No popular cards available yet. Check back soon!
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
          <h2 className="text-2xl font-bold">Popular Cards</h2>
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

      {/* Expandable Content */}
      {isExpanded && (
        <>
          {showFilters && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Min Usage:</label>
              <select
                value={minUsage}
                onChange={(e) => setMinUsage(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="0">All Cards</option>
                <option value="10">10%+</option>
                <option value="20">20%+</option>
                <option value="30">30%+</option>
                <option value="50">50%+</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {cards.map((card) => {
              // Check if card is a battlefield card from metadata
              const cardType = card.cards.metadata?.classification?.type;
              const isBattlefield = cardType === 'Battlefield';
              
              return (
                <div
                  key={card.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Card Image - Same container for all cards */}
                  <div className="relative aspect-[2/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <img
                      src={card.cards.image_url}
                      alt={card.cards.name}
                      className="w-full h-full object-contain"
                      style={
                        isBattlefield
                          ? {
                              transform: 'rotate(90deg) scale(1.397)',
                              transformOrigin: 'center center',
                            }
                          : undefined
                      }
                      loading="lazy"
                    />
                    {/* Usage Badge - Shows both raw and weighted percentages */}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white rounded text-xs font-bold">
                    <div className="flex flex-col items-end">
                      <div title="Raw usage percentage">{card.usage_percentage.toFixed(1)}%</div>
                      {card.weighted_percentage !== undefined && (
                        <div className="text-yellow-300 text-[10px]" title="Tier-weighted percentage">
                          ⚡{card.weighted_percentage.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {card.cards.name}
                  </h3>

                  {/* Rarity */}
                  <p className={`text-xs font-medium mb-1 ${getRarityColor(card.cards.rarity)}`}>
                    {card.cards.rarity}
                  </p>

                  {/* Selling/Buying Counts - Always show, vertical layout */}
                  <div className="mt-2 flex flex-col gap-1 text-xs font-medium">
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <span className="font-bold">Selling:</span>
                      <span className="bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">{card.have_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <span className="font-bold">Buying:</span>
                      <span className="bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{card.want_count || 0}</span>
                    </div>
                  </div>

                  {/* Set Info */}
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {card.cards.set_code} #{card.cards.collector_number}
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {/* Explanation Text */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">
              <strong>Usage Percentage:</strong> Shows how often this card appears across all analyzed decks (raw percentage).
            </p>
            <p>
              <strong>⚡ Weighted Percentage:</strong> Tier-weighted importance score. Higher-tier decks (S, A) contribute more weight than lower tiers (B, C, D).
              This helps identify cards that are popular in competitive, high-tier decks versus cards that are only common in lower-tier decks.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// Made with Bob
