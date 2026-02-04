# Popular Decks & Cards - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
├─────────────────────────────────────────────────────────────────┤
│  Main Page                    │  Cards Page                      │
│  ┌──────────────────────┐    │  ┌──────────────────────┐       │
│  │ Popular Decks        │    │  │ Popular Cards        │       │
│  │ - Tier badges        │    │  │ - Usage stats        │       │
│  │ - Deck previews      │    │  │ - Card images        │       │
│  │ - Filters (S/1/2/3)  │    │  │ - Tier distribution  │       │
│  └──────────────────────┘    │  └──────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  GET /api/meta/decks      │  GET /api/meta/cards               │
│  - Query by tier          │  - Query by usage                   │
│  - Filter by archetype    │  - Filter by tier                   │
│  - Pagination             │  - Pagination                       │
│                           │                                     │
│  POST /api/meta/refresh   │                                     │
│  - Manual trigger         │                                     │
│  - Force update           │                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CACHING LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Cache Manager                                                   │
│  - Check cache validity (24 hours)                              │
│  - Return cached data if valid                                  │
│  - Trigger update if stale                                      │
│  - Store in meta_snapshots table                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATA AGGREGATION LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Meta Aggregator                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Fetch from all sources in parallel                   │   │
│  │ 2. Normalize data structures                            │   │
│  │ 3. Merge and deduplicate                                │   │
│  │ 4. Calculate popularity scores                          │   │
│  │ 5. Extract card usage statistics                        │   │
│  │ 6. Store in database                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  RiftMana.com    │ │ Riftbound.gg     │ │ PiltoverArchive  │
│  Fetcher         │ │ Tier List        │ │ Fetcher          │
│                  │ │ Fetcher          │ │                  │
│ - Trending decks │ │ - S/T1/T2/T3     │ │ - Tournament     │
│ - Prices         │ │ - Meta rankings  │ │   results        │
│ - View counts    │ │ - Update dates   │ │ - View counts    │
│ - Archetypes     │ │ - Champion pairs │ │ - Deck lists     │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ meta_snapshots   │  │ popular_decks    │  │ popular_cards│ │
│  │ - id             │  │ - id             │  │ - id         │ │
│  │ - source         │  │ - snapshot_id    │  │ - snapshot_id│ │
│  │ - snapshot_date  │  │ - deck_name      │  │ - card_id    │ │
│  │ - data_hash      │  │ - tier_rank      │  │ - usage_%    │ │
│  └──────────────────┘  │ - popularity     │  │ - avg_copies │ │
│                        │ - metadata       │  │ - tier_dist  │ │
│                        └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUTOMATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Daily Cron Job (6 AM UTC)                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Trigger /api/meta/refresh                            │   │
│  │ 2. Fetch latest data from all sources                   │   │
│  │ 3. Update database with new snapshot                    │   │
│  │ 4. Log results and errors                               │   │
│  │ 5. Send alerts if failures occur                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Options:                                                        │
│  - Vercel Cron (vercel.json)                                   │
│  - GitHub Actions (.github/workflows/update-meta.yml)          │
│  - Supabase Edge Functions                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐
│ Cron Trigger│
│  (Daily)    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Check if update needed                  │
│ (Last snapshot > 24 hours old?)         │
└──────┬──────────────────────────────────┘
       │ Yes
       ▼
┌─────────────────────────────────────────┐
│ Parallel Fetch from Sources             │
├─────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │RiftMana │ │Riftbound│ │Piltover │   │
│ │  API/   │ │  Tier   │ │ Archive │   │
│ │ Scraper │ │  List   │ │  API/   │   │
│ └────┬────┘ └────┬────┘ └────┬────┘   │
└──────┼───────────┼───────────┼─────────┘
       │           │           │
       └───────────┼───────────┘
                   ▼
┌─────────────────────────────────────────┐
│ Data Transformation                     │
├─────────────────────────────────────────┤
│ 1. Normalize deck structures            │
│    - Standardize deck names             │
│    - Extract champion pairs             │
│    - Parse archetypes                   │
│                                         │
│ 2. Calculate popularity scores          │
│    - Weight by tier (S=100, T1=75...)  │
│    - Factor in view counts              │
│    - Consider recency                   │
│                                         │
│ 3. Extract card usage                   │
│    - Parse deck lists                   │
│    - Match to card database             │
│    - Count occurrences                  │
│    - Calculate percentages              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Create Meta Snapshot                    │
├─────────────────────────────────────────┤
│ INSERT INTO meta_snapshots              │
│ - Generate snapshot ID                  │
│ - Record source and timestamp           │
│ - Calculate data hash                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Store Popular Decks                     │
├─────────────────────────────────────────┤
│ INSERT INTO popular_decks               │
│ - Link to snapshot_id                   │
│ - Store deck metadata                   │
│ - Save tier rankings                    │
│ - Record popularity metrics             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Store Popular Cards                     │
├─────────────────────────────────────────┤
│ INSERT INTO popular_cards               │
│ - Link to snapshot_id                   │
│ - Link to card_id                       │
│ - Calculate usage statistics            │
│ - Store tier distribution               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Update Complete                         │
│ - Log success                           │
│ - Cache invalidated                     │
│ - Ready for user requests               │
└─────────────────────────────────────────┘
```

## Component Interaction Flow

```
User visits Main Page
       │
       ▼
