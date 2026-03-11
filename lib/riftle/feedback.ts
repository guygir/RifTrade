/**
 * Riftle Feedback Logic
 * 
 * Handles attribute comparison and feedback generation for card guesses
 */

export type CategoricalFeedback = "correct" | "wrong" | "partial";
export type NumericFeedback = "exact" | "high" | "low";

export interface CardAttributes {
  name: string;
  rarity: string | null;
  collector_number: string;
  // Extracted from metadata - using original API names
  type: string | null;
  faction: string | null;
  energy: number; // Treat null as 0
  might: number;  // Treat null as 0
  power: number;  // Treat null as 0
}

export interface AttributeFeedback {
  type: CategoricalFeedback;
  faction: CategoricalFeedback;
  rarity: CategoricalFeedback;
  energy: NumericFeedback;
  might: NumericFeedback;
  power: NumericFeedback;
}

/**
 * Extract card attributes from card data
 * Based on actual Riftcodex API structure
 */
export function extractCardAttributes(card: any): CardAttributes {
  const metadata = card.metadata || {};
  const classification = metadata.classification || {};
  const attributes = metadata.attributes || {};
  
  // Normalize rarity: Showcase -> Alternate Art
  let rarity = card.rarity || classification.rarity || null;
  if (rarity === 'Showcase' || rarity === 'showcase') {
    rarity = 'Alternate Art';
  }
  
  // Extract type from classification.type
  // For Champion cards: if type is "Unit" and supertype is "Champion", display as "Champion Unit"
  let type = classification.type || null;
  if (type === 'Unit' && classification.supertype === 'Champion') {
    type = 'Champion Unit';
  }
  
  // Extract faction from classification.domain (it's an array)
  // Store as comma-separated string for multi-domain cards
  let faction: string | null = null;
  if (classification.domain && Array.isArray(classification.domain) && classification.domain.length > 0) {
    faction = classification.domain.sort().join(', '); // Sort for consistent comparison
  }
  
  // Extract energy - treat null as 0
  let energy = 0;
  if (attributes.energy !== undefined && attributes.energy !== null) {
    energy = typeof attributes.energy === 'number' ? attributes.energy : parseInt(String(attributes.energy));
  }
  
  // Extract might - treat null as 0
  let might = 0;
  if (attributes.might !== undefined && attributes.might !== null) {
    might = typeof attributes.might === 'number' ? attributes.might : parseInt(String(attributes.might));
  }
  
  // Extract power - treat null as 0
  let power = 0;
  if (attributes.power !== undefined && attributes.power !== null) {
    power = typeof attributes.power === 'number' ? attributes.power : parseInt(String(attributes.power));
  }
  
  return {
    name: card.name || '',
    rarity,
    collector_number: card.collector_number || '',
    type,
    faction,
    energy,
    might,
    power,
  };
}

/**
 * Get categorical feedback (correct/wrong/partial)
 * Special handling for faction (domain) which can have multiple values
 */
export function getCategoricalFeedback(
  guessed: string | null,
  actual: string | null,
  attribute?: keyof AttributeFeedback
): CategoricalFeedback {
  // Normalize for comparison (case-insensitive, trim whitespace)
  const normalizedGuessed = (guessed || '').toLowerCase().trim();
  const normalizedActual = (actual || '').toLowerCase().trim();
  
  // Exact match
  if (normalizedGuessed === normalizedActual) {
    return "correct";
  }
  
  // Special handling for faction (domain) - can be partial match
  if (attribute === 'faction') {
    // Split by comma to get individual domains
    const guessedDomains = normalizedGuessed.split(',').map(d => d.trim()).filter(d => d);
    const actualDomains = normalizedActual.split(',').map(d => d.trim()).filter(d => d);
    
    // If either is empty, it's wrong
    if (guessedDomains.length === 0 || actualDomains.length === 0) {
      return "wrong";
    }
    
    // Count how many domains match
    const matchCount = guessedDomains.filter(d => actualDomains.includes(d)).length;
    
    // If all domains match (and same count), it's correct (already handled above)
    // If some domains match but not all, it's partial
    if (matchCount > 0 && matchCount < Math.max(guessedDomains.length, actualDomains.length)) {
      return "partial";
    }
    
    // If no domains match, it's wrong
    return "wrong";
  }
  
  return "wrong";
}

