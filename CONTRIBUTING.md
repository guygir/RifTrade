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

## Project Structure

- `app/` - Next.js pages and routes
- `components/` - Reusable React components
- `lib/` - Utility functions, sanitization, validation
- `scripts/` - Database seeding and utility scripts
- `supabase/migrations/` - Database schema migrations

## Questions?

If you have questions or need clarification, please open an issue for discussion before starting work on a large feature.

Thank you for contributing to RifTrade!
