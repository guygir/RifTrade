/**
 * Riftcodex API Client
 * 
 * Based on official API documentation: https://riftcodex.com/docs/category/riftcodex-api
 * 
 * Available endpoints:
 * - GET /cards - Get all cards
 * - GET /cards/:id - Get card by ID
 * - GET /cards/name - Get cards by name
 * - GET /sets - Get all sets
 * - GET /sets/:id - Get set by ID
 */

export interface RiftcodexCard {
  id?: string;
  name: string;
  set?: string;
  set_code?: string;
  collector_number?: string;
  number?: string;
  image_url?: string;
  image?: string;
  rarity?: string;
  [key: string]: any; // Allow for flexible API response structure
}

export interface RiftcodexSet {
  id: string;
  name: string;
  code: string;
  cards?: RiftcodexCard[];
  [key: string]: any;
}

/**
 * Get the Riftcodex API base URL
 * The actual API is at https://api.riftcodex.com
 */
function getBaseUrl(): string {
  if (process.env.RIFTCODEX_API_URL) {
    return process.env.RIFTCODEX_API_URL;
  }
  
  // Actual Riftcodex API base URL
  return 'https://api.riftcodex.com';
}

/**
 * Fetch all cards from Riftcodex API
 * Uses the GET /cards endpoint as documented at:
 * https://riftcodex.com/docs/category/riftcodex-api
 * 
 * The API is paginated, so we need to fetch all pages.
 */