/**
 * Get numeric feedback (exact/high/low)
 */
export function getNumericFeedback(
  guessed: number | null | undefined,
  actual: number | null | undefined
): NumericFeedback {
  // Handle null/undefined cases
  if (guessed === null || guessed === undefined || actual === null || actual === undefined) {
    // If both are null/undefined, consider it "exact" (both missing)
    if ((guessed === null || guessed === undefined) && (actual === null || actual === undefined)) {
      return "exact";
    }
    // Otherwise, it's wrong but we'll show as "exact" to avoid confusion
    return "exact";
  }
  
  if (guessed === actual) return "exact";
  return guessed > actual ? "high" : "low";
}

/**
 * Generate feedback for a guess
 * 6 attributes: 3 categorical (top row) + 3 numerical (bottom row)
 */
export function generateFeedback(
  guessedCard: any,
  actualCard: any
): AttributeFeedback {
  const guessedAttrs = extractCardAttributes(guessedCard);
  const actualAttrs = extractCardAttributes(actualCard);
  
  // Order matters for UI layout: Type, Faction, Rarity, then Energy, Might, Power
  return {
    type: getCategoricalFeedback(guessedAttrs.type, actualAttrs.type, 'type'),
    faction: getCategoricalFeedback(guessedAttrs.faction, actualAttrs.faction, 'faction'),
    rarity: getCategoricalFeedback(guessedAttrs.rarity, actualAttrs.rarity, 'rarity'),
    energy: getNumericFeedback(guessedAttrs.energy, actualAttrs.energy),
    might: getNumericFeedback(guessedAttrs.might, actualAttrs.might),
    power: getNumericFeedback(guessedAttrs.power, actualAttrs.power),
  };
}

/**
 * Check if the guess is correct (card ID matches)
 * IMPORTANT: We compare IDs, not names, because multiple cards can have the same name
 * across different sets (e.g., "Darius, Executioner (Alternate art)" exists in both OGN and SFD)
 */
export function isCorrectGuess(guessedCard: any, actualCard: any): boolean {
  return guessedCard.id === actualCard.id;
}

/**
 * Get display-friendly attribute labels
 */
export const ATTRIBUTE_LABELS: Record<keyof AttributeFeedback, string> = {
  type: "Type",
  faction: "Faction",
  rarity: "Rarity",
  energy: "Energy",
  might: "Might",
  power: "Power",
};

/**
 * Get attribute types for UI rendering
 */
export const ATTRIBUTE_TYPES: Record<keyof AttributeFeedback, 'categorical' | 'numeric'> = {
  type: "categorical",
  faction: "categorical",
  rarity: "categorical",
  energy: "numeric",
  might: "numeric",
  power: "numeric",
};

/**
 * Format attribute value for display
 */
export function formatAttributeValue(
  attribute: keyof AttributeFeedback,
  value: any
): string {
  if (value === null || value === undefined) {
    return "N/A";
  }
  
  if (ATTRIBUTE_TYPES[attribute] === 'numeric') {
    return String(value);
  }
  
  return String(value);
}

/**
 * Compute the list of candidate cards that are still consistent with all guesses made so far.
 * Used by the Cheat Mode panel.
 *
 * Rules derived from feedback:
 *   Categorical (type, faction, rarity):
 *     "correct"  → candidate must have the exact same value
 *     "wrong"    → candidate must NOT have that value
 *     "partial"  → (faction only) candidate must share at least one domain with the guessed value,
 *                  but the full combined value is not an exact match
 *   Numeric (energy, might, power):
 *     "exact"    → candidate must have the exact same value
 *     "high"     → actual is LOWER than guessed → candidate value must be < guessed value
 *     "low"      → actual is HIGHER than guessed → candidate value must be > guessed value
 *
 * @param guessHistory  Array of GuessHistoryItem objects (card_name, attributes, feedback)
 * @param allCards      Full list of eligible cards (with metadata)
 * @returns             Filtered array of cards that are still possible answers
 */