┌─────────────────────────────────────────┐
│ PopularDecks Component Loads            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Call: GET /api/meta/decks               │
│ Params: { tier: 'all', limit: 8 }      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ API Route Handler                       │
├─────────────────────────────────────────┤
│ 1. Check cache validity                 │
│ 2. Query latest snapshot                │
│ 3. Join with popular_decks              │
│ 4. Apply filters and sorting            │
│ 5. Return JSON response                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Component Renders                       │
├─────────────────────────────────────────┤
│ - Display deck cards in grid            │
│ - Show tier badges (S/1/2/3)           │
│ - Display popularity metrics            │
│ - Add filter controls                   │
│ - Show "Last updated" timestamp         │
└─────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────┐
│ Data Fetch Initiated                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Try: Fetch from RiftMana                │
└──────┬──────────────────────────────────┘
       │
       ├─ Success ──────────────────┐
       │                            │
       └─ Error ──┐                 │
                  ▼                 │
         ┌────────────────┐         │
         │ Log Error      │         │
         │ Continue with  │         │
         │ other sources  │         │
         └────────────────┘         │
                                    │
       ┌────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Try: Fetch from Riftbound               │
└──────┬──────────────────────────────────┘
       │
       ├─ Success ──────────────────┐
       │                            │
       └─ Error ──┐                 │
                  ▼                 │
         ┌────────────────┐         │
         │ Log Error      │         │
         │ Continue       │         │
         └────────────────┘         │
                                    │
       ┌────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Aggregate Results                       │
├─────────────────────────────────────────┤
│ If all sources failed:                  │
│   - Use cached data (if available)      │
│   - Show error message to user          │
│   - Log critical error                  │
│                                         │
│ If partial success:                     │
│   - Use available data                  │
│   - Log warning                         │
│   - Show data with disclaimer           │
└─────────────────────────────────────────┘
```

## Database Relationships

```
┌──────────────────────┐
│   meta_snapshots     │
│──────────────────────│
│ id (PK)              │
│ source               │
│ snapshot_date        │
│ data_hash            │
│ created_at           │
└──────────┬───────────┘
           │
           │ 1:N
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌──────────────────────┐    ┌──────────────────────┐
│   popular_decks      │    │   popular_cards      │
│──────────────────────│    │──────────────────────│
│ id (PK)              │    │ id (PK)              │
│ snapshot_id (FK) ────┘    │ snapshot_id (FK) ────┘
│ deck_name            │    │ card_id (FK) ────────┐
│ champions[]          │    │ usage_count          │
│ archetype            │    │ usage_percentage     │
│ tier_rank            │    │ avg_copies           │
│ popularity_score     │    │ tier_distribution    │
│ view_count           │    │ metadata             │
│ metadata             │    └──────────────────────┘
└──────────────────────┘                │
                                        │ N:1
                                        │
                                        ▼
                              ┌──────────────────────┐
                              │       cards          │
                              │──────────────────────│
                              │ id (PK)              │
                              │ name                 │
                              │ set_code             │
                              │ collector_number     │
                              │ image_url            │
                              │ rarity               │
                              └──────────────────────┘
```

## Caching Strategy

```
Request Flow with Caching:

User Request
    │
    ▼
┌─────────────────────────────────────────┐
│ Check Latest Snapshot                   │
│ SELECT * FROM meta_snapshots            │
│ ORDER BY snapshot_date DESC LIMIT 1     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Is snapshot < 24 hours old?             │
└──────┬──────────────────────────────────┘
       │
       ├─ YES ──────────────────────┐
       │                            │
       └─ NO ──┐                    │
               ▼                    │
      ┌────────────────┐            │
      │ Trigger Update │            │
      │ (Background)   │            │
      │ Return old data│            │
      └────────────────┘            │
                                    │
       ┌────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Return Cached Data                      │
│ - Fast response                         │
│ - No external API calls                 │
│ - Consistent data                       │
└─────────────────────────────────────────┘
```

## Security Considerations

```
┌─────────────────────────────────────────┐
│ API Route Protection                    │
├─────────────────────────────────────────┤
│ Public Routes:                          │
│ - GET /api/meta/decks                   │
│ - GET /api/meta/cards                   │
│   → No authentication required          │
│   → Rate limited per IP                 │
│                                         │
│ Protected Routes:                       │
│ - POST /api/meta/refresh                │
│   → Requires CRON_SECRET header         │
│   → Only callable by cron job           │
│   → Logs all access attempts            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Scraping Best Practices                 │
├─────────────────────────────────────────┤
│ - Respect robots.txt                    │
│ - Use appropriate User-Agent            │
│ - Implement rate limiting (1-2s delay)  │
│ - Cache aggressively                    │
│ - Handle errors gracefully              │
│ - Don't overwhelm target servers        │
└─────────────────────────────────────────┘
```

## Monitoring & Logging

```
┌─────────────────────────────────────────┐
│ Logging Strategy                        │
├─────────────────────────────────────────┤
│ INFO Level:                             │
│ - Successful data fetches               │
│ - Cache hits/misses                     │
│ - Update completion                     │
│                                         │
│ WARN Level:                             │
│ - Partial source failures               │
│ - Slow response times                   │
│ - Data validation issues                │
│                                         │
│ ERROR Level:                            │
│ - All sources failed                    │
│ - Database errors                       │
│ - Critical failures                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Metrics to Track                        │
├─────────────────────────────────────────┤
│ - Update success rate                   │
│ - Average update duration               │
│ - Cache hit rate                        │
│ - API response times                    │
│ - Error frequency by source             │
│ - Data freshness                        │
└─────────────────────────────────────────┘
```

---

**Last Updated**: January 30, 2026
**Version**: 1.0