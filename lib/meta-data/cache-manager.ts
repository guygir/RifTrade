// Cache manager - handles caching logic for meta data

import { createClient } from '@supabase/supabase-js';

/**
 * Checks if cached meta data is still valid
 */
export async function isCacheValid(
  supabaseUrl: string,
  supabaseKey: string,
  maxAgeHours: number = 24
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the latest snapshot
  const { data: snapshot, error } = await supabase
    .from('meta_snapshots')
    .select('snapshot_date')
    .eq('source', 'combined')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  if (error || !snapshot) {
    console.log('[CacheManager] No snapshot found, cache invalid');
    return false;
  }

  // Calculate age in hours
  const snapshotDate = new Date(snapshot.snapshot_date);
  const ageHours = (Date.now() - snapshotDate.getTime()) / (1000 * 60 * 60);

  const isValid = ageHours < maxAgeHours;
  
  console.log(`[CacheManager] Cache age: ${ageHours.toFixed(2)} hours, valid: ${isValid}`);
  
  return isValid;
}

/**
 * Gets cache age in hours
 */
export async function getCacheAge(
  supabaseUrl: string,
  supabaseKey: string
): Promise<number | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: snapshot, error } = await supabase
    .from('meta_snapshots')
    .select('snapshot_date')
    .eq('source', 'combined')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  if (error || !snapshot) {
    return null;
  }

  const snapshotDate = new Date(snapshot.snapshot_date);
  const ageHours = (Date.now() - snapshotDate.getTime()) / (1000 * 60 * 60);

  return ageHours;
}

/**
 * Gets the last update timestamp
 */
export async function getLastUpdateTime(
  supabaseUrl: string,
  supabaseKey: string
): Promise<Date | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: snapshot, error } = await supabase
    .from('meta_snapshots')
    .select('snapshot_date')
    .eq('source', 'combined')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  if (error || !snapshot) {
    return null;
  }

  return new Date(snapshot.snapshot_date);
}

/**
 * Formats cache age for display
 */
export function formatCacheAge(ageHours: number): string {
  if (ageHours < 1) {
    const minutes = Math.floor(ageHours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (ageHours < 24) {
    const hours = Math.floor(ageHours);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(ageHours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  DEFAULT_MAX_AGE_HOURS: 24,
  STALE_WARNING_HOURS: 25,
  CRITICAL_STALE_HOURS: 48,
};

// Made with Bob
