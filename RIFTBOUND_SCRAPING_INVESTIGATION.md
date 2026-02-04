# Riftbound.gg Deck Scraping Investigation

## Date: 2026-02-03

## Problem Statement
The enhanced card extraction feature attempted to scrape actual deck card lists from Riftbound.gg champion legend pages to get tier-weighted card usage metrics. However, investigation revealed that Riftbound.gg uses client-side JavaScript rendering for deck content.

## Investigation Results

### What We Found

1. **Tier List Page** (`https://riftbound.gg/tier-list/`)
   - ✅ Successfully scrapes 44 champions across tiers S, 1, 2, 3, 4
   - ✅ Extracts champion names and tier rankings
   - ✅ Gets legend page URLs for each champion

2. **Champion Legend Pages** (e.g., `https://riftbound.gg/legends/draven/`)
   - ❌ Deck cards are NOT in initial HTML
   - ✅ Has `RootOfEmbeddedDeck` elements with `data-deck` attributes
   - ❌ Card links are loaded dynamically via JavaScript
   - Example: `data-deck="draven-wins-bologna"`

3. **Individual Deck Pages** (`https://riftbound.gg/decks/{deck-slug}`)
   - ❌ Also uses JavaScript rendering
   - ❌ No card links in initial HTML (only 2 navigation menu links)
   - ❌ Cannot be scraped without headless browser

### Technical Details

```
Test Results:
- Champions found on tier list: 44 ✅
- Deck elements found on legend pages: 2 per page ✅
- Card links extracted: 0 ❌
- Reason: Client-side rendering (JavaScript)
```

### Why This Matters

**Client-Side Rendering Limitations:**
- Cheerio (our HTML parser) only sees initial HTML
- Deck card data is fetched and rendered by JavaScript after page load
- Would require headless browser (Puppeteer/Playwright) to extract
- Headless browsers are:
  - Resource-intensive (memory, CPU)
  - Slower (60-90 seconds for 44 pages)
  - More complex to maintain
  - Expensive on serverless platforms
  - Risk of being blocked/rate-limited

## Recommended Solution

### Hybrid Approach: RiftMana + Riftbound Tiers

**Use the best of both sources:**

1. **Riftbound.gg Tier List** → Champion tiers (S, A, B, C, D)
   - Already working ✅
   - Provides tier rankings for champions
   - Fast and reliable

2. **RiftMana.com API** → Actual card usage data
   - Already working ✅
   - Provides real deck lists with cards
   - Has champion information
   - API is fast and reliable

3. **Tier-Weighted Metrics** → Apply Riftbound tiers to RiftMana cards
   - Match RiftMana deck champions to Riftbound tiers
   - Calculate weighted scores: S=32, A=16, B=8, C=4, D=2
   - Show both raw % and weighted % in UI

### Implementation Plan

```typescript
// Pseudo-code for hybrid approach
1. Fetch Riftbound tier list → Get champion tiers
2. Fetch RiftMana decks → Get actual card lists
3. Create champion→tier mapping
4. For each RiftMana deck:
   - Look up champion's tier from Riftbound
   - Assign tier to all cards in that deck
5. Calculate weighted metrics using tier weights
6. Store with both raw and weighted percentages
```

### Benefits

✅ **Works with existing infrastructure** - No new dependencies
✅ **Fast** - Both sources are quick (API + simple scraping)
✅ **Reliable** - No JavaScript rendering issues
✅ **Accurate** - Real card data from RiftMana
✅ **Tier-aware** - Weighted by Riftbound tier rankings
✅ **Maintainable** - Simple, proven approach

### What We Keep

- ✅ Weighted metrics system (card-matcher.ts)
- ✅ Database migration with weighted columns
- ✅ UI showing dual percentages
- ✅ Tier-based weighting logic

### What We Change

- ❌ Remove riftbound-deck-scraper.ts (doesn't work)
- ✅ Use RiftMana API for card data (already working)
- ✅ Map RiftMana champions to Riftbound tiers
- ✅ Apply tier weights to RiftMana card data

## Alternative Approaches Considered

### 1. Headless Browser (Puppeteer/Playwright)
**Pros:** Would work, could extract JavaScript-rendered content
**Cons:** 
- Complex setup and maintenance
- Resource-intensive (memory, CPU)
- Slow (2-3 seconds per page × 44 pages = 90+ seconds)
- Expensive on serverless (Vercel)
- Risk of being blocked
- Overkill for this use case

**Verdict:** ❌ Not recommended

### 2. Find Riftbound API
**Pros:** Would be ideal if it exists
**Cons:**
- No public API found
- Tested multiple endpoints - all 404
- WordPress site, likely no API

**Verdict:** ❌ Not available

### 3. Parse Embedded JSON
**Pros:** Would be fast if data is embedded
**Cons:**
- Investigated script tags - no deck data found
- Data is fetched dynamically, not embedded

**Verdict:** ❌ Not feasible

## Conclusion

The **Hybrid Approach** (RiftMana cards + Riftbound tiers) is the best solution:
- Achieves the original goal (tier-weighted card metrics)
- Uses working, reliable data sources
- Fast and maintainable
- No complex dependencies
- Provides accurate, useful data to users

## Next Steps

1. Update `meta-aggregator.ts` to use hybrid approach
2. Test with real data
3. Verify weighted metrics are calculated correctly
4. Deploy and monitor

## Files to Update

- `lib/meta-data/meta-aggregator.ts` - Switch to hybrid approach
- Keep: `lib/meta-data/transformers/card-matcher.ts` - Weighted metrics logic
- Keep: `supabase/migrations/007_add_weighted_metrics.sql` - Database columns
- Keep: `components/PopularCards.tsx` - UI with dual percentages
- Archive: `lib/meta-data/sources/riftbound-deck-scraper.ts` - Doesn't work

---

**Investigation completed by:** Bob (AI Assistant)
**Date:** 2026-02-03
**Status:** Recommended solution identified