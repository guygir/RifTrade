// POST /api/meta/refresh - Trigger meta data refresh
// Protected endpoint - requires CRON_SECRET for authentication
// Used by Vercel cron jobs or manual refresh

import { NextRequest, NextResponse } from 'next/server';
import { aggregateMetaData } from '@/lib/meta-data/meta-aggregator';

// Force Node.js runtime for cheerio compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cronSecret = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (!cronSecret) {
      console.error('[API /meta/refresh] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (providedSecret !== cronSecret) {
      console.warn('[API /meta/refresh] Unauthorized refresh attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if meta updates are enabled
    const metaUpdateEnabled = process.env.META_UPDATE_ENABLED !== 'false';
    if (!metaUpdateEnabled) {
      return NextResponse.json({
        success: false,
        message: 'Meta updates are disabled',
        skipped: true,
      });
    }

    console.log('[API /meta/refresh] Starting meta data refresh...');
    const startTime = Date.now();

    // Trigger the aggregation process
    const result = await aggregateMetaData(supabaseUrl, supabaseKey);

    const duration = Date.now() - startTime;
    console.log(`[API /meta/refresh] Completed in ${duration}ms`);

    // Return detailed results
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Meta data refreshed successfully' : 'Meta data refresh completed with errors',
      duration_ms: duration,
      stats: {
        decks_fetched: result.decksCount || 0,
        cards_analyzed: result.cardsCount || 0,
        snapshot_id: result.snapshotId,
        errors: result.errors,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[API /meta/refresh] Error during refresh:', error);
    
    // Return error details
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh meta data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET handler for status check
export async function GET(request: NextRequest) {
  try {
    // Verify authentication for GET as well
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (!cronSecret || providedSecret !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Import cache manager functions
    const { isCacheValid, getCacheAge, formatCacheAge } = await import('@/lib/meta-data/cache-manager');
    
    const cacheValid = await isCacheValid(supabaseUrl, supabaseKey);
    const cacheAge = await getCacheAge(supabaseUrl, supabaseKey);

    return NextResponse.json({
      success: true,
      cache: {
        is_valid: cacheValid,
        age_hours: cacheAge,
        age_formatted: cacheAge ? formatCacheAge(cacheAge) : 'No data',
        needs_refresh: !cacheValid,
      },
      config: {
        meta_update_enabled: process.env.META_UPDATE_ENABLED !== 'false',
        cache_duration_hours: parseInt(process.env.META_CACHE_DURATION_HOURS || '24'),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[API /meta/refresh] Error checking status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check status',
        message: error instanceof Error ? error.message : 'Unknown error',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Made with Bob
