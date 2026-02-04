# Popular Decks & Cards - Quick Start Implementation Guide

## 🎯 Goal
Add popular/successful decks and cards from the current meta to the main page and cards page, with daily automatic updates.

## 📊 Data Sources (Prioritized)

### ⭐ Primary Sources
1. **RiftMana.com** - Trending decks with prices, archetypes, view counts
2. **Riftbound.gg/tier-list** - Official meta tier rankings (S/T1/T2/T3)

### 🔄 Secondary Source
3. **PiltoverArchive.com** - Tournament results and deck lists

## 🗂️ Database Schema Summary

```sql
-- Track when data was fetched
meta_snapshots (id, source, snapshot_date, data_hash)

-- Store popular decks
popular_decks (id, snapshot_id, deck_name, champions[], tier_rank, 
               popularity_score, view_count, price_usd, metadata)

-- Store popular cards (derived from decks)
popular_cards (id, snapshot_id, card_id, usage_count, 
               usage_percentage, avg_copies, tier_distribution)
```

## 🏗️ Project Structure

```
lib/
  meta-data/
    sources/
      riftmana.ts              # RiftMana fetcher
      riftbound-tiers.ts       # Riftbound tier list fetcher
      piltover.ts              # PiltoverArchive fetcher (optional)
    transformers/
      deck-normalizer.ts       # Normalize deck data
      card-extractor.ts        # Extract card usage from decks
    meta-aggregator.ts         # Combine all sources
    cache-manager.ts           # Handle 24-hour caching

app/api/
  meta/
    decks/route.ts             # GET popular decks
    cards/route.ts             # GET popular cards
    refresh/route.ts           # POST trigger update (protected)

components/
  PopularDecks.tsx             # Display on main page
  PopularCards.tsx             # Display on cards page

supabase/migrations/
  006_add_meta_tables.sql      # New tables for meta data
```

## 📝 Implementation Steps (4 Weeks)

### Week 1: Research & Database Setup
```bash
# 1. Check for APIs (check robots.txt, look for /api endpoints)
curl https://riftmana.com/robots.txt
curl https://riftbound.gg/robots.txt

# 2. Create database migration
# File: supabase/migrations/006_add_meta_tables.sql

# 3. Install dependencies
npm install cheerio zod
npm install -D @types/cheerio
```

### Week 2: Data Fetching
```typescript
// 1. Implement RiftMana fetcher
// lib/meta-data/sources/riftmana.ts
export async function fetchRiftManaDecks() {
  // Check for API first, fallback to scraping
  // Return normalized deck data
}

// 2. Implement Riftbound tier list fetcher
// lib/meta-data/sources/riftbound-tiers.ts
export async function fetchRiftboundTiers() {
  // Fetch tier list data
  // Return tier rankings
}

// 3. Create aggregator
// lib/meta-data/meta-aggregator.ts
export async function aggregateMetaData() {
  // Fetch from all sources in parallel
  // Normalize and merge data
  // Calculate popularity scores
  // Extract card usage
  // Store in database
}
```

### Week 3: API & Caching
```typescript
// 1. Create API routes
// app/api/meta/decks/route.ts
export async function GET(request: Request) {
  // Check cache (24 hours)
  // Query popular_decks
  // Return JSON
}

// 2. Create refresh endpoint
// app/api/meta/refresh/route.ts
export async function POST(request: Request) {
  // Verify CRON_SECRET
  // Trigger meta data update
  // Return status
}

// 3. Set up cron job
// vercel.json
{
  "crons": [{
    "path": "/api/meta/refresh",
    "schedule": "0 6 * * *"
  }]
}
```

### Week 4: UI Components
```typescript
// 1. Create PopularDecks component
// components/PopularDecks.tsx
export function PopularDecks() {
  // Fetch from /api/meta/decks
  // Display in grid with tier badges
  // Add filters (S/1/2/3)
}

// 2. Create PopularCards component
// components/PopularCards.tsx
export function PopularCards() {
  // Fetch from /api/meta/cards
  // Display with usage stats
  // Show tier distribution
}

// 3. Integrate into pages
// app/page.tsx - Add <PopularDecks />
// app/cards/page.tsx - Add <PopularCards />
```

## 🔑 Key Files to Create

### 1. Database Migration
```sql
-- supabase/migrations/006_add_meta_tables.sql
CREATE TABLE meta_snapshots (...);
CREATE TABLE popular_decks (...);
CREATE TABLE popular_cards (...);
CREATE INDEX idx_popular_decks_tier ON popular_decks(tier_rank);
-- See POPULAR_DECKS_CARDS_PLAN.md for full schema
```

### 2. Environment Variables
```env
# .env.local
META_UPDATE_ENABLED=true
META_CACHE_DURATION_HOURS=24
CRON_SECRET=your_secret_here
```

### 3. Fetcher Service
```typescript
// lib/meta-data/sources/riftmana.ts
import * as cheerio from 'cheerio';

export async function fetchRiftManaDecks() {
  // 1. Try API endpoint first
  try {
    const response = await fetch('https://riftmana.com/api/decks');
    if (response.ok) return await response.json();
  } catch (e) {
    console.log('No API, falling back to scraping');
  }
  
  // 2. Fallback to scraping
  const html = await fetch('https://riftmana.com/decks/').then(r => r.text());
  const $ = cheerio.load(html);
  
  // 3. Parse HTML and extract deck data
  const decks = [];
  $('.deck-card').each((i, el) => {
    decks.push({
      name: $(el).find('.deck-name').text(),
      price: parsePrice($(el).find('.price').text()),
      // ... extract other fields
    });
  });
  
  return decks;
}
```

