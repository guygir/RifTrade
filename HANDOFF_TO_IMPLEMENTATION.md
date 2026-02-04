# Implementation Handoff - Popular Decks & Cards Feature

## 🎯 Your Mission

Implement the **Popular Decks & Cards** feature for the Riftbound card swap app. All planning is complete - you need to execute the implementation following the detailed plans provided.

## 📚 Essential Reading (In Order)

1. **FEATURE_SUMMARY.md** - Start here for overview (5 min read)
2. **IMPLEMENTATION_QUICK_START.md** - Your main implementation guide (10 min read)
3. **POPULAR_DECKS_CARDS_PLAN.md** - Detailed specifications (reference as needed)
4. **POPULAR_DECKS_ARCHITECTURE.md** - System architecture (reference as needed)

## 🎬 What You Need to Do

### Phase 1: Week 1 - Research & Database Setup (START HERE)

#### Step 1: Investigate APIs (Priority)
```bash
# Check for public APIs on each site
# 1. RiftMana.com
curl https://riftmana.com/robots.txt
# Look for /api endpoints in browser dev tools

# 2. Riftbound.gg/tier-list
curl https://riftbound.gg/robots.txt
# Check for API endpoints

# 3. PiltoverArchive.com
curl https://piltoverarchive.com/robots.txt
# Check for API endpoints
```

**Document findings**: Create `API_INVESTIGATION_RESULTS.md` with:
- Which sites have public APIs
- Which require web scraping
- Rate limits (if any)
- Authentication requirements (if any)

#### Step 2: Create Database Migration
Create file: `supabase/migrations/006_add_meta_tables.sql`

```sql
-- Meta snapshots table
CREATE TABLE IF NOT EXISTS meta_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,
  data_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Popular decks table
CREATE TABLE IF NOT EXISTS popular_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id UUID REFERENCES meta_snapshots(id) ON DELETE CASCADE,
  deck_name TEXT NOT NULL,
  deck_code TEXT,
  champions TEXT[],
  archetype TEXT,
  tier_rank TEXT,
  popularity_score INTEGER,
  view_count INTEGER,
  win_rate DECIMAL(5,2),
  price_usd DECIMAL(10,2),
  source_url TEXT,
  author TEXT,
  last_updated TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Popular cards table
CREATE TABLE IF NOT EXISTS popular_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id UUID REFERENCES meta_snapshots(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  usage_count INTEGER NOT NULL,
  usage_percentage DECIMAL(5,2),
  avg_copies DECIMAL(3,1),
  tier_distribution JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(snapshot_id, card_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meta_snapshots_date ON meta_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_popular_decks_snapshot ON popular_decks(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_popular_decks_tier ON popular_decks(tier_rank);
CREATE INDEX IF NOT EXISTS idx_popular_decks_popularity ON popular_decks(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_popular_cards_snapshot ON popular_cards(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_popular_cards_usage ON popular_cards(usage_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_popular_cards_card ON popular_cards(card_id);
```

#### Step 3: Install Dependencies
```bash
npm install cheerio zod
npm install -D @types/cheerio
```

#### Step 4: Add Environment Variables
Update `.env.local`:
```env
# Meta Data Configuration
META_UPDATE_ENABLED=true
META_CACHE_DURATION_HOURS=24
CRON_SECRET=generate_a_secure_random_string_here
```

### Phase 2: Week 2 - Data Fetching

Create the following files in order:

1. **lib/meta-data/sources/riftmana.ts** - RiftMana fetcher
2. **lib/meta-data/sources/riftbound-tiers.ts** - Riftbound tier list fetcher
3. **lib/meta-data/transformers/deck-normalizer.ts** - Normalize deck data
4. **lib/meta-data/transformers/card-extractor.ts** - Extract card usage
5. **lib/meta-data/meta-aggregator.ts** - Combine all sources
6. **lib/meta-data/cache-manager.ts** - Handle caching

See **IMPLEMENTATION_QUICK_START.md** for code examples.

### Phase 3: Week 3 - API Routes

Create these API routes:

1. **app/api/meta/decks/route.ts** - GET popular decks
2. **app/api/meta/cards/route.ts** - GET popular cards
3. **app/api/meta/refresh/route.ts** - POST trigger update (protected)

### Phase 4: Week 4 - UI Components

