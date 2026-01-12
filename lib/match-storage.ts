import { createSupabaseClient } from './supabase/client';
import { calculateMatches, MatchResult } from './match-calculator';

/**
 * Detect new matches and update the user_matches table
 * Returns the count of new matches
 */
export async function detectAndStoreMatches(userProfileId: string): Promise<number> {
  const supabase = createSupabaseClient();
  
  // Calculate current matches
  const currentMatches = await calculateMatches(userProfileId);
  
  // Get existing matches from database
  const { data: existingMatches, error: fetchError } = await supabase
    .from('user_matches')
    .select('*')
    .eq('user_profile_id', userProfileId);

  if (fetchError) {
    console.error('Error fetching existing matches:', fetchError);
    return 0;
  }

  const existingMatchesMap = new Map<string, { id: string; match_count: number; is_new: boolean }>();
  (existingMatches || []).forEach(match => {
    existingMatchesMap.set(match.matched_profile_id, {
      id: match.id,
      match_count: match.match_count,
      is_new: match.is_new,
    });
  });

  let newMatchesCount = 0;
  const updates: Array<{ id: string; match_count: number; is_new: boolean }> = [];
  const inserts: Array<{ user_profile_id: string; matched_profile_id: string; match_count: number; is_new: boolean }> = [];

  // Process each current match
  for (const match of currentMatches) {
    const existing = existingMatchesMap.get(match.matchedProfileId);
    
    if (!existing) {
      // New match - insert with is_new = true
      inserts.push({
        user_profile_id: userProfileId,
        matched_profile_id: match.matchedProfileId,
        match_count: match.matchCount,
        is_new: true,
      });
      newMatchesCount++;
    } else if (existing.match_count !== match.matchCount) {
      // Match count changed - update
      // Mark as new if count changed (either increased or decreased) and was previously seen
      // This ensures users are notified of any match updates
      const shouldMarkAsNew = !existing.is_new;
      updates.push({
        id: existing.id,
        match_count: match.matchCount,
        is_new: shouldMarkAsNew,
      });
      if (shouldMarkAsNew) {
        newMatchesCount++;
      }
    }
  }

  // Remove matches that no longer exist (user removed cards, other user removed cards, etc.)
  const currentMatchIds = new Set(currentMatches.map(m => m.matchedProfileId));
  const toDelete = (existingMatches || []).filter(m => !currentMatchIds.has(m.matched_profile_id));

  // Execute updates
  if (updates.length > 0) {
    for (const update of updates) {
      const { error } = await supabase
        .from('user_matches')
        .update({
          match_count: update.match_count,
          is_new: update.is_new,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.id);
      
      if (error) {
        console.error('Error updating match:', error);
      }
    }
  }

  // Execute inserts
  if (inserts.length > 0) {
    const { error } = await supabase
      .from('user_matches')
      .insert(inserts);
    
    if (error) {
      console.error('Error inserting matches:', error);
    }
  }

  // Execute deletes
  if (toDelete.length > 0) {
    const deleteIds = toDelete.map(m => m.id);
    const { error } = await supabase
      .from('user_matches')
      .delete()
      .in('id', deleteIds);
    
    if (error) {
      console.error('Error deleting matches:', error);
    }
  }

  // Update last_match_check timestamp
  await supabase
    .from('profiles')
    .update({ last_match_check: new Date().toISOString() })
    .eq('id', userProfileId);

  // Note: We don't update other users' matches here due to RLS restrictions.
  // When other users navigate or check their bell, they will recalculate their own matches,
  // which will pick up the changes. This is fine - matches update when needed.

  return newMatchesCount;
}

/**
 * Get count of new (unseen) matches for a user
 */
export async function getNewMatchesCount(userProfileId: string): Promise<number> {
  const supabase = createSupabaseClient();
  
  const { count, error } = await supabase
    .from('user_matches')
    .select('*', { count: 'exact', head: true })
    .eq('user_profile_id', userProfileId)
    .eq('is_new', true);

  if (error) {
    console.error('Error getting new matches count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark matches as read (is_new = false)
 */
export async function markMatchesAsRead(userProfileId: string): Promise<void> {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase
    .from('user_matches')
    .update({ is_new: false, updated_at: new Date().toISOString() })
    .eq('user_profile_id', userProfileId)
    .eq('is_new', true);

  if (error) {
    console.error('Error marking matches as read:', error);
  }
}