export async function fetchAllCards(): Promise<RiftcodexCard[]> {
  const baseUrl = getBaseUrl();
  
  try {
    const allCards: RiftcodexCard[] = [];
    let page = 1;
    let totalPages = 1;
    
    // Fetch first page to get total pages
    const firstResponse = await fetch(`${baseUrl}/cards?page=${page}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!firstResponse.ok) {
      throw new Error(`Riftcodex API error: ${firstResponse.status} ${firstResponse.statusText}`);
    }

    const firstData = await firstResponse.json();
    
    // Riftcodex API returns: { items: [...], total, page, size, pages }
    if (firstData.items && Array.isArray(firstData.items)) {
      allCards.push(...firstData.items);
      totalPages = firstData.pages || 1;
      
      // Fetch remaining pages
      for (page = 2; page <= totalPages; page++) {
        const response = await fetch(`${baseUrl}/cards?page=${page}`, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const pageData = await response.json();
          if (pageData.items && Array.isArray(pageData.items)) {
            allCards.push(...pageData.items);
          }
        } else {
          console.warn(`Failed to fetch page ${page}: ${response.status}`);
        }
      }
      
      return allCards;
    } else if (Array.isArray(firstData)) {
      return firstData;
    } else {
      throw new Error('Unexpected API response structure. Expected object with items array.');
    }
  } catch (error) {
    console.error('Error fetching cards from Riftcodex:', error);
    throw error;
  }
}

/**
 * Try fetching from alternative base URL (api.riftcodex.com)
 */
async function fetchAllCardsFromAlternative(): Promise<RiftcodexCard[]> {
  try {
    const response = await fetch('https://api.riftcodex.com/cards', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Alternative API URL also failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data;
    } else if (data.cards && Array.isArray(data.cards)) {
      return data.cards;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      throw new Error('Unexpected API response structure from alternative URL');
    }
  } catch (error) {
    console.error('Alternative URL also failed, trying sets approach:', error);
    return fetchAllCardsFromSets();
  }
}

/**
 * Fallback: Fetch all sets, then fetch cards from each set
 * Uses GET /sets and GET /sets/:id endpoints
 */
async function fetchAllCardsFromSets(): Promise<RiftcodexCard[]> {
  const baseUrl = getBaseUrl();
  
  try {
    const setsResponse = await fetch(`${baseUrl}/sets`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!setsResponse.ok) {
      throw new Error(`Failed to fetch sets: ${setsResponse.status}`);
    }

    const setsData = await setsResponse.json();
    const sets: RiftcodexSet[] = Array.isArray(setsData) ? setsData : 
                                 setsData.sets || setsData.data || [];
    
    if (sets.length === 0) {
      throw new Error('No sets found in API response');
    }
    
    const allCards: RiftcodexCard[] = [];
    
    // Fetch cards from each set
    for (const set of sets) {
      const setId = set.id || set.code;
      if (!setId) continue;
      
      try {
        const cardsResponse = await fetch(`${baseUrl}/sets/${setId}`, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (cardsResponse.ok) {
          const setData = await cardsResponse.json();
          
          // Check if set data includes cards array
          if (setData.cards && Array.isArray(setData.cards)) {
            allCards.push(...setData.cards);
          } else if (Array.isArray(setData)) {
            allCards.push(...setData);
          }
        }
      } catch (setError) {
        console.warn(`Failed to fetch cards for set ${setId}:`, setError);
        // Continue with other sets
      }
    }
    
    if (allCards.length === 0) {
      throw new Error('No cards found in any set');
    }
    
    return allCards;
  } catch (error) {
    console.error('Failed to fetch cards from sets:', error);
    throw error;
  }
}

/**
 * Extract sort key from riftbound_id
 * Example: "ogn-066a-298" -> "066a"
 */
export function extractSortKey(riftboundId: string | null | undefined): string | null {
  if (!riftboundId) return null;
  const parts = riftboundId.split('-');
  if (parts.length >= 3) {
    return parts[1]; // Middle part between dashes
  }
  return null;
}

/**
 * Format display name from public_code
 * Example: "OGN-066a/298" -> "OGN #066a"
 */
export function formatCardPrefix(publicCode: string | null | undefined): string {
  if (!publicCode) return '';
  // Extract part before "/" and replace "-" with " #"
  const beforeSlash = publicCode.split('/')[0];
  return beforeSlash.replace('-', ' #');
}

/**
 * Transform Riftcodex card data to our database format
 * Based on actual API structure: { name, set: { set_id }, collector_number, media: { image_url }, classification: { rarity } }
 */
export function transformCard(card: RiftcodexCard, variant: 'normal' | 'foil' | 'alternate' = 'normal'): {
  name: string;
  set_code: string;
  collector_number: string;
  image_url: string | null;
  rarity: string | null;
  sort_key: string | null;
  public_code: string | null;
  riftbound_id: string | null;
  metadata: Record<string, any>;
} {
  // Extract set code from nested structure: set.set_id
  const setCode = (card as any).set?.set_id || card.set_code || card.set || '';
  
  // Extract collector number - prefer from public_code or riftbound_id for accuracy
  // public_code format: "OGN-027a/298" -> extract "027a" part
  // riftbound_id format: "ogn-027a-298" -> extract "027a" part
  let collectorNumber = String(card.collector_number || card.number || '');
  const publicCode = (card as any).public_code || null;
  const riftboundId = (card as any).riftbound_id || null;
  
  // If public_code exists, extract the collector number part (between set code and slash)
  if (publicCode) {
    const match = publicCode.match(/^[A-Z]+-([^/]+)/);
    if (match) {
      collectorNumber = match[1]; // e.g., "027a" from "OGN-027a/298"
    }
  } else if (riftboundId) {
    // Fallback to riftbound_id if public_code not available
    const parts = riftboundId.split('-');
    if (parts.length >= 3) {
      collectorNumber = parts[1]; // e.g., "027a" from "ogn-027a-298"
    }
  }
  
  // Extract image URL from nested structure: media.image_url
  const imageUrl = (card as any).media?.image_url || card.image_url || card.image || null;
  
  // Extract rarity from nested structure: classification.rarity
  const rarity = (card as any).classification?.rarity || card.rarity || null;
  
  // Extract sort_key from riftbound_id (middle part between dashes)
  // This is done BEFORE any variant modifications to ensure foil variants have the same sort_key
  const sortKey = extractSortKey(riftboundId);
  
  // Handle name variations based on variant and rarity
  let cardName = card.name || '';
  let modifiedCollectorNumber = collectorNumber;
  
  if (variant === 'foil') {
    cardName = `${cardName} (Foil)`;
    // For foil variant, append "-foil" to collector_number to make it unique in the database
    // But keep same sort_key for proper ordering
    modifiedCollectorNumber = `${collectorNumber}-foil`;
  } else if (rarity === 'Showcase') {
    // For Showcase rarity, rename to (Alternate art) if not already
    if (!cardName.includes('(Alternate art)') && !cardName.includes('(Alternate Art)') && !cardName.includes('(alternate art)')) {
      cardName = `${cardName} (Alternate art)`;
    }
  }
  // If variant is 'alternate' explicitly, also rename
  if (variant === 'alternate' && !cardName.includes('(Alternate art)') && !cardName.includes('(Alternate Art)') && !cardName.includes('(alternate art)')) {
    cardName = `${cardName} (Alternate art)`;
  }
  
  return {
    name: cardName,
    set_code: setCode,
    collector_number: modifiedCollectorNumber,
    image_url: imageUrl,
    rarity: rarity,
    sort_key: sortKey, // Same sort_key for base and foil variants (for proper ordering)
    public_code: publicCode, // Keep original public_code for display
    riftbound_id: riftboundId, // Keep original riftbound_id for reference
    metadata: {
      ...card,
      variant: variant, // Store variant type in metadata
      // Store original data for reference
    },
  };
}

