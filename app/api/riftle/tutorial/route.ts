/**
 * POST /api/riftle/tutorial
 * 
 * Mark tutorial step as seen for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface TutorialRequest {
  step: 'intro' | 'feedback';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth (same pattern as submit endpoint)
    let user = null;
    const cookieHeader = request.headers.get('cookie') || '';
    const accessTokenMatch = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);
    
    if (accessTokenMatch) {
      try {
        const tokenData = JSON.parse(decodeURIComponent(accessTokenMatch[1]));
        const accessToken = tokenData.access_token;
        const { data: { user: authUser } } = await supabase.auth.getUser(accessToken);
        user = authUser;
      } catch (error) {
        console.error('Error getting user from token:', error);
        // Continue without user - will return error below
      }
    }
    
    // User must be authenticated for this endpoint
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: TutorialRequest = await request.json();
    const { step } = body;

    if (step !== 'intro' && step !== 'feedback') {
      return NextResponse.json(
        { error: 'Invalid step' },
        { status: 400 }
      );
    }

    // Update the appropriate flag
    const updateField = step === 'intro' ? 'tutorial_seen_intro' : 'tutorial_seen_feedback';
    
    // First check if user_stats row exists
    const { data: existingStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existingStats) {
      // User has stats - just update the tutorial flag
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({
          [updateField]: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating tutorial flag:', updateError);
        return NextResponse.json(
          { error: 'Failed to update tutorial status' },
          { status: 500 }
        );
      }
    } else {
      // No stats yet - create new row with default values
      const { error: insertError } = await supabase
        .from('user_stats')
        .insert({
          user_id: user.id,
          total_games: 0,
          failed_games: 0,
          current_streak: 0,
          max_streak: 0,
          total_score: 0,
          average_guesses: 0,
          solved_distribution: {},
          [updateField]: true,
          updated_at: new Date().toISOString(),
        });
      
      if (insertError) {
        console.error('Error creating user stats with tutorial flag:', insertError);
        return NextResponse.json(
          { error: 'Failed to update tutorial status' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/riftle/tutorial:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Bob