1. **components/PopularDecks.tsx** - Display on main page
2. **components/PopularCards.tsx** - Display on cards page
3. Update **app/page.tsx** - Add PopularDecks component
4. Update **app/cards/page.tsx** - Add PopularCards component

### Phase 5: Cron Job Setup

Create **vercel.json** in project root:
```json
{
  "crons": [{
    "path": "/api/meta/refresh",
    "schedule": "0 6 * * *"
  }]
}
```

## 📋 Your Todo List

Follow the 32-item todo list that's already been created. Mark items as complete as you go.

## 🎯 Key Principles

1. **Start with APIs** - Always check for public APIs before scraping
2. **Respect robots.txt** - Be a good web citizen
3. **Cache aggressively** - 24-hour cache to minimize requests
4. **Handle errors gracefully** - One source failure shouldn't break everything
5. **Test incrementally** - Test each component before moving to the next
6. **Log everything** - Comprehensive logging helps debug issues

## 🔍 Testing Strategy

After each phase:
```bash
# Test data fetching
npm run dev
curl http://localhost:3000/api/meta/refresh -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test API endpoints
curl http://localhost:3000/api/meta/decks?tier=S&limit=10
curl http://localhost:3000/api/meta/cards?limit=20

# Check database
# In Supabase dashboard:
SELECT * FROM meta_snapshots ORDER BY snapshot_date DESC LIMIT 1;
SELECT * FROM popular_decks LIMIT 10;
SELECT * FROM popular_cards ORDER BY usage_percentage DESC LIMIT 10;
```

## 📊 Data Sources (Priority Order)

1. **RiftMana.com** ⭐ Primary
   - URL: https://riftmana.com/decks/
   - Data: Trending decks, prices, archetypes, view counts
   - Status: Accessible, no CAPTCHA

2. **Riftbound.gg/tier-list** ⭐ Primary
   - URL: https://riftbound.gg/tier-list/
   - Data: S/T1/T2/T3 tier rankings
   - Status: Accessible, reliable

3. **PiltoverArchive.com** 🔄 Secondary
   - URL: https://piltoverarchive.com/decks
   - Data: Tournament results, deck lists
   - Status: Accessible, good structure

## ⚠️ Important Notes

- **Mode**: You should be in **Code mode** for implementation
- **Cost**: Start fresh with $0 cost
- **Documentation**: All planning is complete, focus on execution
- **Questions**: Refer to the planning docs first, they're comprehensive
- **Incremental**: Work step-by-step, test each component
- **Commit often**: Make small, focused commits

## 🚀 Success Criteria

- [ ] Database migration applied successfully
- [ ] Data fetching works from at least 2 sources
- [ ] API routes return correct data
- [ ] UI components display on main and cards pages
- [ ] Cron job configured (even if not deployed yet)
- [ ] Error handling works gracefully
- [ ] Code is clean and well-documented

## 📞 If You Get Stuck

1. Check **IMPLEMENTATION_QUICK_START.md** for code examples
2. Review **POPULAR_DECKS_CARDS_PLAN.md** for detailed specs
3. Look at **POPULAR_DECKS_ARCHITECTURE.md** for system design
4. Test each component independently
5. Check error logs for specific issues

## 🎓 Project Context

This is a **Riftbound TCG card swap app** built with:
- **Next.js 14** (App Router)
- **TypeScript**
- **Supabase** (PostgreSQL database)
- **Tailwind CSS**
- **React**

The app helps users trade Riftbound cards by maintaining have/want lists and finding matches. This new feature adds meta insights to help users make informed trading decisions.

## 📁 Key Existing Files to Reference

- `lib/riftcodex.ts` - Example of API client implementation
- `lib/supabase/client.ts` - Supabase client setup
- `app/cards/page.tsx` - Example of data fetching and display
- `components/Navigation.tsx` - Example component structure

## 🎯 Your First Task

**Start by investigating APIs:**
1. Open browser dev tools
2. Visit https://riftmana.com/decks/
3. Check Network tab for API calls
4. Look for JSON responses
5. Document findings in `API_INVESTIGATION_RESULTS.md`

Then proceed with database migration.

**Good luck! You have everything you need to succeed.** 🚀

---

**Handoff Date**: January 30, 2026  
**Planning Cost**: $1.14  
**Implementation Mode**: Code  
**Estimated Time**: 4 weeks (80-100 hours)