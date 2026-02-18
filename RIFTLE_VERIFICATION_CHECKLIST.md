# Riftle Verification Checklist

## Recent Fixes Applied

### 1. Image Display on Game Over ✅
**Fix**: Added `image_url` to the puzzle query (line 181 in `app/riftle/page.tsx`)
```typescript
const { data: puzzleData } = await supabase
  .from('riftle_daily_puzzles')
  .select(`
    id,
    puzzle_date,
    card_id,
    cards (
      id,
      name,
      cost,
      attack,
      health,
      type,
      rarity,
      champion,
      image_url
    )
  `)
```

**What to Test**:
- Navigate to http://localhost:3001/riftle
- Play the game until you win or lose
- Verify the card image appears in the game over section
- Check browser console for any image loading errors
- Verify the image uses the proxy: `/api/image-proxy?url=...`

### 2. Guess Number Labels ✅
**Fix**: Added labels to guess history (lines 722-723)
```typescript
<div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  Guess #{index + 1}:
</div>
```

**What to Test**:
- Make several guesses
- Verify each guess shows "Guess #1:", "Guess #2:", etc.
- Check formatting looks good on both light and dark themes

### 3. Max Guesses Changed to 6 ✅
**Fix**: Updated `RIFTLE_CONFIG.MAX_GUESSES` in `lib/riftle/config.ts`

**What to Test**:
- Verify you can make up to 6 guesses
- Check the guess counter shows "X/6"
- Confirm game ends after 6 incorrect guesses

### 4. Side-by-Side Layout ✅
**Fix**: Changed to grid layout (line 770)
```typescript
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

**What to Test**:
- On desktop (>1024px): Stats and leaderboard should be side-by-side
- On mobile: Stats and leaderboard should stack vertically
- Verify spacing looks good in both layouts

### 5. Responsive Bar Heights ✅
**Fix**: Changed from hardcoded pixels to percentage-based heights
```typescript
<div className="flex items-end justify-center gap-2 h-32">
  {/* bars use height: ${heightPercent}% */}
</div>
```

**What to Test**:
- Check the guess distribution chart
- Verify bars scale properly in the side-by-side layout
- Bars should be proportional to the data
- Container should be consistent height (h-32 = 128px)

### 6. Non-Logged-In User Experience ✅
**Fix**: Added conditional rendering for stats section (lines 776-847)

**What to Test**:
- Open http://localhost:3001/riftle in incognito/private mode
- Verify you see "Sign in to track your stats and compete on the leaderboard!"
- Click the "Sign In" button and verify it goes to /login
- Sign in and verify stats appear correctly

### 7. Top 5 Leaderboard ✅
**Fix**: Limited leaderboard display (line 859)
```typescript
leaderboard.slice(0, 5).map((entry) => (
```

**What to Test**:
- Check the leaderboard section
- Verify only 5 entries are shown (or fewer if less than 5 players)
- Verify entries are sorted by average guesses (ascending)

## Testing Workflow

### Quick Test (5 minutes)
1. Open http://localhost:3001/riftle
2. Make a few guesses and verify labels appear
3. Win or lose the game
4. **CRITICAL**: Verify card image appears in game over section
5. Check stats and leaderboard are side-by-side on desktop

### Full Test (15 minutes)
1. **Logged Out Test**:
   - Open in incognito mode
   - Verify sign-in message appears
   - Play a game (stats won't save)
   - Check image still appears on game over

2. **Logged In Test**:
   - Sign in to the app
   - Play a complete game
   - Verify all 6 guesses work
   - Check guess labels (Guess #1, #2, etc.)
   - Verify card image appears on game over
   - Check stats update correctly
   - Verify bar chart heights are proportional
   - Check leaderboard shows top 5

3. **Responsive Test**:
   - Resize browser window
   - Verify layout switches at 1024px breakpoint
   - Check mobile view (stacked layout)
   - Check desktop view (side-by-side layout)

4. **Theme Test**:
   - Toggle between light and dark themes
   - Verify all colors look good
   - Check image displays properly in both themes

## Known Issues to Watch For

### Image Not Loading
**Symptoms**: 
- Blank space where image should be
- Console error about image proxy
- 404 or CORS errors

**Debug Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Play game until completion
4. Look for image-proxy request
5. Check if it returns 200 or error
6. Verify the URL is properly encoded

**Expected URL Format**:
```
/api/image-proxy?url=https%3A%2F%2Fexample.com%2Fcard.png
```

### Bar Heights Not Scaling
**Symptoms**:
- Bars look too tall or too short
- Bars don't fit in container
- Inconsistent heights

**Debug Steps**:
1. Inspect the chart container
2. Verify it has `h-32` class (128px height)
3. Check individual bars have `height: X%` style
4. Verify percentages are calculated correctly

### Stats Not Showing
**Symptoms**:
- Sign-in message appears when logged in
- Stats section is empty

**Debug Steps**:
1. Check browser console for errors
2. Verify user is authenticated (check Supabase auth)
3. Check if stats query is returning data
4. Verify RLS policies allow reading stats

## HTML Inspection Guide

To verify the image in HTML:

1. Open http://localhost:3001/riftle
2. Play until game over
3. Right-click on the image area → "Inspect Element"
4. Look for:
```html
<div class="relative w-48 aspect-[63/88] mb-3 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
  <img 
    src="/api/image-proxy?url=https%3A%2F%2F..." 
    alt="Card Name"
    class="rounded object-contain"
  />
</div>
```

5. If image is missing, check:
   - Is the `<img>` tag present?
   - Does the `src` attribute have a value?
   - Is there a 404 error in Network tab?
   - Is the URL properly encoded?

## Success Criteria

All of these should be true:
- ✅ Build compiles without errors
- ✅ Dev server runs on port 3001
- ✅ Card image displays on game over (WIN or LOSS)
- ✅ Guess labels show "Guess #1:", "Guess #2:", etc.
- ✅ Max guesses is 6
- ✅ Stats and leaderboard are side-by-side on desktop
- ✅ Bar chart heights scale proportionally
- ✅ Non-logged-in users see sign-in message
- ✅ Leaderboard shows only top 5 entries
- ✅ No console errors
- ✅ Responsive layout works on mobile and desktop

## Next Steps After Verification

Once all tests pass:
1. Investigate battlefield/battleground cards (Task #3)
2. Consider additional polish/features
3. Deploy to production

## Troubleshooting

If image still doesn't show:
1. Check if `puzzleCard.image_url` has a value
2. Verify the image proxy API is working: `/api/image-proxy?url=https://example.com/test.png`
3. Check Supabase cards table has `image_url` column populated
4. Verify the card in today's puzzle has a valid image URL

If bars are wrong height:
1. Check if stats data is correct
2. Verify percentage calculation logic
3. Inspect CSS classes on container and bars
4. Check if Tailwind classes are being applied

If layout doesn't switch:
1. Verify Tailwind config includes `lg:` breakpoint
2. Check browser width is actually >1024px
3. Inspect grid classes in DevTools
4. Clear browser cache and hard refresh