# Popular Decks & Cards Feature - Executive Summary

## 🎯 Feature Overview

Add a **Popular/Successful Decks & Cards** feature to display current meta information on the main page and cards page, helping users understand which decks and cards are performing well in the competitive scene.

## 📊 Data Sources Evaluated

| Source | Status | Data Available | Recommendation |
|--------|--------|----------------|----------------|
| **RiftMana.com** | ✅ Accessible | Trending decks, prices, archetypes, view counts | ⭐ **Primary** |
| **Riftbound.gg/tier-list** | ✅ Accessible | S/T1/T2/T3 tier rankings, meta snapshots | ⭐ **Primary** |
| **PiltoverArchive.com** | ✅ Accessible | Tournament results, deck lists, view counts | 🔄 **Secondary** |
| **Mobalytics.gg** | ⚠️ Moderate | Tier lists, guides | 🔄 **Tertiary** |
| **RiftDecks.com** | ❌ CAPTCHA | Deck database | ❌ Not recommended |
| **Riftbound.gg/DECKS** | ❌ Loading issues | Deck lists | ❌ Not recommended |

## 🏗️ Technical Architecture

### Database Schema
- **meta_snapshots** - Track data fetch timestamps
- **popular_decks** - Store trending decks with tier rankings
- **popular_cards** - Store card usage statistics derived from decks

### Service Layer
- **Data Fetchers** - RiftMana, Riftbound tier list, PiltoverArchive
- **Transformers** - Normalize data from different sources
- **Aggregator** - Combine and calculate popularity metrics
- **Cache Manager** - 24-hour caching mechanism

### API Routes
- `GET /api/meta/decks` - Fetch popular decks (public)
- `GET /api/meta/cards` - Fetch popular cards (public)
- `POST /api/meta/refresh` - Trigger data update (protected)

### UI Components
- **PopularDecks** - Display on main page with tier badges
- **PopularCards** - Display on cards page with usage stats

### Automation
- **Daily Cron Job** - Update data at 6 AM UTC
- **Options**: Vercel Cron, GitHub Actions, or Supabase Edge Functions

## 📅 Implementation Timeline

### Week 1: Research & Setup (5 days)
- Investigate API availability for each source
- Check robots.txt and terms of service
- Create database migrations
- Set up project structure

### Week 2: Data Fetching (5 days)
- Implement RiftMana fetcher (API or scraper)
- Implement Riftbound tier list fetcher
- Create data normalizers and transformers
- Build card extraction logic
- Test data aggregation

### Week 3: API & Caching (5 days)
- Build API routes for decks and cards
- Implement 24-hour caching mechanism
- Set up cron job configuration
- Add error handling and logging
- Test data refresh cycle

### Week 4: UI & Polish (5 days)
- Create PopularDecks component
- Create PopularCards component
- Integrate into main and cards pages
- Add loading and error states
- Write documentation
- Deploy and test

**Total Estimated Time**: 4 weeks

## 💰 Cost Analysis

### Free Tier Compatibility
- ✅ All data sources appear to be free (no API keys required)
- ✅ Supabase free tier sufficient for database
- ✅ Vercel free tier includes cron jobs
- ✅ No additional paid services needed

### Resource Usage
- **Database**: ~1-2 MB per snapshot (minimal)
- **API Calls**: 3-6 requests per day (very low)
- **Bandwidth**: Minimal (cached responses)

## 🎨 User Experience

### Main Page
```
┌─────────────────────────────────────┐
│ Popular Meta Decks                  │
├─────────────────────────────────────┤
│ [S] [1] [2] [3] [All] ← Tier Filter│
│                                     │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│ │Tier│ │Tier│ │Tier│ │Tier│       │
│ │ S  │ │ 1  │ │ 1  │ │ 2  │       │
│ │Deck│ │Deck│ │Deck│ │Deck│       │
│ │Name│ │Name│ │Name│ │Name│       │
│ │$80 │ │$120│ │$95 │ │$65 │       │
│ └────┘ └────┘ └────┘ └────┘       │
│                                     │
│ Last updated: 2 hours ago           │
└─────────────────────────────────────┘
```

### Cards Page
```
┌─────────────────────────────────────┐
│ Popular Cards in Meta               │
├─────────────────────────────────────┤
│ [All] [>50%] [>25%] [>10%] ← Filter│
│                                     │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│ │Card│ │Card│ │Card│ │Card│       │
│ │Img │ │Img │ │Img │ │Img │       │
│ │75% │ │68% │ │52% │ │45% │       │
│ │S:5 │ │S:3 │ │S:2 │ │S:1 │       │
│ │T1:8│ │T1:9│ │T1:6│ │T1:4│       │
│ └────┘ └────┘ └────┘ └────┘       │
│                                     │
│ Last updated: 2 hours ago           │
└─────────────────────────────────────┘
```

## ✅ Success Criteria

- [ ] Data updates automatically every 24 hours
- [ ] Popular decks display on main page (top 8)
- [ ] Popular cards display on cards page (top 20-30)
- [ ] Tier rankings are accurate and current
- [ ] Page load time remains under 2 seconds
- [ ] No scraping errors or rate limit issues
- [ ] Users can filter by tier and archetype
- [ ] Mobile-responsive design
- [ ] Graceful error handling
- [ ] Clear "last updated" timestamps

## 🔒 Security & Best Practices

### Scraping Ethics
- ✅ Respect robots.txt
- ✅ Use appropriate User-Agent
- ✅ Implement rate limiting (1-2s delays)
- ✅ Cache aggressively (24 hours)
- ✅ Handle errors gracefully
- ✅ Don't overwhelm target servers

