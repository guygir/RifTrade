# Enhanced Card Extraction from Riftbound.gg

## Current Limitation
- Only extracting champion names from tier list
- Results in only 7 cards (all champions)
- Missing actual deck card lists

## New Approach: Deep Scraping Champion Pages

### Step 1: Get All Champions from All Tiers
From `https://riftbound.gg/tier-list/`:
- Tier S, A, B, C, D (all tiers, not just top 3)
- Each champion has a link to their legend page
- Example: `https://riftbound.gg/draven-best-decks-cards/`

### Step 2: Scrape Each Champion's Legend Page
For each champion URL:
1. Navigate to the champion's page
2. Find the FIRST `class="RootOfEmbeddedDeck"` element
3. Extract all card hrefs within that deck
4. Parse card IDs from URLs

### Step 3: Parse Card URLs
Example URL: `https://riftbound.gg/cards/ogn-036-vi-destructive`

Parse to get:
- Set code: `ogn`
- Collector number: `036`
- Card slug: `vi-destructive`

### Step 4: Match to Database
Query our cards table:
```sql
SELECT * FROM cards 
WHERE set_code = 'OGN' 
AND collector_number = '036'
```

### Step 5: Calculate Weighted Usage

#### Tier Weights (Inverse - Higher tier = More weight)
- S tier: weight = 32
- A tier: weight = 16
- B tier: weight = 8
- C tier: weight = 4
- D tier: weight = 2

#### Weighted Percentage Formula
```
weighted_usage = (S_count * 32 + A_count * 16 + B_count * 8 + C_count * 4 + D_count * 2) / total_weighted_decks
```

#### Display Both Metrics
- **Raw %**: 45% (used in 20 out of 44 decks)
- **Weighted %**: 68% (heavily used in S/A tier decks)

## Implementation Plan

### File: `lib/meta-data/sources/riftbound-deck-scraper.ts`
New scraper to fetch full deck lists from champion pages.

```typescript
interface ChampionDeck {
  champion: string;
  tier: string;
  deckUrl: string;
  cards: string[]; // Array of card IDs like "ogn-036"
}

async function scrapeChampionDeck(championUrl: string): Promise<ChampionDeck>
```

### File: `lib/meta-data/transformers/card-matcher.ts`
Match scraped card IDs to database cards.

```typescript
async function matchCardToDatabase(
  setCode: string,
  collectorNumber: string,
  supabase: SupabaseClient
): Promise<Card | null>
```

### File: `lib/meta-data/transformers/weighted-card-calculator.ts`
Calculate weighted usage statistics.

```typescript
interface WeightedCardUsage {
  card_id: string;
  raw_usage_count: number;
  raw_usage_percentage: number;
  weighted_usage_score: number;
  weighted_usage_percentage: number;
  tier_distribution: {
    S: number;
    A: number;
    B: number;
    C: number;
    D: number;
  };
}
```

### Updated Flow

1. **Scrape tier list** → Get all champions with tiers (S, A, B, C, D)
2. **For each champion** → Visit their legend page
3. **Extract first deck** → Parse `RootOfEmbeddedDeck` for card hrefs
4. **Match cards** → Query database using set_code + collector_number
5. **Aggregate** → Count card usage across all decks
6. **Calculate weights** → Apply tier weights to usage
7. **Store** → Save to `popular_cards` table with both metrics

## Database Schema Update

Add weighted metrics to `popular_cards` table:

```sql
ALTER TABLE popular_cards 
ADD COLUMN weighted_usage_score DECIMAL(10,2),
ADD COLUMN weighted_usage_percentage DECIMAL(5,2);
```

## Benefits

1. **More Cards**: Will get 30-40 unique cards instead of 7
2. **Better Data**: Actual deck lists, not just champion names
3. **Weighted Metrics**: Shows which cards are important in top-tier decks
4. **Tier Context**: Users see if a card is S-tier staple or D-tier filler
5. **No RiftMana Dependency**: Single source of truth (Riftbound only)

## Example Output

```json
{
  "card_name": "Vi",
  "raw_usage": "45%",
  "raw_count": "20/44 decks",
  "weighted_usage": "68%",
  "tier_distribution": {
    "S": 8,
    "A": 7,
    "B": 3,
    "C": 2,
    "D": 0
  }
}
```

## Implementation Timeline

- **Phase 1**: Create new scraper for champion pages (2-3 hours)
- **Phase 2**: Build card matcher (1 hour)
- **Phase 3**: Implement weighted calculator (1 hour)
- **Phase 4**: Update aggregator to use new system (1 hour)
- **Phase 5**: Update UI to show weighted % (30 min)
- **Phase 6**: Test and refine (1 hour)

**Total**: ~7 hours of development

## Next Steps

1. Create `riftbound-deck-scraper.ts`
2. Test scraping a single champion page
3. Verify card matching works
4. Implement full aggregation
5. Update UI components

This will give us a much richer and more accurate "Popular Cards" feature!