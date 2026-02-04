// GET /api/meta/cards - Fetch popular cards from the meta
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
    const minUsage = parseFloat(searchParams.get('minUsage') || '0');
    const tier = searchParams.get('tier') || 'all';
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (minUsage < 0 || minUsage > 100) {
      return NextResponse.json(
        { error: 'minUsage must be between 0 and 100' },
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

    // Build query for popular cards with card details
    let query = supabase
      .from('popular_cards')
      .select(`
        *,
        cards:card_id (
          id,
          name,
          set_code,
          collector_number,
          image_url,
          rarity,
          metadata
        )
      `)
      .eq('snapshot_id', snapshot.id)
      .order('usage_percentage', { ascending: false });

    // Apply minimum usage filter
    if (minUsage > 0) {
      query = query.gte('usage_percentage', minUsage);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: cards, error: cardsError } = await query;

    if (cardsError) {
      console.error('[API /meta/cards] Database error:', cardsError);
      return NextResponse.json(
        { error: 'Failed to fetch cards', details: cardsError.message },
        { status: 500 }
      );
    }

    // Filter by tier if specified (check tier_distribution)
    let filteredCards = cards || [];
    if (tier !== 'all' && filteredCards.length > 0) {
      filteredCards = filteredCards.filter(card => {
        const tierDist = card.tier_distribution as Record<string, number>;
        return tierDist && tierDist[tier] && tierDist[tier] > 0;
      });
    }

    // Enrich cards with have/want counts
    const enrichedCards = await Promise.all(
      filteredCards.map(async (card) => {
        // Get have/want counts for this card
        const { count: haveCount } = await supabase
          .from('profile_have_cards')
          .select('id', { count: 'exact', head: true })
          .eq('card_id', card.card_id);

        const { count: wantCount } = await supabase
          .from('profile_want_cards')
          .select('id', { count: 'exact', head: true })
          .eq('card_id', card.card_id);

        return {
          ...card,
          have_count: haveCount || 0,
          want_count: wantCount || 0,
        };
      })
    );

    // Get total count for pagination
    let countQuery = supabase
      .from('popular_cards')
      .select('id', { count: 'exact', head: true })
      .eq('snapshot_id', snapshot.id);

    if (minUsage > 0) {
      countQuery = countQuery.gte('usage_percentage', minUsage);
    }

    const { count } = await countQuery;

    // Return response
    return NextResponse.json({
      success: true,
      data: enrichedCards,
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
        minUsage,
        tier,
      },
    });

  } catch (error) {
    console.error('[API /meta/cards] Unexpected error:', error);
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
