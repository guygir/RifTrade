// GET /api/meta/decks - Fetch popular decks from the meta
// Public endpoint with query parameters for filtering

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isCacheValid, getCacheAge, formatCacheAge } from '@/lib/meta-data/cache-manager';

// Force Node.js runtime for consistency
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') || 'all';
    const archetype = searchParams.get('archetype') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache validity
    const cacheValid = await isCacheValid(supabaseUrl, supabaseKey);
    const cacheAge = await getCacheAge(supabaseUrl, supabaseKey);

    // Get the latest snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('meta_snapshots')
      .select('id, snapshot_date, metadata')
      .eq('source', 'combined')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (snapshotError || !snapshot) {
      return NextResponse.json(
        { 
          error: 'No meta data available',
          message: 'Meta data has not been fetched yet. Please try again later.'
        },
        { status: 404 }
      );
    }

    // Build query for popular decks
    let query = supabase
      .from('popular_decks')
      .select('*')
      .eq('snapshot_id', snapshot.id)
      .order('popularity_score', { ascending: false });

    // Apply filters
    if (tier !== 'all') {
      query = query.eq('tier_rank', tier);
    }

    if (archetype !== 'all') {
      query = query.eq('archetype', archetype);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: decks, error: decksError } = await query;

    if (decksError) {
      console.error('[API /meta/decks] Database error:', decksError);
      return NextResponse.json(
        { error: 'Failed to fetch decks', details: decksError.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('popular_decks')
      .select('id', { count: 'exact', head: true })
      .eq('snapshot_id', snapshot.id);

    if (tier !== 'all') {
      countQuery = countQuery.eq('tier_rank', tier);
    }

    if (archetype !== 'all') {
      countQuery = countQuery.eq('archetype', archetype);
    }

    const { count } = await countQuery;

    // Return response
    return NextResponse.json({
      success: true,
      data: decks || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
      cache: {
        snapshot_date: snapshot.snapshot_date,
        age_hours: cacheAge,
        age_formatted: cacheAge ? formatCacheAge(cacheAge) : 'Unknown',
        is_stale: !cacheValid,
      },
      filters: {
        tier,
        archetype,
      },
    });

  } catch (error) {
    console.error('[API /meta/decks] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Made with Bob
