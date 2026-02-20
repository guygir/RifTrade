import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get today's date in UTC
    const today = new Date().toISOString().split('T')[0];
    
    // Get all daily puzzles up to today, ordered by date
    const { data: puzzles, error: puzzlesError } = await supabase
      .from('daily_cards')
      .select('id, puzzle_date')
      .lte('puzzle_date', today)
      .order('puzzle_date', { ascending: true });
    
    if (puzzlesError) {
      console.error('Error fetching puzzles:', puzzlesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch puzzles' },
        { status: 500 }
      );
    }
    
    if (!puzzles || puzzles.length === 0) {
      return NextResponse.json(
        { 
          success: true, 
          data: { 
            launchDate: today, 
            points: [] 
          } 
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
          },
        }
      );
    }
    
    const launchDate = puzzles[0].puzzle_date;
    const puzzleIds = puzzles.map(p => p.id);
    
    // Count unique players per puzzle (anyone who made at least one guess)
    const { data: guessCounts, error: guessError } = await supabase
      .from('guesses')
      .select('puzzle_id, user_id')
      .in('puzzle_id', puzzleIds)
      .gte('guesses_used', 1);
    
    if (guessError) {
      console.error('Error fetching guesses:', guessError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch guess data' },
        { status: 500 }
      );
    }
    
    // Count unique players per puzzle
    const playsByPuzzle = new Map<string, number>();
    (guessCounts || []).forEach(guess => {
      const count = playsByPuzzle.get(guess.puzzle_id) || 0;
      playsByPuzzle.set(guess.puzzle_id, count + 1);
    });
    
    // Map puzzles to points with day index
    const points = puzzles.map((puzzle, index) => ({
      day: index,
      date: puzzle.puzzle_date,
      plays: playsByPuzzle.get(puzzle.id) || 0,
    }));
    
    return NextResponse.json(
      {
        success: true,
        data: {
          launchDate,
          points,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Error in daily-plays API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Bob
