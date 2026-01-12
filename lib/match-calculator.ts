import { createSupabaseClient } from './supabase/client';
import { Card, Profile } from './supabase/types';

export interface MatchResult {
  matchedProfileId: string;
  matchedProfile: Profile;
  matchCount: number;
  matchedCards: Array<{ card: Card; haveQuantity: number; wantQuantity: number }>;
}

/**
 * Calculate matches for a user based on their have/want cards
 * Uses the same logic as the search page
 */
export async function calculateMatches(userProfileId: string): Promise<MatchResult[]> {
  const supabase = createSupabaseClient();
  
  // Get current user's profile with have/want cards
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      profile_have_cards(card_id, quantity, cards(*)),
      profile_want_cards(card_id, quantity, cards(*))
    `)
    .eq('id', userProfileId)
    .single();

  if (profileError || !userProfile) {
    console.error('Error loading user profile:', profileError);
    return [];
  }

  // Build maps of user's have/want cards with quantities
  const userHaveCardsMap = new Map<string, number>();
  const userWantCardsMap = new Map<string, number>();

  (userProfile.profile_have_cards || []).forEach((item: any) => {
    if (item.cards && item.cards.id) {
      userHaveCardsMap.set(item.cards.id, item.quantity || 1);
    }
  });

  (userProfile.profile_want_cards || []).forEach((item: any) => {
    if (item.cards && item.cards.id) {
      userWantCardsMap.set(item.cards.id, item.quantity || 1);
    }
  });

  // If user has no cards, no matches possible
  if (userHaveCardsMap.size === 0 && userWantCardsMap.size === 0) {
    return [];
  }

  // Get all other profiles with their have/want cards
  // Note: This is expensive but necessary for accurate matching
  // We optimize by only calling this when cards change, not on every page load
  // Use range() to limit results and handle pagination if needed
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      *,
      profile_have_cards(card_id, quantity, cards(*)),
      profile_want_cards(card_id, quantity, cards(*))
    `)
    .neq('id', userProfileId)
    .limit(1000); // Limit to prevent excessive queries

  if (profilesError || !allProfiles) {
    console.error('Error loading profiles:', profilesError);
    return [];
  }

  // Calculate matches for each profile
  const matches: MatchResult[] = [];

  for (const profile of allProfiles) {
    const haveCardsMap = new Map<string, number>();
    const wantCardsMap = new Map<string, number>();

    (profile.profile_have_cards || []).forEach((item: any) => {
      if (item.cards && item.cards.id) {
        haveCardsMap.set(item.cards.id, item.quantity || 1);
      }
    });

    (profile.profile_want_cards || []).forEach((item: any) => {
      if (item.cards && item.cards.id) {
        wantCardsMap.set(item.cards.id, item.quantity || 1);
      }
    });

    // Calculate match score
    const matchedCards: Array<{ card: Card; haveQuantity: number; wantQuantity: number }> = [];
    const matchedCardIds = new Set<string>(); // Track cards we've already matched to prevent duplicates
    let matchCount = 0;

    // Check: User wants cards that this profile has
    userWantCardsMap.forEach((userWantsQuantity, cardId) => {
      const profileHasQuantity = haveCardsMap.get(cardId) || 0;
      if (profileHasQuantity > 0 && !matchedCardIds.has(cardId)) {
        const matchQuantity = Math.min(profileHasQuantity, userWantsQuantity);
        matchCount += matchQuantity;
        matchedCardIds.add(cardId);
        const card = (profile.profile_have_cards || []).find((item: any) => item.cards?.id === cardId)?.cards;
        if (card) {
          matchedCards.push({
            card,
            haveQuantity: profileHasQuantity,
            wantQuantity: userWantsQuantity,
          });
        }
      }
    });

    // Check: User has cards that this profile wants
    userHaveCardsMap.forEach((userHasQuantity, cardId) => {
      const profileWantsQuantity = wantCardsMap.get(cardId) || 0;
      if (profileWantsQuantity > 0 && !matchedCardIds.has(cardId)) {
        const matchQuantity = Math.min(profileWantsQuantity, userHasQuantity);
        matchCount += matchQuantity;
        matchedCardIds.add(cardId);
        const card = (profile.profile_want_cards || []).find((item: any) => item.cards?.id === cardId)?.cards;
        if (card) {
          matchedCards.push({
            card,
            haveQuantity: userHasQuantity,
            wantQuantity: profileWantsQuantity,
          });
        }
      }
    });

    // Only include profiles with at least one match
    if (matchCount > 0) {
      matches.push({
        matchedProfileId: profile.id,
        matchedProfile: profile,
        matchCount,
        matchedCards,
      });
    }
  }

  // Sort by match count (descending)
  matches.sort((a, b) => b.matchCount - a.matchCount);

  return matches;
}
