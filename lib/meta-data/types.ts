// Shared types for meta data fetching and processing

export interface RawDeck {
  name: string;
  champions: string[];
  archetype?: string;
  tier?: string;
  viewCount?: number;
  priceUsd?: number;
  sourceUrl?: string;
  author?: string;
  lastUpdated?: Date;
  deckCode?: string;
  metadata?: Record<string, any>;
}

export interface NormalizedDeck {
  deck_name: string;
  deck_code: string | null;
  champions: string[];
  archetype: string | null;
  tier_rank: string | null;
  popularity_score: number;
  view_count: number | null;
  win_rate: number | null;
  price_usd: number | null;
  source_url: string | null;
  author: string | null;
  last_updated: Date | null;
  metadata: Record<string, any>;
}

export interface CardUsage {
  cardName: string;
  cardId?: string;
  copies: number;
  deckTier: string;
  deckArchetype: string;
  championName?: string; // Champion this card appears with
}

export interface AggregatedCardUsage {
  card_id: string;
  usage_count: number;
  usage_percentage: number;
  avg_copies: number;
  tier_distribution: Record<string, number>;
  deck_archetypes: Record<string, number>;
}

export interface MetaSnapshot {
  id: string;
  source: string;
  snapshot_date: Date;
  data_hash: string | null;
}

export interface FetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
}

export type TierRank = 'S' | '1' | '2' | '3' | '4';
export type Archetype = 'Aggro' | 'Control' | 'Combo' | 'Midrange' | 'Other';

// Made with Bob