export function computeCheatCandidates(
  guessHistory: Array<{ card_id: string; card_name: string; attributes: CardAttributes; feedback: AttributeFeedback }>,
  allCards: any[]
): any[] {
  if (guessHistory.length === 0) return allCards;

  // Build set of guessed card IDs for fast lookup
  const guessedCardIds = new Set(guessHistory.map(g => g.card_id));

  return allCards.filter(card => {
    // Exclude cards that have already been guessed
    if (guessedCardIds.has(card.id)) return false;

    const attrs = extractCardAttributes(card);

    for (const guess of guessHistory) {
      const gAttrs = guess.attributes;
      const fb = guess.feedback;

      // Coerce numeric values to numbers (guard against JSON string deserialization)
      const gEnergy = Number(gAttrs.energy ?? 0);
      const gMight  = Number(gAttrs.might  ?? 0);
      const gPower  = Number(gAttrs.power  ?? 0);

      // ── Categorical: type ──────────────────────────────────────────────
      if (fb.type === 'correct') {
        if (attrs.type !== gAttrs.type) return false;
      } else if (fb.type === 'wrong') {
        if (attrs.type === gAttrs.type) return false;
      }
      // 'partial' is not used for type, but handle gracefully (no constraint)

      // ── Categorical: rarity ────────────────────────────────────────────
      if (fb.rarity === 'correct') {
        if (attrs.rarity !== gAttrs.rarity) return false;
      } else if (fb.rarity === 'wrong') {
        if (attrs.rarity === gAttrs.rarity) return false;
      }

      // ── Categorical: faction (domain) ──────────────────────────────────
      // gAttrs.faction is a sorted comma-separated string of domains
      const guessedDomains = (gAttrs.faction || '').split(',').map((d: string) => d.trim()).filter(Boolean);
      const candidateDomains = (attrs.faction || '').split(',').map((d: string) => d.trim()).filter(Boolean);

      if (fb.faction === 'correct') {
        // Exact match required
        if (attrs.faction !== gAttrs.faction) return false;
      } else if (fb.faction === 'wrong') {
        // No overlap at all
        const hasOverlap = guessedDomains.some((d: string) => candidateDomains.includes(d));
        if (hasOverlap) return false;
      } else if (fb.faction === 'partial') {
        // Must share at least one domain, but not be an exact match
        const hasOverlap = guessedDomains.some((d: string) => candidateDomains.includes(d));
        if (!hasOverlap) return false;
        if (attrs.faction === gAttrs.faction) return false; // would be 'correct', not 'partial'
      }

      // ── Numeric: energy ────────────────────────────────────────────────
      if (fb.energy === 'exact') {
        if (attrs.energy !== gEnergy) return false;
      } else if (fb.energy === 'high') {
        // guessed too high → actual is lower → candidate must be < guessed
        if (attrs.energy >= gEnergy) return false;
      } else if (fb.energy === 'low') {
        // guessed too low → actual is higher → candidate must be > guessed
        if (attrs.energy <= gEnergy) return false;
      }

      // ── Numeric: might ─────────────────────────────────────────────────
      if (fb.might === 'exact') {
        if (attrs.might !== gMight) return false;
      } else if (fb.might === 'high') {
        if (attrs.might >= gMight) return false;
      } else if (fb.might === 'low') {
        if (attrs.might <= gMight) return false;
      }

      // ── Numeric: power ─────────────────────────────────────────────────
      if (fb.power === 'exact') {
        if (attrs.power !== gPower) return false;
      } else if (fb.power === 'high') {
        if (attrs.power >= gPower) return false;
      } else if (fb.power === 'low') {
        if (attrs.power <= gPower) return false;
      }
    }

    return true;
  });
}

// Made with Bob