### API Security
- ✅ Public read endpoints (no auth needed)
- ✅ Protected refresh endpoint (CRON_SECRET)
- ✅ Rate limiting per IP
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Supabase)

## 📈 Future Enhancements

1. **Deck Builder Integration** - Import popular decks
2. **Price Tracking** - Track deck price changes over time
3. **Meta History** - Show meta evolution
4. **Notifications** - Alert when user's cards become meta
5. **Deck Comparison** - Compare collection to meta decks
6. **Win Rate Data** - If available from sources
7. **Tournament Results** - Integrate tournament data
8. **Card Synergies** - Show which cards are played together

## 📚 Documentation Delivered

1. **POPULAR_DECKS_CARDS_PLAN.md** (449 lines)
   - Detailed implementation plan
   - Data source analysis
   - Database schema
   - Service architecture
   - API specifications
   - UI component designs
   - Cron job configuration
   - Dependencies and environment variables

2. **POPULAR_DECKS_ARCHITECTURE.md** (449 lines)
   - High-level architecture diagram
   - Data flow diagrams
   - Component interaction flows
   - Error handling flows
   - Database relationships
   - Caching strategy
   - Security considerations
   - Monitoring and logging

3. **IMPLEMENTATION_QUICK_START.md** (449 lines)
   - Quick reference guide
   - Week-by-week implementation steps
   - Code examples for key files
   - Testing commands
   - Deployment checklist
   - Important notes and warnings

4. **FEATURE_SUMMARY.md** (This document)
   - Executive overview
   - Timeline and cost analysis
   - Success criteria
   - User experience mockups

## 🚀 Next Steps

### Immediate Actions
1. Review and approve this plan
2. Decide on implementation approach (API vs scraping)
3. Set up development environment
4. Create database migrations

### Short-term (Week 1)
1. Investigate API availability
   - Check for `/api` endpoints on each site
   - Review robots.txt files
   - Test sample requests
2. Set up database schema
   - Run migration 006_add_meta_tables.sql
   - Verify tables created correctly
3. Install dependencies
   - `npm install cheerio zod`
   - `npm install -D @types/cheerio`

### Medium-term (Weeks 2-3)
1. Implement data fetchers
   - RiftMana.com fetcher
   - Riftbound.gg tier list fetcher
   - Data normalizers
2. Build API routes
   - `/api/meta/decks`
   - `/api/meta/cards`
   - `/api/meta/refresh`
3. Set up cron job
   - Configure Vercel cron or GitHub Actions
   - Test automated updates

### Long-term (Week 4)
1. Create UI components
   - PopularDecks component
   - PopularCards component
2. Integrate into pages
   - Add to main page
   - Add to cards page
3. Testing and deployment
   - Test all functionality
   - Deploy to production
   - Monitor for issues

## ⚠️ Risk Mitigation

### Risk: Sites block scraping
**Mitigation**: 
- Contact site owners for API access
- Implement respectful scraping practices
- Have fallback to manual data entry
- Use multiple sources for redundancy

### Risk: Data structure changes
**Mitigation**:
- Implement robust error handling
- Add data validation layer
- Monitor for parsing errors
- Have alerts for failed updates

### Risk: Performance issues
**Mitigation**:
- Implement aggressive caching
- Use database indexes
- Paginate results
- Lazy load images
- Monitor query performance

### Risk: Stale data
**Mitigation**:
- Show "last updated" timestamp
- Allow manual refresh
- Set up monitoring alerts
- Have fallback to cached data

## 📊 Key Metrics to Track

### Technical Metrics
- Update success rate (target: >95%)
- Average update duration (target: <30 seconds)
- Cache hit rate (target: >90%)
- API response times (target: <500ms)
- Error frequency by source (target: <5%)

### User Metrics
- Page views on popular decks section
- Click-through rate on deck cards
- Filter usage statistics
- Time spent on meta pages
- User feedback and satisfaction

## 💡 Implementation Tips

1. **Start Small**: Begin with one data source (RiftMana) and expand
2. **Test Early**: Test scraping logic before building full system
3. **Log Everything**: Comprehensive logging helps debug issues
4. **Cache Aggressively**: Minimize external requests
5. **Handle Errors Gracefully**: Don't let one source failure break everything
6. **Monitor Continuously**: Set up alerts for failures
7. **Document As You Go**: Keep documentation updated
8. **Get User Feedback**: Test with real users early

## 🎓 Learning Resources

### Web Scraping
- Cheerio documentation: https://cheerio.js.org/
- Respectful scraping guide: https://www.scrapehero.com/web-scraping-best-practices/

### Cron Jobs
- Vercel Cron: https://vercel.com/docs/cron-jobs
- GitHub Actions: https://docs.github.com/en/actions

### Database Design
- PostgreSQL best practices: https://wiki.postgresql.org/wiki/Don't_Do_This
- Supabase documentation: https://supabase.com/docs

## 📞 Support & Questions

If you encounter issues during implementation:
1. Check the detailed plans in other documentation files
2. Review error logs for specific issues
3. Test each component independently
4. Consult the quick start guide for code examples
5. Consider reaching out to data source owners for API access

## ✨ Conclusion

This feature will significantly enhance your Riftbound card swap app by providing users with valuable meta insights. The implementation is straightforward, cost-effective (free), and designed to be maintainable and scalable.

**Estimated Value**:
- Increased user engagement
- Better informed trading decisions
- Competitive advantage over similar apps
- Foundation for future meta-related features

**Ready to proceed?** Switch to Code mode and start with Week 1 tasks!

---

**Document Version**: 1.0  
**Last Updated**: January 30, 2026  
**Status**: Planning Complete - Ready for Implementation  
**Priority**: High  
**Complexity**: Medium  
**Estimated Effort**: 4 weeks (80-100 hours)
