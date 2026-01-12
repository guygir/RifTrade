# Implementation Plan: Username Routes & Notifications

## Overview
This document outlines the detailed implementation plan for:
1. Task 3: Verify search filters are temporary (Easy)
2. Task 1: Add username during signup (Medium)
3. Task 2: Dynamic `/<username>` route (Medium-Hard)
4. Task 4: Notification bell system (Hard)

---

## Task 3: Verify Search Filters Are Temporary ✅
**Difficulty:** Easy  
**Estimated Time:** 5 minutes

### Subtasks:
1. ✅ Review `app/search/page.tsx` code
2. ✅ Verify `selectedHaveCards` and `selectedWantCards` are local state only
3. ✅ Confirm changes don't persist to database
4. ✅ Document verification in comments if needed

### Expected Outcome:
- Confirmation that search filters are temporary (already working correctly)
- No code changes needed

---

## Task 1: Add Username During Signup
**Difficulty:** Medium  
**Estimated Time:** 30-45 minutes

### Subtasks:

#### 1.1 Database Migration
- [ ] Create migration file: `supabase/migrations/003_add_username.sql`
- [ ] Add `username` column to `profiles` table:
  - Type: `TEXT NOT NULL`
  - Add unique constraint: `UNIQUE(username)`
  - Add index: `CREATE INDEX idx_profiles_username ON profiles(username)`
- [ ] Add validation constraint (alphanumeric + underscore/hyphen, 3-30 chars)
- [ ] Test migration in Supabase SQL Editor

#### 1.2 Update TypeScript Types
- [ ] Add `username: string` to `Profile` type in `lib/supabase/types.ts`

#### 1.3 Update Signup Flow
- [ ] Add username input field to `app/login/page.tsx`:
  - Show only during signup (`isSignUp === true`)
  - Add validation: 3-30 chars, alphanumeric + underscore/hyphen
  - Real-time validation feedback
  - Check uniqueness before submit (client-side check via API)
- [ ] Update signup handler to:
  - Validate username format
  - Check username uniqueness (query profiles table)
  - Create profile with username after auth signup
  - Handle errors gracefully (username taken, invalid format)

#### 1.4 Update Profile Creation Logic
- [ ] Modify profile creation in `app/profile/page.tsx`:
  - Include username when creating new profile
  - Ensure username is set during initial profile creation

#### 1.5 Handle Existing Users
- [ ] Create migration script or manual process for existing users:
  - Option A: Generate username from display_name (sanitized)
  - Option B: Require existing users to set username on next login
  - Option C: Allow NULL temporarily, require on profile update

#### 1.6 Testing
- [ ] Test new signup with username
- [ ] Test username uniqueness validation
- [ ] Test invalid username formats
- [ ] Test existing user flow (if applicable)

---

## Task 2: Dynamic `/<username>` Route
**Difficulty:** Medium-Hard  
**Estimated Time:** 1.5-2 hours

### Subtasks:

#### 2.1 Create Dynamic Route
- [ ] Create `app/[username]/page.tsx`:
  - Use Next.js dynamic route `[username]`
  - Fetch profile by username (not user_id)
  - Handle loading states
  - Handle not found (404) case
  - Handle invalid username format

#### 2.2 Profile Fetching Logic
- [ ] Create helper function to fetch profile by username:
  - Query: `SELECT * FROM profiles WHERE username = $1`
  - Include related data: `profile_have_cards` and `profile_want_cards`
  - Handle case sensitivity (store lowercase, compare lowercase)

#### 2.3 Determine View Mode
- [ ] Check if viewing own profile:
  - Compare `profile.user_id` with `auth.uid()`
  - Show editable view for own profile
  - Show read-only view for others

#### 2.4 Editable View (Own Profile)
- [ ] Reuse existing profile page logic:
  - Form inputs for display_name, contact_info, trading_locations
  - Card selectors for have/want lists
  - Save functionality
  - Same as current `/profile` page

#### 2.5 Read-Only View (Other Users)
- [ ] Display profile information:
  - Display name, contact info, trading locations
  - Cards I Have section (image grid format)
  - Cards I Want section (image grid format)
  - Show quantities
  - No edit buttons

#### 2.6 Card Display in Image Grid
- [ ] Create card image grid component:
  - Display card images (`image_url`)
  - Show card name on hover or below image
  - Show quantity badge if > 1
  - Responsive grid layout (3-4 columns on desktop)
  - Fallback for missing images

#### 2.7 Redirect `/profile` to `/<username>`
- [ ] Update `app/profile/page.tsx`:
  - On load, fetch current user's username
  - Redirect to `/<username>` using `router.push()`
  - Keep as fallback for users without username (temporary)

#### 2.8 Update Navigation Links
- [ ] Update `components/Navigation.tsx`:
  - Change `/profile` link to `/<username>` (need to fetch username)
  - Handle case where username not set yet
- [ ] Update `app/page.tsx` home links:
  - Change `/profile` to `/<username>` (or keep generic, redirect handles it)

#### 2.9 Delete User Functionality
- [ ] Add "Delete Account" button (red, prominent):
  - Only visible on own profile
  - Confirmation dialog before deletion
  - Delete cascade:
    - Delete from `auth.users` (Supabase Auth)
    - Cascade deletes: profile, profile_have_cards, profile_want_cards
  - Redirect to home after deletion
  - Show success message

#### 2.10 Update Search Results Links
- [ ] Update `app/search/page.tsx`:
  - Change result links from `/profile` to `/<username>`
  - Fetch username for each result profile
  - Handle missing username gracefully

