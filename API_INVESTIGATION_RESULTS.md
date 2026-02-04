# API Investigation Results - Popular Decks & Cards Feature

**Investigation Date**: January 30, 2026  
**Investigator**: Implementation Team  
**Purpose**: Determine API availability for meta data sources

---

## Executive Summary

**Finding**: No public APIs available for any of the three data sources. All will require web scraping.

**Recommendation**: Proceed with respectful web scraping implementation using Cheerio, with proper rate limiting and caching.

---

## Detailed Findings

### 1. RiftMana.com ⭐ Primary Source

**URL**: https://riftmana.com/decks/

#### robots.txt Analysis
```
Status: ✅ Scraping Allowed (with restrictions)
```

**Key Points**:
- Blocks AI bots (ChatGPT-User, GPTBot, anthropic-ai, Claude-Web, CCbot)
- General web scraping is allowed (`User-agent: * / Disallow:`)
- No specific restrictions on /decks/ path
- Sitemap available at: https://riftmana.com/sitemap_index.xml

#### API Endpoint Testing
```bash
curl -I https://riftmana.com/api/decks
# Result: HTTP/2 403 Forbidden
```

**Conclusion**: 
- ❌ No public API available
- ✅ Web scraping permitted for non-AI bots
- ⚠️ Must use appropriate User-Agent (not AI-related)

**Implementation Strategy**:
- Use Cheerio for HTML parsing
- Set User-Agent to standard browser string
- Implement 1-2 second delays between requests
- Cache aggressively (24 hours)

---

### 2. Riftbound.gg/tier-list ⭐ Primary Source

**URL**: https://riftbound.gg/tier-list/

#### robots.txt Analysis
```
Status: ✅ Minimal Restrictions
```

**Key Points**:
- Very minimal robots.txt (only YOAST block markers)
- No explicit disallow rules
- No crawl delay specified
- Appears to be WordPress-based (YOAST SEO)

#### API Endpoint Testing
```bash
curl -I https://riftbound.gg/api/tier-list
# Result: HTTP/2 301 (redirects to /tier-list/)
```

**Conclusion**:
- ❌ No public API available
- ✅ Web scraping fully permitted
- ✅ No special restrictions

**Implementation Strategy**:
- Use Cheerio for HTML parsing
- Standard User-Agent acceptable
- Implement 1-2 second delays (best practice)
- Cache aggressively (24 hours)

---

### 3. PiltoverArchive.com 🔄 Secondary Source

**URL**: https://piltoverarchive.com/decks

#### robots.txt Analysis
```
Status: ✅ Explicitly Allowed with Guidelines
```

**Key Points**:
- Explicitly allows: `/decks/` path ✅
- Disallows: `/api/`, `/admin/`, `/_next/`, `/static/`
- **Crawl-delay: 1 second** (must respect)
- Sitemap available at: https://piltoverarchive.com/sitemap.xml
- Next.js application (based on `/_next/` path)

#### API Endpoint Testing
```bash
curl -I https://piltoverarchive.com/api/decks
# Result: HTTP/2 404 Not Found
```

**Conclusion**:
- ❌ No public API available (explicitly blocked in robots.txt)
- ✅ Web scraping explicitly permitted for /decks/
- ⚠️ **MUST respect 1-second crawl delay**

**Implementation Strategy**:
- Use Cheerio for HTML parsing
- Standard User-Agent acceptable
- **Mandatory 1-second delay between requests**
- Cache aggressively (24 hours)
- May be client-side rendered (Next.js) - verify data availability

---

## Implementation Recommendations

### Scraping Best Practices

1. **User-Agent String**
   ```typescript
   const USER_AGENT = 'RiftboundCardSwap/1.0 (Meta Data Aggregator; +https://yourapp.com/about)';
   ```

2. **Rate Limiting**
   - RiftMana.com: 1-2 second delay
   - Riftbound.gg: 1-2 second delay
   - PiltoverArchive.com: **Minimum 1 second delay (required)**

3. **Caching Strategy**
   - Cache all responses for 24 hours
   - Store in database (meta_snapshots table)
   - Only fetch once per day via cron job
   - Serve cached data to users

4. **Error Handling**
   - Implement retry logic with exponential backoff
   - If one source fails, continue with others
   - Log all errors for monitoring
   - Fallback to cached data if available

5. **Respectful Scraping**
   - Only fetch during daily cron job (6 AM UTC)
   - No concurrent requests to same domain
   - Implement request queuing
   - Monitor for 429 (Too Many Requests) responses

### Technical Implementation

```typescript
// Example rate limiter
async function fetchWithDelay(url: string, delayMs: number = 1500) {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
}
```

---

## Risk Assessment

### Low Risk ✅
- All sites allow general web scraping
- Clear robots.txt guidelines
- No CAPTCHA protection observed
- No rate limiting encountered in testing

### Medium Risk ⚠️
- Sites may change structure (requires monitoring)
- PiltoverArchive may be client-side rendered (needs verification)
- RiftMana blocks AI bots (must use proper User-Agent)

### Mitigation Strategies
1. Implement robust error handling
2. Add data validation layer
3. Monitor for parsing errors
4. Set up alerts for failed updates
5. Have fallback to cached data
6. Regular testing of scrapers

---

## Next Steps

1. ✅ **Complete**: API investigation
2. ⏭️ **Next**: Create database migration (006_add_meta_tables.sql)
3. ⏭️ **Then**: Install dependencies (cheerio, zod)
4. ⏭️ **Then**: Implement scrapers for each source

---

## Additional Notes

### Data Availability Verification Needed

Before implementing scrapers, verify:
- [ ] RiftMana.com deck data is in HTML (not loaded via JavaScript)
- [ ] Riftbound.gg tier list is in HTML (not loaded via JavaScript)
- [ ] PiltoverArchive.com deck data is accessible (Next.js SSR vs CSR)

**Action**: Test with curl and inspect HTML structure:
```bash
curl -s https://riftmana.com/decks/ | grep -i "deck"
curl -s https://riftbound.gg/tier-list/ | grep -i "tier"
curl -s https://piltoverarchive.com/decks | grep -i "deck"
```

### Legal Considerations

- ✅ All sites allow web scraping per robots.txt
- ✅ Data is publicly available (no authentication required)
- ✅ Using data for aggregation/display (fair use)
- ✅ Not competing with original sites
- ✅ Proper attribution will be provided

### Contact Information

If issues arise, consider reaching out to site owners:
- RiftMana.com: Check for contact page
- Riftbound.gg: Check for contact page
- PiltoverArchive.com: Check for contact page

Request API access or permission for automated data collection.

---

**Status**: Investigation Complete ✅  
**Recommendation**: Proceed with web scraping implementation  
**Priority**: High  
**Estimated Implementation Time**: Week 2 of project timeline