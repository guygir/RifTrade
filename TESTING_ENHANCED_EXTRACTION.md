# Testing Enhanced Card Extraction Locally

## Prerequisites

1. ✅ Docker Desktop running (for Supabase local)
2. ✅ Node.js and npm installed
3. ✅ All dependencies installed (`npm install`)
4. ✅ Environment variables configured (`.env.local`)

## Step-by-Step Testing Guide

### Step 1: Apply Database Migration

```bash
# Start Supabase local (if not running)
npx supabase start

# Apply the new migration
npx supabase db reset
```

This will apply migration `007_add_weighted_metrics.sql` which adds:
- `weighted_score` column
- `weighted_percentage` column
- Performance indexes

### Step 2: Run Unit Tests

```bash
# Test the new scrapers and matchers
npx tsx scripts/test-enhanced-card-extraction.ts
```

**Expected Output:**
```
============================================================
ENHANCED CARD EXTRACTION TEST
============================================================

TEST 1: Riftbound Deck Scraper
------------------------------------------------------------
Testing Riftbound deck scraper...
✅ Success! Found 40-44 champion decks
Total unique cards: 30-40
Total card instances: 200-300
Decks by tier: { S: 8, '1': 12, '2': 10, '3': 8, '4': 6 }
✅ Deck scraper test passed

TEST 2: Card Matcher
------------------------------------------------------------
Testing card matcher...
Parsing tests:
  ogn-036 -> set: ogn, num: 036
  OGN-001 -> set: ogn, num: 001
  ...
Matching test:
Matched 2 cards
✅ Card matcher test passed

============================================================
TEST COMPLETE
============================================================
```

### Step 3: Start Development Server

```bash
npm run dev
```

Server should start at `http://localhost:3000`

### Step 4: Trigger Data Refresh

**Option A: Using API endpoint**
```bash
# POST to refresh endpoint (requires CRON_SECRET)
curl -X POST http://localhost:3000/api/meta/refresh \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Option B: Using browser**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:
```javascript
fetch('/api/meta/refresh', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_CRON_SECRET'
  }
}).then(r => r.json()).then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Meta data aggregation complete",
  "snapshotId": "uuid-here",
  "decksCount": 44,
  "cardsCount": 35,
  "duration": "62.5s"
}
```

**Note:** This will take 60-90 seconds as it scrapes all champion pages.

### Step 5: Verify Homepage

Visit: `http://localhost:3000`

**What to Check:**
- ✅ "Popular Decks by Tier" section shows S, A, B tiers
- ✅ Decks display with champion names
- ✅ Tier labels show S, A, B (not 1, 2)
- ✅ Images load correctly

### Step 6: Verify Cards Page

Visit: `http://localhost:3000/cards`

**What to Check:**
- ✅ "Popular Cards" section is collapsible (starts minimized)
- ✅ Click to expand shows 30-40+ cards (not just 7)
- ✅ Each card shows **dual percentages**:
  - Top: Raw percentage (white) e.g., "45.0%"
  - Bottom: Weighted percentage (yellow with ⚡) e.g., "⚡68.0%"
- ✅ No runes displayed (filtered out)
- ✅ Tier distribution shows S/A/B labels (not 1/2)
- ✅ Hover tooltips explain metrics

### Step 7: Verify API Endpoints

**Test Cards Endpoint:**
```bash
curl http://localhost:3000/api/meta/cards?limit=10
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "card_id": "uuid",
      "usage_count": 20,
      "usage_percentage": 45.45,
      "weighted_score": 480.00,
      "weighted_percentage": 68.18,
      "tier_distribution": {
        "S": 8,
        "1": 7,
        "2": 3,
        "3": 2
      },
      "cards": {
        "id": "uuid",
        "name": "Vi",
        "rarity": "Champion",
        "set_code": "ogn",
        "collector_number": "036",
        "image_url": "https://..."
      }
    }
  ],
  "cache": {
    "age_hours": 0.5,
    "age_formatted": "30 minutes ago"
  }
}
```

**Test Decks Endpoint:**
```bash
curl http://localhost:3000/api/meta/decks?limit=10
```

### Step 8: Verify Database

**Check popular_cards table:**
```sql
SELECT 
  c.name,
  pc.usage_count,
  pc.usage_percentage,
  pc.weighted_score,
  pc.weighted_percentage,
  pc.tier_distribution
FROM popular_cards pc
JOIN cards c ON c.id = pc.card_id
ORDER BY pc.weighted_percentage DESC
LIMIT 10;
```

**Expected Results:**
- 30-40 rows
- All have weighted_score and weighted_percentage values
- Weighted percentages are higher for cards in S/A tiers
- Tier distribution shows counts per tier

## Comparison: Before vs After

### Before Enhancement
```
Popular Cards: 7 cards
- Only champion names
- Single percentage (raw)
- No tier weighting
- Example: "Vi - 45%"
```

### After Enhancement
```
Popular Cards: 35 cards
- Full deck card lists
- Dual percentages (raw + weighted)
- Tier-weighted importance
- Example: "Vi - 45% / ⚡68%"
```

## Troubleshooting

### Issue: No cards showing
**Solution:** 
1. Check if refresh completed successfully
2. Verify database migration applied
3. Check browser console for errors

### Issue: Only 7 cards (old system)
**Solution:**
1. Clear browser cache
2. Verify meta-aggregator.ts is using new scraper
3. Check API response includes weighted_percentage

### Issue: Scraping fails
**Solution:**
1. Check internet connection
2. Verify Riftbound.gg is accessible
3. Check rate limiting (1.5s delays)
4. Review error logs in terminal

### Issue: Weighted percentages missing
**Solution:**
1. Verify migration 007 applied
2. Check database schema has new columns
3. Refresh data again

## Performance Benchmarks

- **Scraping Time**: 60-90 seconds (44 champions × 1.5s delay)
- **Database Queries**: ~5 queries (optimized batch)
- **Memory Usage**: ~50MB during scraping
- **API Response Time**: <100ms (cached)

## Success Criteria

✅ All tests pass
✅ 30-40+ cards displayed (not 7)
✅ Dual percentages visible (raw + weighted)
✅ Yellow ⚡ icon shows weighted %
✅ No runes in card list
✅ Tier labels show S/A/B
✅ Database has weighted columns
✅ API returns weighted_percentage field

## Next Steps After Local Testing

1. ✅ Verify all features work locally
2. 📝 Document any issues found
3. 🚀 Deploy to production
4. 🔍 Monitor production performance
5. 📊 Gather user feedback

---

**Need Help?**
- Check logs in terminal
- Review ENHANCED_CARD_EXTRACTION_SUMMARY.md
- Check ENHANCED_CARD_EXTRACTION_PLAN.md for technical details

*Made with Bob - 2026-02-03*