# Contributing to RifTrade

Thank you for your interest in contributing to RifTrade! This document provides guidelines for contributing to this open-source project.

## Getting Started

1. **Fork the repository** and clone your fork locally
2. **Install dependencies**: `npm install`
3. **Set up environment**: Copy `.env.example` to `.env.local` and configure your Supabase credentials
4. **Run migrations**: Execute SQL files in `supabase/migrations/` in your Supabase project
5. **Start development server**: `npm run dev`

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code patterns and structure
- Use meaningful variable and function names
- Add comments for complex logic

### Security
- All user inputs must be sanitized (see `lib/sanitize.ts` and `lib/sanitize-input.ts`)
- URL parameters must be validated (see `lib/validate-username.ts`)
- Never commit API keys or sensitive credentials
- Review security implications of any database changes

### Testing
- Test your changes in the browser before submitting
- Run the security test script: `npx tsx scripts/test-security.ts`
- Verify that existing functionality still works

## Pull Request Process

1. **Create a feature branch** from `main`: `git checkout -b feature/your-feature-name`
2. **Make your changes** following the guidelines above
3. **Test thoroughly** - ensure all functionality works as expected
4. **Commit your changes** with clear, descriptive commit messages
5. **Push to your fork** and create a Pull Request

### PR Requirements
- Clear description of what the PR does and why
- Any breaking changes must be documented
- Code should be self-documenting with clear variable names
- Security-sensitive changes should include a brief security note

### What We're Looking For
- Bug fixes
- Performance improvements
- UI/UX enhancements
- Security improvements
- Documentation updates
- Feature additions that align with the project's goals

## Current Priority Tasks

### Email Notifications for New Matches
**Status:** High Priority

**Problem:** Users currently have no way to be notified when someone else's card changes create a new match with their profile. This requires implementing an email notification system.

**Requirements:**
- Add a checkbox in the profile page to enable/disable email notifications
- Store the preference in the database (add field to `profiles` table)
- When a match is detected, only the **passive user** (the one being matched, not the one making changes) should receive an email notification
- Only send emails if the passive user has email notifications enabled
- The active user (the one changing their cards) should NOT receive an email

**Technical Considerations:**
- No free unlimited email service is easily available, so research email service options (SendGrid, Mailgun, Resend, etc.)
- Consider using Supabase Edge Functions or Next.js API routes for sending emails
- Match detection logic is in `lib/match-storage.ts` - `detectAndStoreMatches` function
- Need to identify which user is "active" (making changes) vs "passive" (being matched)

**Resources:**
- Match storage logic: `lib/match-storage.ts`
- Profile page: `app/profile/page.tsx`
- Database schema: `supabase/migrations/`

### Support Multiple Tabs
**Status:** High Priority

**Problem:** When users have multiple tabs of the app open, Supabase auth initialization can cause conflicts, leading to AbortErrors and preventing data from loading. This is due to Web Lock conflicts when multiple tabs try to initialize Supabase simultaneously.

**What's Needed:**
- Investigate Supabase's Web Lock mechanism and multi-tab handling
- Implement a solution that allows multiple tabs to work simultaneously without conflicts
- Ensure auth state syncs properly across tabs
- Test thoroughly with multiple tabs open

**Resources:**
- Supabase client configuration in `lib/supabase/client.ts`
- Error handling in `app/cards/page.tsx` and `app/profile/page.tsx`
- Related GitHub issues: [supabase/supabase-js#1594](https://github.com/supabase/supabase-js/issues/1594)

## Project Structure

- `app/` - Next.js pages and routes
- `components/` - Reusable React components
- `lib/` - Utility functions, sanitization, validation
- `scripts/` - Database seeding and utility scripts
- `supabase/migrations/` - Database schema migrations

## Questions?

If you have questions or need clarification, please open an issue for discussion before starting work on a large feature.

Thank you for contributing to RifTrade!
