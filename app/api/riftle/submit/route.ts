/**
 * POST /api/riftle/submit
 * 
 * Submit a guess for the daily puzzle
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDailyPuzzle, updateUserStats } from '@/lib/riftle/puzzle';
import { generateFeedback, isCorrectGuess, extractCardAttributes } from '@/lib/riftle/feedback';
import { RIFTLE_CONFIG } from '@/lib/riftle/config';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface SubmitGuessRequest {
  puzzleId: string;
  guessedCardId: string;
  attemptNumber: number;
  timeInSeconds: number;
}

export async function POST(request: NextRequest) {
  try {
    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check authentication (optional - allow anonymous play)
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
        // Allow anonymous play
      }
    }
    
    // Parse request body
    const body: SubmitGuessRequest = await request.json();
    const { puzzleId, guessedCardId, attemptNumber, timeInSeconds } = body;
    
    if (!puzzleId || !guessedCardId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get puzzle data
    const { data: puzzle, error: puzzleError } = await supabase
      .from('daily_cards')
      .select(`
        id,
        puzzle_date,
        card_id,
        cards (
          id,
          name,
          set_code,
          collector_number,
          rarity,
          metadata
        )
      `)
      .eq('id', puzzleId)
      .single();
    
    if (puzzleError || !puzzle) {
      return NextResponse.json(
        { error: 'Puzzle not found' },
        { status: 404 }
      );
    }
    
    // Get guessed card data
    const { data: guessedCard, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', guessedCardId)
      .single();
    
    if (cardError || !guessedCard) {
      return NextResponse.json(
        { error: 'Invalid card' },
        { status: 400 }
      );
    }
    
    // Generate feedback
    const actualCard = (puzzle as any).cards;
    const feedback = generateFeedback(guessedCard, actualCard);
    const correct = isCorrectGuess(guessedCard, actualCard);
    
    const maxGuesses = RIFTLE_CONFIG.MAX_GUESSES;
    let guessHistory: any[] = [];
    let guessesUsed = 0;
    let existingGuess = null;
    
    // Only fetch/save guess state if user is authenticated
    if (user) {
      const { data } = await supabase
        .from('guesses')
        .select('*')
        .eq('user_id', user.id)
        .eq('puzzle_id', puzzleId)
        .single();
      
      existingGuess = data;
      guessHistory = existingGuess?.guess_history || [];
    }
    
    // Add new guess to history
    const newGuess = {
      card_id: guessedCardId,
      card_name: guessedCard.name,
      attributes: extractCardAttributes(guessedCard),
      feedback,
      timestamp: new Date().toISOString(),
    };
    guessHistory.push(newGuess);
    
    guessesUsed = guessHistory.length;
    const isSolved = correct;
    const isFailed = !correct && guessesUsed >= maxGuesses;
    
    // Save to database only if authenticated
    if (user) {
      const { error: upsertError } = await supabase
        .from('guesses')
        .upsert({
          user_id: user.id,
          puzzle_id: puzzleId,
          guess_history: guessHistory,
          guesses_used: guessesUsed,
          is_solved: isSolved,
          time_taken_seconds: timeInSeconds,
          total_score: isSolved ? (maxGuesses - guessesUsed + 1) : 0,
          submitted_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,puzzle_id'
        });
      
      if (upsertError) {
        console.error('Error upserting guess:', upsertError);
        return NextResponse.json(
          { error: 'Failed to save guess' },
          { status: 500 }
        );
      }
      
      // Update user stats if puzzle is complete (solved or failed)
      if (isSolved || isFailed) {
        try {
          await updateUserStats(supabase, user.id, guessesUsed, isSolved, maxGuesses);
        } catch (statsError) {
          console.error('Error updating user stats:', statsError);
          // Don't fail the request if stats update fails
        }
      }
    }
    
    // Return feedback and game state
    return NextResponse.json({
      feedback,
      guessedAttributes: extractCardAttributes(guessedCard), // Add guessed card's attributes
      correct: isSolved,
      guessesUsed,
      maxGuesses,
      gameOver: isSolved || isFailed,
      // Reveal the answer if game is over
      answer: (isSolved || isFailed) ? {
        id: actualCard.id,
        name: actualCard.name,
        set_code: actualCard.set_code,
        collector_number: actualCard.collector_number,
        rarity: actualCard.rarity,
        attributes: extractCardAttributes(actualCard),
      } : null,
    });
  } catch (error) {
    console.error('Error in /api/riftle/submit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Bob
