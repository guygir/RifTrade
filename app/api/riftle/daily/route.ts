/**
 * GET /api/riftle/daily
 * 
 * Returns the current daily puzzle and user's guess state (if authenticated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentPuzzleDate, getDailyPuzzle, getUserGuessState } from '@/lib/riftle/puzzle';
import { RIFTLE_CONFIG } from '@/lib/riftle/config';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current puzzle date
    const puzzleDate = await getCurrentPuzzleDate(supabase);
    
    if (!puzzleDate) {
      return NextResponse.json(
        { error: 'No puzzle available yet. Please check back later.' },
        { status: 404 }
      );
    }
    
    // Get puzzle data
    const puzzle = await getDailyPuzzle(supabase, puzzleDate);
    
    if (!puzzle) {
      return NextResponse.json(
        { error: 'Failed to load puzzle data.' },
        { status: 500 }
      );
    }
    
    // Check if user is authenticated (optional for this endpoint)
    let user = null;
    const cookieHeader = request.headers.get('cookie') || '';
    const accessTokenMatch = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);
    
    if (accessTokenMatch) {
      try {
        const tokenData = JSON.parse(decodeURIComponent(accessTokenMatch[1]));
        const accessToken = tokenData.access_token;
        const { data: { user: authUser } } = await supabase.auth.getUser(accessToken);
        user = authUser;
      } catch {
        // Ignore auth errors for this endpoint
      }
    }
    
    let userGuessState = null;
    if (user) {
      userGuessState = await getUserGuessState(supabase, user.id, puzzle.id);
    }
    
    // Return puzzle info (without revealing the answer)
    return NextResponse.json({
      puzzleId: puzzle.id,
      puzzleDate: puzzle.puzzle_date,
      // Don't send the actual card data to prevent cheating
      // Only send if user has already solved or failed
      isSolved: userGuessState?.is_solved || false,
      guessesUsed: userGuessState?.guesses_used || 0,
      guessHistory: userGuessState?.guess_history || [],
      maxGuesses: RIFTLE_CONFIG.MAX_GUESSES,
      // Send card metadata for display purposes (set, rarity info for UI)
      cardMetadata: {
        set_code: (puzzle as any).cards?.set_code || null,
        rarity: (puzzle as any).cards?.rarity || null,
      }
    });
  } catch (error) {
    console.error('Error in /api/riftle/daily:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Bob
