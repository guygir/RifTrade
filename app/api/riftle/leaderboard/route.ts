/**
 * GET /api/riftle/leaderboard
 * 
 * Get leaderboard data (daily or all-time)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentPuzzleDate } from '@/lib/riftle/puzzle';

export const dynamic = 'force-dynamic';

// Create admin client to bypass RLS for leaderboard
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const adminClient = createAdminClient();
    
    if (type === 'daily') {
      // Daily leaderboard for today's puzzle
      const puzzleDate = await getCurrentPuzzleDate(adminClient);
      
      if (!puzzleDate) {
        return NextResponse.json({ entries: [], userRank: null });
      }
      
      // Get today's puzzle ID
      const { data: puzzle } = await adminClient
        .from('daily_cards')
        .select('id')
        .eq('puzzle_date', puzzleDate)
        .single();
      
      if (!puzzle) {
        return NextResponse.json({ entries: [], userRank: null });
      }
      
      // Get all guesses for today's puzzle
      const { data: guesses, error } = await adminClient
        .from('guesses')
        .select('user_id, is_solved, guesses_used, time_taken_seconds, submitted_at')
        .eq('puzzle_id', puzzle.id)
        .order('is_solved', { ascending: false })
        .order('guesses_used', { ascending: true })
        .order('time_taken_seconds', { ascending: true })
        .order('submitted_at', { ascending: true })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching daily leaderboard:', error);
        return NextResponse.json(
          { error: 'Failed to fetch leaderboard' },
          { status: 500 }
        );
      }
      
      // Get profiles separately to avoid join issues
      const userIds = (guesses || []).map(g => g.user_id);
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('user_id, username, display_name')
        .in('user_id', userIds);
      
      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );
      
      // Format entries
      const entries = (guesses || []).map((guess, index) => {
        const profile = profileMap.get(guess.user_id);
        return {
          rank: index + 1,
          userId: guess.user_id,
          displayName: profile?.display_name || profile?.username || 'Anonymous',
          isSolved: guess.is_solved,
          guessesUsed: guess.guesses_used,
          timeInSeconds: guess.time_taken_seconds,
        };
      });
      
      return NextResponse.json({ entries, type: 'daily', puzzleDate });
      
    } else {
      // All-time leaderboard
      let orderBy = 'total_score';
      let ascending = false;
      
      switch (type) {
        case 'alltime-wins':
          orderBy = 'total_games';
          ascending = false;
          break;
        case 'alltime-winpct':
          // We'll calculate win % in the query
          orderBy = 'total_games';
          ascending = false;
          break;
        case 'alltime-avgguesses':
          orderBy = 'average_guesses';
          ascending = true; // Lower is better
          break;
        case 'alltime-score':
        default:
          orderBy = 'total_score';
          ascending = false;
          break;
      }
      
      // Get user stats
      const { data: stats, error } = await adminClient
        .from('user_stats')
        .select('user_id, total_games, failed_games, current_streak, max_streak, total_score, average_guesses')
        .gt('total_games', 0) // Only users who have played
        .order(orderBy, { ascending })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching all-time leaderboard:', error);
        return NextResponse.json(
          { error: 'Failed to fetch leaderboard' },
          { status: 500 }
        );
      }
      
      // Get profiles separately
      const statUserIds = (stats || []).map(s => s.user_id);
      const { data: statProfiles } = await adminClient
        .from('profiles')
        .select('user_id, username, display_name')
        .in('user_id', statUserIds);
      
      const statProfileMap = new Map(
        (statProfiles || []).map(p => [p.user_id, p])
      );
      
      // Format and sort entries
      let entries = (stats || []).map((stat) => {
        const profile = statProfileMap.get(stat.user_id);
        const wins = stat.total_games - stat.failed_games;
        const winPercent = stat.total_games > 0 ? (wins / stat.total_games) * 100 : 0;
        
        return {
          userId: stat.user_id,
          displayName: profile?.display_name || profile?.username || 'Anonymous',
          totalGames: stat.total_games,
          wins,
          winPercent: Math.round(winPercent * 10) / 10,
          averageGuesses: Math.round(stat.average_guesses * 10) / 10,
          totalScore: stat.total_score,
          currentStreak: stat.current_streak,
          maxStreak: stat.max_streak,
        };
      });
      
      // Sort by the requested metric
      if (type === 'alltime-winpct') {
        entries.sort((a, b) => {
          if (b.winPercent !== a.winPercent) {
            return b.winPercent - a.winPercent;
          }
          return b.wins - a.wins; // Tiebreaker: more wins
        });
      }
      
      // Add ranks
      const rankedEntries = entries.map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));
      
      return NextResponse.json({ entries: rankedEntries, type });
    }
  } catch (error) {
    console.error('Error in /api/riftle/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Bob
