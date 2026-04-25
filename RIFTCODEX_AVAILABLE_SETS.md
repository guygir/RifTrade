# Riftcodex Available Sets

This document lists all sets currently available in the Riftcodex API as of the last check.

## Available Sets (7 Total)

### 1. **JDG** - Riftbound Judge Promotional Cards
- **ID**: `69bc5bf6e195be3e561d1eb0`
- **Card Count**: 1
- **Type**: Promotional/Judge

### 2. **OGN** - Origins
- **ID**: `69bc5bf6e195be3e561d1eb1`
- **Card Count**: 352
- **Type**: Main Set
- **Status**: ✅ Currently used in Riftle

### 3. **OGS** - Origins: Proving Grounds
- **ID**: `69bc5bf6e195be3e561d1eb2`
- **Card Count**: 24
- **Type**: Expansion/Supplement

### 4. **OPP** - Riftbound Organized Play Promotional Cards
- **ID**: `69bc5bf6e195be3e561d1eb3`
- **Card Count**: 107
- **Type**: Promotional/Organized Play

### 5. **PR** - Riftbound Promotional Cards
- **ID**: `69bc5bf6e195be3e561d1eb4`
- **Card Count**: 12
- **Type**: Promotional

### 6. **SFD** - Spiritforged
- **ID**: `69bc5bf6e195be3e561d1eaf`
- **Card Count**: 288
- **Type**: Main Set
- **Status**: ✅ Currently used in Riftle

### 7. **UNL** - Unleashed
- **ID**: `69bc5bf6e195be3e561d1eae`
- **Card Count**: 280
- **Type**: Main Set
- **Status**: ⚠️ Not yet integrated in Riftle

## Set Categories

### Main Sets (3)
1. **OGN** - Origins (352 cards)
2. **SFD** - Spiritforged (288 cards)
3. **UNL** - Unleashed (280 cards)

### Promotional Sets (4)
1. **JDG** - Judge Promotional Cards (1 card)
2. **OGS** - Origins: Proving Grounds (24 cards)
3. **OPP** - Organized Play Promotional Cards (107 cards)
4. **PR** - Promotional Cards (12 cards)

## Total Card Count
- **Main Sets**: 920 cards (OGN + SFD + UNL)
- **Promotional Sets**: 144 cards (JDG + OGS + OPP + PR)
- **Grand Total**: 1,064 cards

## Notes

- **FRO** (Frostbound) was checked but not found in the API - it may not be released yet or uses a different code
- All sets are accessible via the Riftcodex API at `https://api.riftcodex.com/sets`
- Individual set data can be fetched via `https://api.riftcodex.com/sets/{set_id}`

## Integration Status

### Currently Integrated in Riftle
- ✅ OGN (Origins)
- ✅ SFD (Spiritforged)

### Available for Integration
- 🆕 UNL (Unleashed) - 280 cards ready to add
- 🎁 OGS (Origins: Proving Grounds) - 24 cards
- 🎁 OPP (Organized Play Promos) - 107 cards
- 🎁 PR (Promotional Cards) - 12 cards
- 🎁 JDG (Judge Promos) - 1 card

## How to Check for Updates

Run the following command to check for new sets:

```bash
npx tsx scripts/check-available-sets.ts
```

This will fetch the latest set information from the Riftcodex API and display:
- All available sets with their codes and names
- Card counts per set
- Set IDs for API access
- Status of known sets

## API Endpoints

- **Get all sets**: `GET https://api.riftcodex.com/sets`
- **Get specific set**: `GET https://api.riftcodex.com/sets/{set_id}`
- **Get all cards**: `GET https://api.riftcodex.com/cards`

## Last Updated

Generated: 2026-04-25