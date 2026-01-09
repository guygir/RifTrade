/**
 * Card Display Utilities
 * 
 * Functions for formatting and displaying cards consistently
 */

import { Card } from '@/lib/supabase/types';
import { formatCardPrefix } from './riftcodex';

/**
 * Get display name for a card
 * Format: "OGN #066a - Card Name"
 */
export function getCardDisplayName(card: Card): string {
  const prefix = formatCardPrefix(card.public_code || null);
  if (prefix) {
    return `${prefix} - ${card.name}`;
  }
  // Fallback if no public_code
  if (card.set_code && card.collector_number) {
    return `${card.set_code} #${card.collector_number} - ${card.name}`;
  }
  return card.name;
}

/**
 * Get short display name (just the prefix part)
 * Format: "OGN #066a"
 */
export function getCardPrefix(card: Card): string {
  const prefix = formatCardPrefix(card.public_code || null);
  if (prefix) return prefix;
  if (card.set_code && card.collector_number) {
    return `${card.set_code} #${card.collector_number}`;
  }
  return '';
}

