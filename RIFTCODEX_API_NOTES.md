# Riftcodex API Integration Notes

## ✅ API Documentation Found

Based on the official documentation at [https://riftcodex.com/docs/category/riftcodex-api](https://riftcodex.com/docs/category/riftcodex-api), the following endpoints are available:

## API Endpoints

### Cards
- **GET /cards** - Get all cards
- **GET /cards/:id** - Get card by ID
- **GET /cards/name** - Get cards by name

### Sets
- **GET /sets** - Get all sets
- **GET /sets/:id** - Get set by ID
- **GET /sets/tcgplayer/:tcgplayer_id** - Get set by TCGPlayer ID
- **GET /sets/cardmarket/:cardmarket_id** - Get set by Cardmarket ID

### Index
- **GET /index/artists** - Get all artists

## Base URL

The base URL is likely one of:
- `https://riftcodex.com/api` (most common pattern)
- `https://api.riftcodex.com` (alternative pattern)

The client tries both automatically.

## Implementation Status

✅ **Updated**: The `lib/riftcodex.ts` file has been updated with:
- Correct endpoint structure based on documentation
- Primary approach: GET /cards to fetch all cards
- Fallback approach: GET /sets, then GET /sets/:id for each set
- Flexible field name handling in transformation function
- Multiple base URL attempts

## Testing the API

1. **Set environment variable** (optional):
   ```env
   RIFTCODEX_API_URL=https://riftcodex.com/api
   ```
   Or let it auto-detect.

2. **Run the seeding script**:
   ```bash
   npm run seed
   ```
   Or:
   ```bash
   npx tsx scripts/seed-cards.ts
   ```

3. **Check the console output** for:
   - Success: "Fetched X cards from Riftcodex"
   - Errors: Will show which URLs were tried and what failed

4. **Verify in database**:
   - Check Supabase dashboard → Table Editor → cards table
   - Should see all cards populated

## Response Format Handling

The client handles multiple possible response formats:
- Direct array: `[{card1}, {card2}, ...]`
- Wrapped in cards: `{ cards: [{card1}, {card2}, ...] }`
- Wrapped in data: `{ data: [{card1}, {card2}, ...] }`

## Card Field Mapping

The transformation function handles various field name variations:
- **Set code**: `set_code`, `set`, `setId`
- **Collector number**: `collector_number`, `number`, `collectorNumber`
- **Image URL**: `image_url`, `image`, `imageUrl`, `imageUrlFull`
- **Rarity**: `rarity`, `rarityName`

## Troubleshooting

If seeding fails:
1. Check network connectivity
2. Verify the API is accessible (try in browser)
3. Check console logs for specific error messages
4. Try setting `RIFTCODEX_API_URL` explicitly
5. The client will automatically try fallback methods

## Documentation Links

- Main API Docs: https://riftcodex.com/docs/category/riftcodex-api
- Get Cards: https://riftcodex.com/docs/riftcodex/get-cards-api-cards-get
- Get Sets: https://riftcodex.com/docs/riftcodex/get-sets-api-sets-get

