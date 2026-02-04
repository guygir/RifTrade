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
  };
}

interface PopularDecksProps {
  limit?: number;
  showFilters?: boolean;
}

export default function PopularDecks({ limit = 6, showFilters = false }: PopularDecksProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [cacheAge, setCacheAge] = useState<string>('');

  useEffect(() => {
    fetchDecks();
  }, [selectedTier, limit]);

  async function fetchDecks() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: '0',
      });

      if (selectedTier !== 'all') {
        params.append('tier', selectedTier);
      }

      const response = await fetch(`/api/meta/decks?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch decks');
      }

      setDecks(data.data || []);
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Popular Decks</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Popular Decks</h2>
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

  if (decks.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Popular Decks</h2>
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Popular Decks</h2>
          {cacheAge && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Updated {cacheAge}
            </p>
          )}
        </div>

        {showFilters && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Tier:</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">All Tiers</option>
              <option value="S">S Tier</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
              <option value="4">Tier 4</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((deck) => (
          <a
            key={deck.id}
            href={deck.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
          >
            {/* Deck Image */}
            <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
              {deck.metadata.imageUrl ? (
                <img
                  src={deck.metadata.imageUrl}
                  alt={deck.deck_name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    // Hide image on error
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {/* Tier Badge */}
              <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-bold ${getTierColor(deck.tier_rank)}`}>
                {deck.tier_rank}
              </div>
            </div>

            {/* Deck Info */}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {deck.deck_name}
              </h3>

              {/* Champions */}
              {deck.champions && deck.champions.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {deck.champions.map((champion, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                    >
                      {champion}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Score:</span>
                  <span>{deck.popularity_score}</span>
                </div>
                {deck.view_count && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{deck.view_count.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Source */}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Source: {deck.metadata.source === 'riftbound_tierlist' ? 'Riftbound' : 'RiftMana'}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* View All Link */}
      {decks.length >= limit && (
        <div className="text-center pt-4">
          <Link
            href="/meta/decks"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            View All Decks
          </Link>
        </div>
      )}
    </div>
  );
}

// Made with Bob
