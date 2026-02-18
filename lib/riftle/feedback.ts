/**
 * Riftle Feedback Logic
 * 
 * Handles attribute comparison and feedback generation for card guesses
 */

export type CategoricalFeedback = "correct" | "wrong";
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
  const type = classification.type || null;
  
  // Extract faction from classification.domain (it's an array, take first element)
  let faction: string | null = null;
  if (classification.domain && Array.isArray(classification.domain) && classification.domain.length > 0) {
    faction = classification.domain[0];
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
 * Get categorical feedback (correct/wrong)
 */
export function getCategoricalFeedback(
  guessed: string | null,
  actual: string | null
): CategoricalFeedback {
  // Normalize for comparison (case-insensitive, trim whitespace)
  const normalizedGuessed = (guessed || '').toLowerCase().trim();
  const normalizedActual = (actual || '').toLowerCase().trim();
  
  return normalizedGuessed === normalizedActual ? "correct" : "wrong";
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
    type: getCategoricalFeedback(guessedAttrs.type, actualAttrs.type),
    faction: getCategoricalFeedback(guessedAttrs.faction, actualAttrs.faction),
    rarity: getCategoricalFeedback(guessedAttrs.rarity, actualAttrs.rarity),
    energy: getNumericFeedback(guessedAttrs.energy, actualAttrs.energy),
    might: getNumericFeedback(guessedAttrs.might, actualAttrs.might),
    power: getNumericFeedback(guessedAttrs.power, actualAttrs.power),
  };
}

/**
 * Check if the guess is correct (card name matches)
 */
export function isCorrectGuess(guessedCard: any, actualCard: any): boolean {
  const guessedName = (guessedCard.name || '').toLowerCase().trim();
  const actualName = (actualCard.name || '').toLowerCase().trim();
  return guessedName === actualName;
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

// Made with Bob
