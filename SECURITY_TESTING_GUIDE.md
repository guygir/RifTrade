# Security Testing Guide

This guide helps you manually test the security fixes in your browser.

## Prerequisites

1. Make sure the dev server is running: `npm run dev`
2. Open your browser to `http://localhost:3000`
3. Open browser DevTools (F12 or Cmd+Option+I)

## Test 1: XSS Protection - Display Sanitization

### Test Display Name
1. Go to `/profile` and log in
2. Try entering these malicious inputs in the "Display Name" field:
   - `<script>alert('XSS')</script>`
   - `<img src=x onerror=alert('XSS')>`
   - `<svg onload=alert('XSS')>`
   - `Hello <b>World</b>`
3. Save the profile
4. View your profile at `/[your-username]`
5. **Expected**: No JavaScript should execute. HTML tags should be stripped or escaped.

### Test Contact Info
1. In profile, try entering in "Contact Info":
   - `<script>alert('XSS')</script>email@test.com`
   - `<a href="javascript:alert('XSS')">Click me</a>`
   - `email@test.com` (should work fine)
   - `<a href="https://example.com">My Site</a>` (should allow safe links)
2. Save and view profile
3. **Expected**: Scripts blocked, but safe links may be preserved.

### Test Trading Locations
1. Try entering in "Trading Locations":
   - `<script>alert('XSS')</script>`
   - `<b>Location</b>`
2. Save and view
3. **Expected**: All HTML stripped, only plain text shown.

## Test 2: URL Parameter Validation

### Test Path Traversal
Try accessing these URLs (should all show 404 or error):
- `http://localhost:3000/../../../admin`
- `http://localhost:3000/username%2F..%2Ftest`
- `http://localhost:3000/username%2e%2e%2fadmin`
- `http://localhost:3000/..\\..\\windows`

**Expected**: All should be blocked and show "Profile Not Found" or 404.

### Test Invalid Usernames
Try these URLs:
- `http://localhost:3000/ab` (too short)
- `http://localhost:3000/username<script>alert('XSS')</script>`
- `http://localhost:3000/user name` (space)
- `http://localhost:3000/user/name` (slash)

**Expected**: All should be blocked.

### Test Valid Usernames
- `http://localhost:3000/valid-username_123` (should work)
- `http://localhost:3000/ValidUsername` (should work, case-insensitive)

## Test 3: Input Sanitization on Save

### Test Length Limits
1. Go to `/profile`
2. Try entering very long strings:
   - Display Name: 200+ characters (should be truncated to 100)
   - Contact Info: 600+ characters (should be truncated to 500)
   - Trading Locations: 300+ characters (should be truncated to 200)
   - Username: 50+ characters (should be truncated to 30)
3. Save and check what was actually saved
4. **Expected**: All should be truncated to their limits.

### Test HTML in Inputs
1. Enter HTML in all fields:
   - Display Name: `<script>alert('XSS')</script>Test`
   - Contact Info: `<script>alert('XSS')</script>email@test.com`
   - Trading Locations: `<b>Location</b>`
2. Save
3. View the profile
4. **Expected**: HTML should be stripped before saving to database.

## Test 4: Security Headers

1. Open DevTools → Network tab
2. Reload the page
3. Click on the main document request (usually the first one)
4. Check the "Response Headers" section
5. Look for these headers:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy` (should contain multiple directives)

**Expected**: All security headers should be present.

### Test CSP (Content Security Policy)
1. In browser console, try:
   ```javascript
   eval('alert("test")');
   ```
2. **Expected**: Should be blocked by CSP (you'll see a CSP violation error)

3. Check console for any CSP violations when loading the page
4. **Expected**: No violations if everything is configured correctly

## Test 5: Search Results Sanitization

1. Create a test profile with malicious content:
   - Display Name: `<script>alert('XSS')</script>`
   - Contact Info: `<img src=x onerror=alert('XSS')>`
2. Go to `/search`
3. Search for users
4. **Expected**: Malicious content should be sanitized in search results

## Test 6: Notification Bell Sanitization

1. Create a match with a user who has malicious display name
2. Click the notification bell
3. **Expected**: Display names should be sanitized

## Automated Testing Script

Run the validation tests:
```bash
npx tsx scripts/test-security.ts
```

This tests the username validation logic (works in Node.js).

## What to Look For

### ✅ Success Indicators:
- No JavaScript alerts pop up unexpectedly
- HTML tags are stripped or escaped in display
- Invalid usernames in URLs show 404
- Long inputs are truncated
- Security headers are present
- No CSP violations in console

### ❌ Failure Indicators:
- JavaScript executes from user input
- HTML renders in user content
- Path traversal URLs work
- Inputs exceed length limits
- Missing security headers
- CSP violations in console

## Reporting Issues

If you find any security issues:
1. Document the exact steps to reproduce
2. Note what happened vs. what should happen
3. Check browser console for errors
4. Verify the fix is applied correctly

## Additional Tools

For more comprehensive testing, consider:
- **OWASP ZAP**: Automated security scanner
- **Burp Suite**: Manual security testing
- **Browser DevTools**: Check for console errors and network requests
