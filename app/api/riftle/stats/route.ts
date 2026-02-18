/**
 * GET /api/riftle/stats
 * 
 * Get user statistics and recent games
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Extract access token from cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const accessTokenMatch = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);
    
    if (!accessTokenMatch) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse the token (it's a JSON string with access_token)
    let accessToken: string;
    try {
      const tokenData = JSON.parse(decodeURIComponent(accessTokenMatch[1]));
      accessToken = tokenData.access_token;
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Create admin client to verify token and get user
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching user stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }
    
    // Get recent games (last 10)
    const { data: recentGames, error: gamesError } = await supabase
      .from('guesses')
      .select(`
        id,
        puzzle_id,
        guesses_used,
        is_solved,
        time_taken_seconds,
        submitted_at,
        daily_cards (
          puzzle_date
        )
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(10);
    
    if (gamesError) {
      console.error('Error fetching recent games:', gamesError);
    }
    
    // Calculate win percentage
    const totalGames = stats?.total_games || 0;
    const failedGames = stats?.failed_games || 0;
    const wins = totalGames - failedGames;
    const winPercent = totalGames > 0 ? (wins / totalGames) * 100 : 0;
    
    // Format recent games
    const formattedGames = (recentGames || []).map(game => ({
      date: (game as any).daily_cards?.puzzle_date || null,
      guessesUsed: game.guesses_used,
      isSolved: game.is_solved,
      timeInSeconds: game.time_taken_seconds,
    }));
    
    return NextResponse.json({
      totalGames,
      wins,
      failedGames,
      winPercent: Math.round(winPercent * 10) / 10, // Round to 1 decimal
      solvedDistribution: stats?.solved_distribution || {},
      currentStreak: stats?.current_streak || 0,
      maxStreak: stats?.max_streak || 0,
      averageGuesses: stats?.average_guesses || 0,
      totalScore: stats?.total_score || 0,
      lastPlayedDate: stats?.last_played_date || null,
      recentGames: formattedGames,
    });
  } catch (error) {
    console.error('Error in /api/riftle/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Bob
