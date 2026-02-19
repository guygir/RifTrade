# Geographic Restrictions Implementation Summary

## Overview
Implemented geographic restrictions to allow worldwide Riftle play while limiting trading features to Israel only.

## Database Changes

### Migration: `012_add_geographic_restrictions.sql`
Added to `profiles` table:
- `country` (TEXT): Two-letter country code (e.g., 'IL', 'US')
- `is_trading_enabled` (BOOLEAN): Whether user can access trading features
- Default for existing users: `country = 'IL'`, `is_trading_enabled = true`

## Implementation Details

### 1. Country Detection (`lib/geo-utils.ts`)
- Uses ipapi.co free tier (1000 requests/day)
- **Fallback Strategy**: If API fails or limit exceeded, assume user is NOT from Israel
- Only Israel (IL) allows trading
- Generic messaging without mentioning specific countries

### 2. Signup Flow Updates (`app/login/page.tsx`)
**Features:**
- Detects country during signup
- Shows country feedback with flag emoji and country name
- User CANNOT change their country (read-only display)
- Sets `is_trading_enabled` based on country
- Shows regional warning modal for non-Israeli users
- Redirects to Riftle instead of Profile for international users

**Display Format:**
```
📍 You're signing up from: 🇺🇸 United States
```

### 3. Regional Warning Modal (`components/RegionalWarningModal.tsx`)
Shown to international users after signup:
- **Title**: "🌍 Welcome to RifTrade!"
- **Message**: "Trading isn't possible in your region. But you can play Riftle!"
- **What You Can Do**: Play Riftle, compete on leaderboard, track stats
- **Not Available**: Card trading features
- **CTA**: "Continue to Riftle" button

### 4. Navigation Updates (`components/Navigation.tsx`)
- Fetches `is_trading_enabled` from profile
- Conditionally hides:
  - Cards link
  - Search link
  - Profile link
  - Notification bell
- Riftle link always visible
- Login/Logout always visible

### 5. Page Protection
All trading pages redirect to `/riftle` if `is_trading_enabled = false`:
- `/cards` - Card collection management
- `/search` - User search and matching
- `/profile` - Profile and trading settings

Uses custom hook: `useTradingPermission()`

### 6. Riftle Page Banner (`app/riftle/page.tsx`)
Shows informational banner for authenticated international users:
- Blue info banner
- Message: "Trading features aren't available in your region, but you can enjoy the daily puzzle and compete on the global leaderboard!"
- Only shown to authenticated users with `is_trading_enabled = false`

### 7. TypeScript Types (`lib/supabase/types.ts`)
Updated `Profile` type:
```typescript
export type Profile = {
  // ... existing fields
  country: string | null;
  is_trading_enabled: boolean;
  // ...
}
```

## User Experience Flow

### Israeli User Signup:
1. Enters email, username, password
2. Sees: "📍 You're signing up from: 🇮🇱 Israel"
3. Account created
4. Redirected to Profile page
5. Full access to all features

### International User Signup:
1. Enters email, username, password
2. Sees: "📍 You're signing up from: 🇺🇸 United States" (example)
3. Account created
4. Regional warning modal appears
5. Clicks "Continue to Riftle"
6. Redirected to Riftle page
7. Navigation shows only: Riftle, Login/Logout, Theme Toggle
8. Blue info banner on Riftle page
9. Attempting to access /cards, /search, or /profile redirects to /riftle

### Leaderboard Display:
- International users have `display_name = null`
- Leaderboard shows `username` as fallback
- Already implemented correctly

## API Considerations

### IP Detection Limits:
- ipapi.co: 1000 requests/day (free tier)
- **Fallback**: If API fails → assume NOT from Israel → trading disabled
- This is intentional to prevent abuse

### Future Improvements:
- Could cache country detection results
- Could use Vercel's geo headers as primary source
- Could implement rate limiting per IP

## Security Notes

1. **Country cannot be changed by user** - Set once during signup
2. **Client-side checks** - For UX only
3. **Server-side enforcement** - Would need RLS policies on trading tables (future enhancement)
4. **No country-specific messaging** - Generic "your region" language

## Testing Checklist

- [ ] Run migration 012 on Supabase
- [ ] Test signup from Israel (VPN)
- [ ] Test signup from other country (VPN)
- [ ] Verify navigation hides trading links for international users
- [ ] Verify page redirects work
- [ ] Verify Riftle banner shows for international users
- [ ] Verify leaderboard shows username for international users
- [ ] Test API failure fallback (disable network during signup)

## Files Modified

1. `supabase/migrations/012_add_geographic_restrictions.sql` - Database schema
2. `lib/geo-utils.ts` - Country detection utilities
3. `lib/hooks/useTradingPermission.ts` - Permission checking hook
4. `lib/supabase/types.ts` - TypeScript types
5. `components/RegionalWarningModal.tsx` - Warning modal
6. `components/Navigation.tsx` - Conditional navigation
7. `app/login/page.tsx` - Signup with country detection
8. `app/riftle/page.tsx` - Info banner
9. `app/cards/page.tsx` - Route protection
10. `app/search/page.tsx` - Route protection
11. `app/profile/page.tsx` - Route protection

## Next Steps

1. Apply migration to Supabase database
2. Test with VPN from different countries
3. Monitor ipapi.co usage
4. Consider adding server-side API protection (future)
5. Consider adding RLS policies for trading tables (future)