### 4. API Route
```typescript
// app/api/meta/decks/route.ts
import { createSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier') || 'all';
  const limit = parseInt(searchParams.get('limit') || '20');
  
  const supabase = createSupabaseClient();
  
  // Get latest snapshot
  const { data: snapshot } = await supabase
    .from('meta_snapshots')
    .select('id, snapshot_date')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();
  
  if (!snapshot) {
    return Response.json({ error: 'No data available' }, { status: 404 });
  }
  
  // Check if data is stale (> 24 hours)
  const isStale = Date.now() - new Date(snapshot.snapshot_date).getTime() > 24 * 60 * 60 * 1000;
  
  // Query popular decks
  let query = supabase
    .from('popular_decks')
    .select('*')
    .eq('snapshot_id', snapshot.id)
    .order('popularity_score', { ascending: false })
    .limit(limit);
  
  if (tier !== 'all') {
    query = query.eq('tier_rank', tier);
  }
  
  const { data: decks, error } = await query;
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json({
    decks,
    snapshot_date: snapshot.snapshot_date,
    is_stale: isStale
  });
}
```

### 5. UI Component
```typescript
// components/PopularDecks.tsx
'use client';

import { useEffect, useState } from 'react';

interface Deck {
  id: string;
  deck_name: string;
  tier_rank: string;
  popularity_score: number;
  champions: string[];
  price_usd: number;
}

export function PopularDecks() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState('all');
  
  useEffect(() => {
    fetchDecks();
  }, [selectedTier]);
  
  const fetchDecks = async () => {
    setLoading(true);
    const response = await fetch(`/api/meta/decks?tier=${selectedTier}&limit=8`);
    const data = await response.json();
    setDecks(data.decks || []);
    setLoading(false);
  };
  
  if (loading) {
    return <div>Loading popular decks...</div>;
  }
  
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-4">Popular Meta Decks</h2>
      
      {/* Tier Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'S', '1', '2', '3'].map(tier => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={`px-4 py-2 rounded ${
              selectedTier === tier 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            {tier === 'all' ? 'All' : `Tier ${tier}`}
          </button>
        ))}
      </div>
      
      {/* Deck Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {decks.map(deck => (
          <div 
            key={deck.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            {/* Tier Badge */}
            <div className={`inline-block px-2 py-1 rounded text-sm font-bold mb-2 ${
              deck.tier_rank === 'S' ? 'bg-red-500 text-white' :
              deck.tier_rank === '1' ? 'bg-orange-500 text-white' :
              deck.tier_rank === '2' ? 'bg-yellow-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              Tier {deck.tier_rank}
            </div>
            
            {/* Deck Name */}
            <h3 className="font-semibold mb-2">{deck.deck_name}</h3>
            
            {/* Champions */}
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {deck.champions.join(' + ')}
            </div>
            
            {/* Price */}
            {deck.price_usd && (
              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                ${deck.price_usd.toFixed(2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🚀 Deployment Checklist

- [ ] Database migration applied to production
- [ ] Environment variables set in Vercel/hosting
- [ ] Cron job configured (vercel.json)
- [ ] Initial data fetch completed
- [ ] UI components integrated
- [ ] Error handling tested
- [ ] Performance verified
- [ ] Documentation updated

## 🔍 Testing Commands

```bash
# Test data fetching
npm run dev
curl http://localhost:3000/api/meta/refresh -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test API endpoints
curl http://localhost:3000/api/meta/decks?tier=S&limit=10
curl http://localhost:3000/api/meta/cards?limit=20

# Check database
# In Supabase dashboard, run:
SELECT * FROM meta_snapshots ORDER BY snapshot_date DESC LIMIT 1;
SELECT * FROM popular_decks LIMIT 10;
SELECT * FROM popular_cards ORDER BY usage_percentage DESC LIMIT 10;
```

## 📚 Reference Documents

- **POPULAR_DECKS_CARDS_PLAN.md** - Detailed implementation plan
- **POPULAR_DECKS_ARCHITECTURE.md** - System architecture diagrams
- **README.md** - Update with new feature documentation

## ⚠️ Important Notes

1. **Respect robots.txt** - Always check before scraping
2. **Rate limiting** - Add 1-2 second delays between requests
3. **Error handling** - Gracefully handle source failures
4. **Caching** - Use 24-hour cache to minimize requests
5. **User-Agent** - Use appropriate User-Agent string
6. **Monitoring** - Log all fetch operations and errors

## 🎨 UI Design Considerations

- Show "Last updated: X hours ago" timestamp
- Add loading skeletons for better UX
- Make tier badges visually distinct (colors)
- Display deck prices prominently
- Show champion combinations clearly
- Add filter/sort options
- Make cards clickable for more details
- Responsive design for mobile

## 🔄 Update Frequency

- **Automatic**: Daily at 6 AM UTC via cron job
- **Manual**: Admin can trigger via API endpoint
- **Cache**: 24-hour validity period
- **Fallback**: Use cached data if fetch fails

---

**Ready to implement?** Start with Week 1 tasks and work through systematically!