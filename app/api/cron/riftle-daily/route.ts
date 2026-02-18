/**
 * GET /api/cron/riftle-daily
 * 
 * Cron job to generate daily puzzle
 * Secured with CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { selectRandomCard } from '@/lib/riftle/puzzle';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for Vercel

// Create admin client to bypass RLS
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
    // Verify CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Invalid CRON_SECRET');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    // Calculate target date
    let targetDate: Date;
    if (dateParam) {
      // Manual run with specific date
      targetDate = new Date(dateParam);
    } else {
      // Scheduled run: generate for today + 3 days
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 3);
    }
    
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    console.log(`Generating puzzle for date: ${targetDateStr}`);
    
    const adminClient = createAdminClient();
    
    // Select random card
    const cardId = await selectRandomCard(adminClient, 30);
    
    if (!cardId) {
      console.error('Failed to select random card');
      return NextResponse.json(
        { error: 'Failed to select card' },
        { status: 500 }
      );
    }
    
    // Delete existing puzzle for this date (if any)
    const { error: deleteError } = await adminClient
      .from('daily_cards')
      .delete()
      .eq('puzzle_date', targetDateStr);
    
    if (deleteError) {
      console.error('Error deleting existing puzzle:', deleteError);
    }
    
    // Insert new puzzle
    const { data: newPuzzle, error: insertError } = await adminClient
      .from('daily_cards')
      .insert({
        puzzle_date: targetDateStr,
        card_id: cardId,
      })
      .select(`
        id,
        puzzle_date,
        card_id,
        cards (
          name,
          set_code,
          collector_number
        )
      `)
      .single();
    
    if (insertError) {
      console.error('Error inserting puzzle:', insertError);
      return NextResponse.json(
        { error: 'Failed to create puzzle' },
        { status: 500 }
      );
    }
    
    console.log(`Successfully created puzzle for ${targetDateStr}:`, newPuzzle);
    
    return NextResponse.json({
      success: true,
      puzzleDate: targetDateStr,
      puzzleId: newPuzzle.id,
      card: (newPuzzle as any).cards,
    });
  } catch (error) {
    console.error('Error in /api/cron/riftle-daily:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Bob