#### 2.11 Testing
- [ ] Test viewing own profile via `/<username>`
- [ ] Test viewing other user's profile
- [ ] Test `/profile` redirect
- [ ] Test 404 for invalid username
- [ ] Test delete account functionality
- [ ] Test navigation links
- [ ] Test card image grid display

---

## Task 4: Notification Bell System
**Difficulty:** Hard  
**Estimated Time:** 2-3 hours

### Subtasks:

#### 4.1 Database Schema
- [ ] Create migration: `supabase/migrations/004_add_notifications.sql`
- [ ] Add `last_match_check` to `profiles` table:
  - Type: `TIMESTAMP WITH TIME ZONE`
  - Default: `NULL` (for existing users)
- [ ] Create `user_matches` table:
  - `id` UUID PRIMARY KEY
  - `user_profile_id` UUID → profiles(id) ON DELETE CASCADE
  - `matched_profile_id` UUID → profiles(id) ON DELETE CASCADE
  - `match_count` INTEGER (number of matching cards)
  - `is_new` BOOLEAN DEFAULT true (unseen match)
  - `created_at` TIMESTAMP
  - `updated_at` TIMESTAMP
  - UNIQUE(user_profile_id, matched_profile_id)
  - Indexes for efficient queries
- [ ] Add RLS policies:
  - Users can read their own matches
  - Users can update their own matches (mark as seen)
  - System can insert matches (via service role or function)

#### 4.2 Match Calculation Logic
- [ ] Create utility function `lib/match-calculator.ts`:
  - `calculateMatches(userProfileId: string)`: Returns array of matches
  - Logic:
    - Get user's have/want cards from profile
    - Find other profiles with matching cards
    - Calculate match score (same as search page logic)
    - Return matches with scores > 0
  - Reuse search matching logic from `app/search/page.tsx`

#### 4.3 Match Detection & Storage
- [ ] Create function to detect new matches:
  - Compare current matches with stored matches
  - Identify new matches (not in `user_matches` table)
  - Insert new matches with `is_new = true`
  - Update existing matches if match_count changed
- [ ] Trigger match calculation:
  - On profile card changes (have/want lists updated)
  - On page load (check for new matches from other users)
  - Consider using Supabase database function or API route

#### 4.4 Notification Bell Component
- [ ] Create `components/NotificationBell.tsx`:
  - Bell icon (gray when no new, red when new)
  - Badge with count of new matches
  - Click handler to show dropdown/modal
  - Fetch matches on mount and when clicked
- [ ] Add to `components/Navigation.tsx`:
  - Position near Cards/Search/Profile links
  - Only show when authenticated

#### 4.5 Match List Display
- [ ] Create match list component:
  - Show matched users (link to their `/<username>` page)
  - Show match count
  - Highlight new matches
  - "Mark as read" functionality
  - Close dropdown/modal

#### 4.6 Real-time/Polling Logic
- [ ] Implement match checking:
  - On page load: Check for new matches since `last_match_check`
  - Update `last_match_check` after checking
  - Use `useEffect` hook in Navigation or Layout
  - Consider polling every 30-60 seconds (optional, for real-time feel)
- [ ] Optimize queries:
  - Only check matches for current user
  - Use efficient database queries with indexes
  - Cache results temporarily

#### 4.7 Mark as Read Functionality
- [ ] Update `user_matches` table:
  - Set `is_new = false` when bell clicked
  - Update notification count accordingly
  - Update UI state

#### 4.8 Update Match Count on Profile Changes
- [ ] Hook into profile card updates:
  - When user adds/removes have/want cards
  - Recalculate matches immediately
  - Update `user_matches` table
  - Update notification bell count

#### 4.9 Edge Cases & Cleanup
- [ ] Handle deleted users:
  - Clean up matches when user deleted
  - Handle cascade deletes
- [ ] Handle username changes:
  - Update match references if username changes
- [ ] Performance optimization:
  - Batch match calculations
  - Debounce match updates
  - Limit match results (top 50?)

#### 4.10 Testing
- [ ] Test match calculation accuracy
- [ ] Test new match detection
- [ ] Test notification bell display
- [ ] Test mark as read
- [ ] Test match updates on profile changes
- [ ] Test with multiple users
- [ ] Test edge cases (deleted users, etc.)

---

## Implementation Order

1. **Task 3** (5 min) - Quick verification
2. **Task 1** (30-45 min) - Username foundation
3. **Task 2** (1.5-2 hours) - Dynamic routes (depends on Task 1)
4. **Task 4** (2-3 hours) - Notifications (can be done independently)

---

## Security Considerations

### Username Security:
- ✅ Validate username format (prevent SQL injection, XSS)
- ✅ Enforce uniqueness constraint in database
- ✅ Sanitize username before display
- ✅ Handle case sensitivity consistently (store lowercase)

### Profile Viewing:
- ✅ RLS policies ensure users can only edit own profile
- ✅ Public profiles are viewable by all (by design)
- ✅ Username lookup is safe (parameterized queries)

### Delete Account:
- ✅ Require authentication
- ✅ Confirm before deletion
- ✅ Cascade deletes handled by database
- ✅ Clear session after deletion

### Notifications:
- ✅ RLS policies restrict match access to own matches
- ✅ Match calculation uses existing search logic (already secure)
- ✅ No sensitive data exposed in notifications

---

## Rollback Plan

If any task fails:
1. **Git Reset**: `git reset --hard 378bda3` (current working commit)
2. **Database Rollback**: 
   - Revert migrations in reverse order
   - Or restore from backup if available
3. **Vercel**: Redeploy previous working version

---

## Notes

- All database changes use migrations (reversible)
- All code changes are incremental and testable
- Each task can be tested independently
- TypeScript types updated alongside schema changes
- RLS policies maintained throughout
