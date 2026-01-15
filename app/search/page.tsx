'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Profile } from '@/lib/supabase/types';
import { createSupabaseClient } from '@/lib/supabase/client';
import { getCardDisplayName } from '@/lib/card-display';
import { sanitizeText, sanitizeContactInfo } from '@/lib/sanitize';

interface SearchResult {
  profile: Profile;
  haveCards: Array<Card & { quantity: number }>;
  wantCards: Array<Card & { quantity: number }>;
  matchScore: number; // Number of matching cards
  matchedCards: Array<{ card: Card; haveQuantity: number; wantQuantity: number }>; // Details of matches
}

export default function SearchPage() {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [selectedHaveCards, setSelectedHaveCards] = useState<string[]>([]);
  const [selectedWantCards, setSelectedWantCards] = useState<string[]>([]);
  const [userWantCardIds, setUserWantCardIds] = useState<Set<string>>(new Set()); // Cards user wants to buy
  const [userHaveCardIds, setUserHaveCardIds] = useState<Set<string>>(new Set()); // Cards user has to sell
  const [userWantCardQuantities, setUserWantCardQuantities] = useState<Map<string, number>>(new Map());
  const [userHaveCardQuantities, setUserHaveCardQuantities] = useState<Map<string, number>>(new Map());
  const [cardHaveCounts, setCardHaveCounts] = useState<Map<string, { users: number; totalQuantity: number }>>(new Map()); // How many users have each card and total quantity
  const [cardWantCounts, setCardWantCounts] = useState<Map<string, { users: number; totalQuantity: number }>>(new Map()); // How many users want each card and total quantity
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadCardsAndProfile();
  }, []);

  const loadCardsAndProfile = async () => {
    const supabase = createSupabaseClient();
    
    // Load cards
    const { data: cardsData } = await supabase
      .from('cards')
      .select('*')
      .order('set_code', { ascending: true })
      .order('sort_key', { ascending: true, nullsFirst: false })
      .order('collector_number');
    setAllCards(cardsData || []);
    
    // Load card counts (how many users have/want each card and total quantities) - efficient single queries
    const [haveCountsResult, wantCountsResult] = await Promise.all([
      supabase
        .from('profile_have_cards')
        .select('card_id, quantity'),
      supabase
        .from('profile_want_cards')
        .select('card_id, quantity')
    ]);
    
    // Count users and sum quantities for each card_id
    const haveCountsMap = new Map<string, { users: number; totalQuantity: number }>();
    const wantCountsMap = new Map<string, { users: number; totalQuantity: number }>();
    
    (haveCountsResult.data || []).forEach((item: any) => {
      if (item.card_id) {
        const existing = haveCountsMap.get(item.card_id) || { users: 0, totalQuantity: 0 };
        haveCountsMap.set(item.card_id, {
          users: existing.users + 1,
          totalQuantity: existing.totalQuantity + (item.quantity || 1)
        });
      }
    });
    
    (wantCountsResult.data || []).forEach((item: any) => {
      if (item.card_id) {
        const existing = wantCountsMap.get(item.card_id) || { users: 0, totalQuantity: 0 };
        wantCountsMap.set(item.card_id, {
          users: existing.users + 1,
          totalQuantity: existing.totalQuantity + (item.quantity || 1)
        });
      }
    });
    
    setCardHaveCounts(haveCountsMap);
    setCardWantCounts(wantCountsMap);
    
    // Load current user's profile to auto-populate defaults
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        // Load cards user wants to buy (these should be in "Users who HAVE these cards" filter)
        const { data: wantData } = await supabase
          .from('profile_want_cards')
          .select('card_id, quantity')
          .eq('profile_id', profileData.id);
        
        if (wantData && wantData.length > 0) {
          const wantIds = wantData.map(item => item.card_id).filter(Boolean);
          const wantQuantities = new Map<string, number>();
          wantData.forEach(item => {
            if (item.card_id) {
              wantQuantities.set(item.card_id, item.quantity || 1);
            }
          });
          setUserWantCardIds(new Set(wantIds));
          setUserWantCardQuantities(wantQuantities);
          setSelectedHaveCards(wantIds); // Auto-populate: users who HAVE cards I want to buy
        }
        
        // Load cards user has to sell (these should be in "Users who WANT these cards" filter)
        const { data: haveData } = await supabase
          .from('profile_have_cards')
          .select('card_id, quantity')
          .eq('profile_id', profileData.id);
        
        if (haveData && haveData.length > 0) {
          const haveIds = haveData.map(item => item.card_id).filter(Boolean);
          const haveQuantities = new Map<string, number>();
          haveData.forEach(item => {
            if (item.card_id) {
              haveQuantities.set(item.card_id, item.quantity || 1);
            }
          });
          setUserHaveCardIds(new Set(haveIds));
          setUserHaveCardQuantities(haveQuantities);
          setSelectedWantCards(haveIds); // Auto-populate: users who WANT cards I have to sell
        }
      }
    }
    
    setLoading(false);
    
    // Auto-search if we have defaults and haven't searched yet
    if (!hasAutoSearched && (selectedHaveCards.length > 0 || selectedWantCards.length > 0)) {
      setHasAutoSearched(true);
      // Use setTimeout to ensure state is updated
      setTimeout(() => {
        performSearch();
      }, 200);
    }
  };

  const performSearch = async () => {
    setSearching(true);
    const supabase = createSupabaseClient();

    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          profile_have_cards(id, quantity, cards(*)),
          profile_want_cards(id, quantity, cards(*))
        `);

      // If we have filters, we need to filter by cards
      if (selectedHaveCards.length > 0 || selectedWantCards.length > 0) {
        // Get profiles that match our criteria
        const profileIds = new Set<string>();

        if (selectedHaveCards.length > 0) {
          const { data: haveData } = await supabase
            .from('profile_have_cards')
            .select('profile_id')
            .in('card_id', selectedHaveCards);

          if (haveData) {
            haveData.forEach(item => profileIds.add(item.profile_id));
          }
        }

        if (selectedWantCards.length > 0) {
          const { data: wantData } = await supabase
            .from('profile_want_cards')
            .select('profile_id')
            .in('card_id', selectedWantCards);

          if (wantData) {
            // If we're filtering by both, use OR logic (profiles matching either)
            if (selectedHaveCards.length > 0) {
              wantData.forEach(item => profileIds.add(item.profile_id));
            } else {
              wantData.forEach(item => profileIds.add(item.profile_id));
            }
          }
        }

        if (profileIds.size === 0) {
          setResults([]);
          setSearching(false);
          return;
        }

        query = query.in('id', Array.from(profileIds));
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process results and calculate match scores
      const formattedResults: SearchResult[] = (data || []).map((profile: any) => {
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

        // Calculate matches based on current filter selections (selectedHaveCards/selectedWantCards):
        // - If filter has card X in selectedHaveCards (we want users who HAVE these), and result user has it -> match
        // - If filter has card Y in selectedWantCards (we want users who WANT these), and result user wants it -> match
        const matchedCards: Array<{ card: Card; haveQuantity: number; wantQuantity: number }> = [];
        let matchScore = 0;

        // Check matches: cards in selectedHaveCards (we're looking for users who HAVE these cards)
        // This means: if result user has any of these cards, it's a match (we want what they have)
        selectedHaveCards.forEach(cardId => {
          const resultHasQuantity = haveCardsMap.get(cardId) || 0;
          if (resultHasQuantity > 0) {
            // Result user has this card that we're looking for
            // We don't have the quantity we want from filters, so use 1 as default, or get from userWantCardQuantities if available
            const userWantsQuantity = userWantCardQuantities.get(cardId) || 1;
            const matchQuantity = Math.min(resultHasQuantity, userWantsQuantity);
            matchScore += matchQuantity;
            const card = allCards.find(c => c.id === cardId);
            if (card) {
              matchedCards.push({
                card,
                haveQuantity: resultHasQuantity, // Result user has this many
                wantQuantity: userWantsQuantity, // We want this many (from profile if available, else 1)
              });
            }
          }
        });

        // Check matches: cards in selectedWantCards (we're looking for users who WANT these cards)
        // This means: if result user wants any of these cards, it's a match (they want what we have)
        selectedWantCards.forEach(cardId => {
          const resultWantsQuantity = wantCardsMap.get(cardId) || 0;
          if (resultWantsQuantity > 0) {
            // Result user wants this card that we're offering
            // We don't have the quantity we have from filters, so use 1 as default, or get from userHaveCardQuantities if available
            const userHasQuantity = userHaveCardQuantities.get(cardId) || 1;
            const matchQuantity = Math.min(resultWantsQuantity, userHasQuantity);
            matchScore += matchQuantity;
            const card = allCards.find(c => c.id === cardId);
            if (card) {
              matchedCards.push({
                card,
                haveQuantity: userHasQuantity, // We have this many (from profile if available, else 1)
                wantQuantity: resultWantsQuantity, // Result user wants this many
              });
            }
          }
        });

        return {
          profile,
          haveCards: (profile.profile_have_cards || [])
            .map((item: any) => ({
              ...item.cards,
              quantity: item.quantity || 1,
            }))
            .filter((item: any) => item.id),
          wantCards: (profile.profile_want_cards || [])
            .map((item: any) => ({
              ...item.cards,
              quantity: item.quantity || 1,
            }))
            .filter((item: any) => item.id),
          matchScore,
          matchedCards,
        };
      });

      // Filter to only show results with at least one match, then sort by match score
      const filteredAndSorted = formattedResults
        .filter(result => result.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

      setResults(filteredAndSorted);
    } catch (err) {
      console.error('Search error:', err);
      alert('Error performing search');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSelectedHaveCards([]);
    setSelectedWantCards([]);
    setResults([]);
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Search for a trade</h1>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Search Filters</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Cards I'm looking for:
              </label>
              <CardMultiSelect
                cards={allCards}
                selectedIds={selectedHaveCards}
                onChange={setSelectedHaveCards}
                cardHaveCounts={cardHaveCounts}
                isHaveFilter={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Cards I'm willing to trade:
              </label>
              <CardMultiSelect
                cards={allCards}
                selectedIds={selectedWantCards}
                onChange={setSelectedWantCards}
                cardWantCounts={cardWantCounts}
                isHaveFilter={false}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={performSearch}
              disabled={searching || (selectedHaveCards.length === 0 && selectedWantCards.length === 0)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={clearSearch}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">
            Results ({results.length})
          </h2>

          {results.length === 0 && !searching && (
            <p className="text-gray-600 dark:text-gray-400">No results yet. Use the filters above to search.</p>
          )}

          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.profile.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      {result.profile.username ? (
                        <Link href={`/${result.profile.username}`} className="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                          {sanitizeText(result.profile.display_name)}
                        </Link>
                      ) : (
                        <h3 className="text-lg font-semibold">{sanitizeText(result.profile.display_name)}</h3>
                      )}
                    </div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {result.matchScore} matching card{result.matchScore !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <strong>Contact:</strong> <span dangerouslySetInnerHTML={{ __html: sanitizeContactInfo(result.profile.contact_info) }} />
                  </p>
                  {result.profile.trading_locations && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <strong>Locations:</strong> {sanitizeText(result.profile.trading_locations)}
                    </p>
                  )}
                  {result.matchedCards.length > 0 && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">Matches:</p>
                      <ul className="text-xs text-blue-800 dark:text-blue-300 list-disc list-inside">
                        {result.matchedCards.map((match, idx) => (
                          <li key={idx}>
                            {getCardDisplayName(match.card)} - 
                            {selectedHaveCards.includes(match.card.id) 
                              ? `You want ${match.wantQuantity}, They have ${match.haveQuantity}`
                              : `You have ${match.haveQuantity}, They want ${match.wantQuantity}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Has ({result.haveCards.length} cards):</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {result.haveCards.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {result.haveCards.slice(0, 10).map(card => (
                            <li key={card.id}>
                              {getCardDisplayName(card)} {card.quantity > 1 && `(x${card.quantity})`}
                            </li>
                          ))}
                          {result.haveCards.length > 10 && (
                            <li>... and {result.haveCards.length - 10} more</li>
                          )}
                        </ul>
                      ) : (
                        <p>None listed</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Wants ({result.wantCards.length} cards):</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {result.wantCards.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {result.wantCards.slice(0, 10).map(card => (
                            <li key={card.id}>
                              {getCardDisplayName(card)} {card.quantity > 1 && `(x${card.quantity})`}
                            </li>
                          ))}
                          {result.wantCards.length > 10 && (
                            <li>... and {result.wantCards.length - 10} more</li>
                          )}
                        </ul>
                      ) : (
                        <p>None listed</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function CardMultiSelect({
  cards,
  selectedIds,
  onChange,
  cardHaveCounts,
  cardWantCounts,
  isHaveFilter,
}: {
  cards: Card[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  cardHaveCounts?: Map<string, { users: number; totalQuantity: number }>;
  cardWantCounts?: Map<string, { users: number; totalQuantity: number }>;
  isHaveFilter?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  let filteredCards = cards.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCardDisplayName(card).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter to show only selected cards if toggle is on
  if (showOnlySelected) {
    filteredCards = filteredCards.filter(card => selectedIds.includes(card.id));
  }

  const toggleCard = (cardId: string) => {
    if (selectedIds.includes(cardId)) {
      onChange(selectedIds.filter(id => id !== cardId));
    } else {
      onChange([...selectedIds, cardId]);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          <input
            type="checkbox"
            checked={showOnlySelected}
            onChange={(e) => setShowOnlySelected(e.target.checked)}
            className="cursor-pointer"
          />
          <span className="text-sm whitespace-nowrap">Show only selected</span>
        </label>
      </div>
      <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800">
        {filteredCards.map((card) => (
          <label
            key={card.id}
            className="flex items-center gap-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(card.id)}
              onChange={() => toggleCard(card.id)}
            />
            <span className="flex-1">
              {getCardDisplayName(card)}
              {isHaveFilter && cardHaveCounts && cardHaveCounts.has(card.id) && (() => {
                const counts = cardHaveCounts.get(card.id)!;
                return (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    [{counts.users} user{counts.users !== 1 ? 's' : ''} have this, {counts.totalQuantity} cop{counts.totalQuantity !== 1 ? 'ies' : 'y'} overall]
                  </span>
                );
              })()}
              {!isHaveFilter && cardWantCounts && cardWantCounts.has(card.id) && (() => {
                const counts = cardWantCounts.get(card.id)!;
                return (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    [{counts.users} user{counts.users !== 1 ? 's' : ''} want this, {counts.totalQuantity} cop{counts.totalQuantity !== 1 ? 'ies' : 'y'} overall]
                  </span>
                );
              })()}
            </span>
          </label>
        ))}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {selectedIds.length} card(s) selected
        </p>
      )}
    </div>
  );
}

