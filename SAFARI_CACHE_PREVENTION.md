# Safari Cache Prevention Guide

## How to Avoid Safari Cache Issues in the Future

### Root Causes
Safari is more aggressive with caching than Chrome/Firefox, especially for:
- JavaScript bundles
- CSS files
- Image optimization
- Service workers

### Prevention Strategies

#### 1. Development Configuration (Already Implemented)
The `next.config.mjs` now includes:
- **Cache-busting headers** in development mode
- **Disabled image optimization** in development (Safari compatibility)
- **No-store cache headers** to prevent aggressive caching

#### 2. Best Practices

**For Developers:**
- Always clear `.next` folder when switching branches or after major changes:
  ```bash
  rm -rf .next && npm run dev
  ```
- Use Safari's Develop menu → Empty Caches regularly during development
- Clear website data for localhost in Safari Settings → Privacy → Manage Website Data

**For Production:**
- The production build uses optimized images (enabled in production)
- Cache headers are appropriate for production (allows caching)
- Versioned assets prevent stale cache issues

#### 3. When Issues Occur

**Quick Fix Steps:**
1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server: `npm run dev`
3. Clear Safari website data: Safari → Settings → Privacy → Manage Website Data → Remove localhost
4. Hard refresh: Cmd+Shift+R (or Cmd+Option+R)

**If Still Not Working:**
- Check Safari console (Develop → Show Web Inspector)
- Try Safari Private/Incognito mode (bypasses all cache)
- Verify the issue is Safari-specific (test in Chrome/Firefox)
- Check if it's a code issue or cache issue (compare with production)

#### 4. Configuration Notes

The current `next.config.mjs` configuration:
- **Development**: Aggressive cache-busting, no image optimization
- **Production**: Normal caching, optimized images

This setup prevents Safari cache issues in development while maintaining performance in production.
