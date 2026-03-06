import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_LENGTH = 100;
const MAX_PER_24H = 5;
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_COOKIE = 'rift_suggestion_rate';

/** Sanitize: allow letters, digits, spaces, basic punctuation. Block injection patterns. */
function sanitize(text: string): string {
  const trimmed = text.trim();
  // Remove/escape dangerous chars that could enable markdown/code injection
  let out = trimmed
    .replace(/[<>\\`]/g, '')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');
  return out.slice(0, MAX_LENGTH);
}

function parseRateCookie(cookieHeader: string | null): number[] {
  if (!cookieHeader) return [];
  const match = cookieHeader.match(new RegExp(`${RATE_COOKIE}=([^;]+)`));
  if (!match) return [];
  try {
    const decoded = decodeURIComponent(match[1]);
    const arr = JSON.parse(decoded) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => typeof x === 'number');
  } catch {
    return [];
  }
}

function getRateLimitResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Rate limit: maximum 5 suggestions per 24 hours. Please try again tomorrow.' },
    { status: 429 }
  );
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  // Create Supabase client with anon key
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Get Authorization header (Supabase client-side sends this)
  const authHeader = request.headers.get('authorization');
  console.log('[Suggestions API] Auth header present:', !!authHeader);
  
  let user = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('[Suggestions API] Auth error:', authError.message);
    } else {
      console.log('[Suggestions API] User authenticated via Bearer:', authUser?.id);
      user = authUser;
    }
  }
  
  // If no Bearer token, try cookie-based auth (fallback)
  if (!user) {
    const cookieHeader = request.headers.get('cookie') || '';
    const accessTokenMatch = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);
    
    if (accessTokenMatch) {
      try {
        const encodedToken = decodeURIComponent(accessTokenMatch[1]);
        let tokenData;
        
        if (encodedToken.startsWith('base64-')) {
          const base64String = encodedToken.substring(7);
          const decodedString = Buffer.from(base64String, 'base64').toString('utf-8');
          tokenData = JSON.parse(decodedString);
        } else {
          tokenData = JSON.parse(encodedToken);
        }
        
        const accessToken = tokenData.access_token;
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(accessToken);
        
        if (authError) {
          console.error('[Suggestions API] Cookie auth error:', authError.message);
        } else {
          console.log('[Suggestions API] User authenticated via cookie:', authUser?.id);
          user = authUser;
        }
      } catch (err: any) {
        console.error('[Suggestions API] Cookie parsing error:', err.message);
      }
    }
  }

  if (!user) {
    console.log('[Suggestions API] No user found');
    return NextResponse.json(
      { success: false, error: 'Please sign in to submit a suggestion.' },
      { status: 401 }
    );
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER || 'guygir';
  const repo = process.env.GITHUB_REPO_NAME || 'RifTrade';

  if (!token) {
    console.error('GITHUB_TOKEN not configured');
    return NextResponse.json(
      { success: false, error: 'Suggestion service not configured.' },
      { status: 503 }
    );
  }

  // Rate limit (cookie-based)
  const rateCookieHeader = request.headers.get('cookie');
  const timestamps = parseRateCookie(rateCookieHeader);
  const now = Date.now();
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= MAX_PER_24H) {
    return getRateLimitResponse();
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request.' },
      { status: 400 }
    );
  }

  const raw = typeof body?.text === 'string' ? body.text : '';
  const sanitized = sanitize(raw);
  if (sanitized.length === 0) {
    return NextResponse.json(
      { success: false, error: `Please enter a suggestion (max ${MAX_LENGTH} characters).` },
      { status: 400 }
    );
  }

  // Get user's username from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .maybeSingle();

  const username = profile?.username || user.user_metadata?.username || 'Anonymous';
  const email = user.email || 'no-email';

  const title = `User Suggestion: ${sanitized.slice(0, 80)}${sanitized.length > 80 ? '...' : ''}`;
  const bodyText = `${sanitized}

---
**Submitted by:** ${username}
**Email:** ${email}
**User ID:** ${user.id}
**Date:** ${new Date().toISOString()}`;

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body: bodyText,
        labels: ['user-suggestion'],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const ghMessage = typeof data?.message === 'string' ? data.message : '';
      console.error('GitHub API error:', res.status, data);
      const isDev = process.env.NODE_ENV === 'development';
      return NextResponse.json(
        {
          success: false,
          error: isDev && ghMessage
            ? `GitHub API: ${ghMessage}`
            : 'Failed to create issue. Please try again later.',
        },
        { status: 502 }
      );
    }

    const issueUrl = data.html_url ?? '';

    // Update rate limit cookie
    const newTimestamps = [...recent, now].slice(-MAX_PER_24H);
    const response = NextResponse.json({
      success: true,
      issueUrl,
    });
    
    response.cookies.set(RATE_COOKIE, JSON.stringify(newTimestamps), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: RATE_WINDOW_MS / 1000,
      path: '/',
    });
    
    return response;
  } catch (err) {
    console.error('Suggestion error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to submit. Please try again later.' },
      { status: 500 }
    );
  }
}

// Made with Bob