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
    
    // Get user from auth
    const cookieHeader = request.headers.get('cookie') || '';
    const accessTokenMatch = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);
    
    if (!accessTokenMatch) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let user = null;
    try {
      const tokenData = JSON.parse(decodeURIComponent(accessTokenMatch[1]));
      const accessToken = tokenData.access_token;
      const { data: { user: authUser } } = await supabase.auth.getUser(accessToken);
      user = authUser;
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

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
    
    const { error: updateError } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        [updateField]: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      });

    if (updateError) {
      console.error('Error updating tutorial flag:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tutorial status' },
        { status: 500 }
      );
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