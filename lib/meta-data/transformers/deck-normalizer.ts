// Deck normalizer - converts raw deck data from different sources into a standardized format

import { RawDeck, NormalizedDeck, TierRank, Archetype } from '../types';

/**
 * Normalizes a raw deck from any source into the standard format
 */
export function normalizeDeck(raw: RawDeck, source: string): NormalizedDeck {
  return {
    deck_name: normalizeDeckName(raw.name),
    deck_code: raw.deckCode || null,
    champions: normalizeChampions(raw.champions),
    archetype: normalizeArchetype(raw.archetype),
    tier_rank: normalizeTier(raw.tier),
    popularity_score: calculatePopularityScore(raw, source),
    view_count: raw.viewCount || null,
    win_rate: null, // Will be populated if available
    price_usd: raw.priceUsd || null,
    source_url: raw.sourceUrl || null,
    author: raw.author || null,
    last_updated: raw.lastUpdated || null,
    metadata: {
      source,
      ...raw.metadata,
    },
  };
}

/**
 * Normalizes deck name - removes extra whitespace, standardizes format
 */
function normalizeDeckName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s\-\/\+]/g, '') // Remove special characters except - / +
    .substring(0, 100); // Limit length
}

/**
 * Normalizes champion names - removes duplicates, standardizes casing
 */
function normalizeChampions(champions: string[]): string[] {
  const normalized = champions
    .map(c => c.trim())
    .filter(c => c.length > 0 && c !== 'Unknown')
    .map(c => {
      // Capitalize first letter of each word
      return c.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    });

  // Remove duplicates
  return Array.from(new Set(normalized));
}

/**
 * Normalizes archetype to standard values
 */
function normalizeArchetype(archetype?: string): string | null {
  if (!archetype) return null;

  const normalized = archetype.toLowerCase().trim();

  // Map common variations to standard archetypes
  const archetypeMap: Record<string, Archetype> = {
    'aggro': 'Aggro',
    'aggressive': 'Aggro',
    'rush': 'Aggro',
    'control': 'Control',
    'combo': 'Combo',
    'midrange': 'Midrange',
    'mid-range': 'Midrange',
    'mid': 'Midrange',
    'tempo': 'Midrange',
  };

  return archetypeMap[normalized] || 'Other';
}

/**
 * Normalizes tier ranking to standard format
 */
function normalizeTier(tier?: string): string | null {
  if (!tier) return null;

  const normalized = tier.toUpperCase().trim();

  // Map variations to standard tiers
  const tierMap: Record<string, TierRank> = {
    'S': 'S',
    'TIER S': 'S',
    'S-TIER': 'S',
    'S TIER': 'S',
    '1': '1',
    'TIER 1': '1',
    'T1': '1',
    'TIER-1': '1',
    '2': '2',
    'TIER 2': '2',
    'T2': '2',
    'TIER-2': '2',
    '3': '3',
    'TIER 3': '3',
    'T3': '3',
    'TIER-3': '3',
    '4': '4',
    'TIER 4': '4',
    'T4': '4',
    'TIER-4': '4',
  };

  return tierMap[normalized] || null;
}

/**
 * Calculates a popularity score (0-100) based on available metrics
 * Higher score = more popular
 */
function calculatePopularityScore(raw: RawDeck, source: string): number {
  let score = 0;

  // Base score from tier (if available)
  if (raw.tier) {
    const tierScores: Record<string, number> = {
      'S': 100,
      '1': 75,
      '2': 50,
      '3': 25,
    };
    const normalizedTier = normalizeTier(raw.tier);
    score += tierScores[normalizedTier || ''] || 0;
  } else {
    // If no tier, start with base score
    score = 50;
  }

  // Adjust based on view count (if available)
  if (raw.viewCount) {
    // Logarithmic scale for views
    // 1k views = +5, 10k = +10, 100k = +15, etc.
    const viewBonus = Math.min(20, Math.log10(raw.viewCount) * 5);
    score += viewBonus;
  }

  // Adjust based on recency (if available)
  if (raw.lastUpdated) {
    const daysOld = (Date.now() - raw.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysOld < 7) {
      score += 10; // Very recent
    } else if (daysOld < 30) {
      score += 5; // Recent
    } else if (daysOld > 90) {
      score -= 10; // Old data
    }
  }

  // Source-specific adjustments
  if (source === 'riftbound_tierlist') {
    score += 5; // Official tier list gets bonus
  }

  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Normalizes multiple decks from a source
 */
export function normalizeDecks(rawDecks: RawDeck[], source: string): NormalizedDeck[] {
  return rawDecks
    .map(raw => normalizeDeck(raw, source))
    .filter(deck => {
      // Filter out invalid decks
      if (!deck.deck_name || deck.deck_name.length < 3) return false;
      if (deck.champions.length === 0) return false;
      return true;
    });
}

/**
 * Merges duplicate decks (same name and champions) by keeping the one with higher popularity
 */
export function mergeDuplicateDecks(decks: NormalizedDeck[]): NormalizedDeck[] {
  const deckMap = new Map<string, NormalizedDeck>();

  for (const deck of decks) {
    // Create a unique key based on deck name and champions
    const key = `${deck.deck_name.toLowerCase()}_${deck.champions.sort().join('_').toLowerCase()}`;

    const existing = deckMap.get(key);
    
    if (!existing) {
      deckMap.set(key, deck);
    } else {
      // Keep the deck with higher popularity score
      if (deck.popularity_score > existing.popularity_score) {
        // Merge metadata from both
        deckMap.set(key, {
          ...deck,
          metadata: {
            ...existing.metadata,
            ...deck.metadata,
            sources: [
              ...(Array.isArray(existing.metadata.sources) ? existing.metadata.sources : [existing.metadata.source]),
              deck.metadata.source,
            ],
          },
        });
      }
    }
  }

  return Array.from(deckMap.values());
}

/**
 * Sorts decks by popularity score (descending)
 */
export function sortDecksByPopularity(decks: NormalizedDeck[]): NormalizedDeck[] {
  return [...decks].sort((a, b) => b.popularity_score - a.popularity_score);
}

/**
 * Filters decks by tier
 */
export function filterDecksByTier(decks: NormalizedDeck[], tier: TierRank): NormalizedDeck[] {
  return decks.filter(deck => deck.tier_rank === tier);
}

/**
 * Filters decks by archetype
 */
export function filterDecksByArchetype(decks: NormalizedDeck[], archetype: Archetype): NormalizedDeck[] {
  return decks.filter(deck => deck.archetype === archetype);
}

// Made with Bob
