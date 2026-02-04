# Basketball Roguelike - Planning Agent Brief

## 🎯 Your Mission

You are tasked with creating a **comprehensive, detailed, and thorough planning document** for a Basketball Simulation Roguelike PVE game. This game will be built on top of the existing Rift project infrastructure.

---

## 📚 Essential Reading

### Primary Document
**[`BASKETBALL_ROGUELIKE_GAME_DESIGN.md`](./BASKETBALL_ROGUELIKE_GAME_DESIGN.md)** - Read this first! It contains:
- Complete game concept and mechanics
- Player attribute system (hexagon stats)
- Season structure (14 weeks: 11 regular + 3 playoff)
- Weekly action system (3 actions per week)
- Roguelike progression (aging, drafting, unlocks)
- Technical architecture overview
- Open questions for you to address

### Reference Documents (Study These for Patterns)
These documents show how planning was done for a previous feature in this project:

1. **[`Reference Files/FEATURE_SUMMARY.md`](./Reference%20Files/FEATURE_SUMMARY.md)** - Executive summary format
2. **[`Reference Files/IMPLEMENTATION_QUICK_START.md`](./Reference%20Files/IMPLEMENTATION_QUICK_START.md)** - Quick start guide structure
3. **[`Reference Files/POPULAR_DECKS_ARCHITECTURE.md`](./Reference%20Files/POPULAR_DECKS_ARCHITECTURE.md)** - Architecture documentation style
4. **[`Reference Files/POPULAR_DECKS_CARDS_PLAN.md`](./Reference%20Files/POPULAR_DECKS_CARDS_PLAN.md)** - Detailed planning format
5. **[`Reference Files/HANDOFF_TO_IMPLEMENTATION.md`](./Reference%20Files/HANDOFF_TO_IMPLEMENTATION.md)** - Handoff document structure

**Key Takeaway**: Notice how these documents are structured with clear sections, actionable steps, code examples, and visual diagrams. Your plan should follow similar patterns.

---

## 🏗️ Project Context

### Current Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **State Management**: React hooks + Context API

### Existing Project Structure
```
app/                    # Next.js app router pages
  layout.tsx           # Root layout with navigation
  page.tsx             # Home page
  [username]/          # Dynamic user profiles
  api/                 # API routes
  cards/               # Card browsing
  login/               # Authentication
  profile/             # User profile management
  search/              # Search functionality

components/            # Reusable React components
  Navigation.tsx       # Main navigation bar
  NotificationBell.tsx # Real-time notifications
  ThemeProvider.tsx    # Dark mode support
  ThemeToggle.tsx      # Theme switcher

lib/                   # Utility functions and services
  supabase/           # Supabase client setup
    client.ts         # Client-side Supabase
    types.ts          # Database types
  card-display.ts     # Card formatting utilities
  match-calculator.ts # Matching algorithm
  pdf-export.ts       # Export functionality
  sanitize-input.ts   # Input validation
  validate-username.ts # Username validation

supabase/migrations/  # Database migrations
  001_initial_schema.sql
  002_add_quantity_and_locations.sql
  003_add_username.sql
  004_add_notifications.sql
  005_add_tags.sql
  006_add_meta_tables.sql

scripts/              # Utility scripts
  seed-cards.ts       # Database seeding
```

### Key Patterns to Follow
1. **Database Migrations**: All schema changes in numbered SQL files
2. **API Routes**: RESTful endpoints in [`app/api/`](app/api/)
3. **Type Safety**: Strict TypeScript with Zod validation
4. **Component Structure**: Reusable, well-documented components
5. **Supabase Patterns**: Row-level security, real-time subscriptions
6. **Error Handling**: Graceful degradation, user-friendly messages

---

## 🎯 What You Need to Deliver

### 1. Executive Summary Document
Similar to [`FEATURE_SUMMARY.md`](./FEATURE_SUMMARY.md), create a high-level overview:
- Feature description
- Key mechanics summary
- Technical approach
- Implementation timeline estimate

### 2. Detailed Planning Document
Similar to [`POPULAR_DECKS_CARDS_PLAN.md`](./POPULAR_DECKS_CARDS_PLAN.md), create comprehensive specifications:

#### Database Design
- Complete schema with all tables
- Relationships and foreign keys
- Indexes for performance
- Row-level security policies
- Sample data structures (JSONB fields)

#### API Routes
- All endpoints with methods (GET/POST/PUT/DELETE)
- Request/response formats
- Authentication requirements
- Error handling strategies

#### Component Architecture
- Component hierarchy
- Props interfaces
- State management approach
- Reusable component patterns

#### Game Logic Systems
- **Simulation Engine**: How games are calculated
- **AI Opponent System**: How AI teams are generated
- **Progression System**: Aging, drafting, unlocks
- **Action System**: How weekly actions are processed
- **Stat Calculations**: Formulas for attribute effects

#### User Flows
- New game creation
- Weekly planning cycle
- Game simulation
- Season end / Draft
- Unlock progression

### 3. Architecture Document
Similar to [`POPULAR_DECKS_ARCHITECTURE.md`](./POPULAR_DECKS_ARCHITECTURE.md), create visual architecture:
- System architecture diagrams (use ASCII art or Mermaid)
- Data flow diagrams
- Component interaction diagrams
- State management flow

### 4. Implementation Guide
Similar to [`IMPLEMENTATION_QUICK_START.md`](./IMPLEMENTATION_QUICK_START.md), create step-by-step guide:
- Phase-by-phase implementation plan
- Code examples for key systems
- Testing strategies
- Deployment considerations

### 5. Handoff Document
Similar to [`HANDOFF_TO_IMPLEMENTATION.md`](./HANDOFF_TO_IMPLEMENTATION.md), create developer handoff:
- Quick start instructions
- Priority order for implementation
- Dependencies and prerequisites
- Common pitfalls to avoid

---

## 💡 Your Creative Freedom

### You Are Encouraged To:

1. **Expand on Game Mechanics**
   - Suggest additional weekly actions
   - Design interesting player skills
   - Create engaging random events
   - Propose tactical depth

2. **Improve Systems**
   - Better progression curves
   - More satisfying unlocks
   - Clearer UI/UX flows
   - Enhanced simulation detail

3. **Add Features**
   - Achievement system
   - Statistics tracking
   - Leaderboards (optional)
   - Tutorial system
   - Difficulty modes

4. **Optimize Architecture**
   - Performance considerations
   - Scalability patterns
   - Caching strategies
   - Real-time updates

5. **Address Open Questions**
   - Currency system design
   - Chemistry/morale mechanics
   - Random event frequency
   - Balance between RNG and skill
   - Player naming system
   - Facility persistence

### Design Principles to Follow

1. **Strategic Depth**: Every decision should matter
2. **Clear Feedback**: Players should understand cause and effect
3. **Replayability**: Each run should feel different
4. **Accessibility**: Easy to learn, hard to master
5. **Performance**: Fast load times, smooth interactions
6. **Maintainability**: Clean code, good documentation

---

## 🎨 Specific Areas Needing Your Input

### 1. Game Balance
- How should attribute values scale (1-20 or 1-100)?
- What should be the win rate for a balanced game?
- How many seasons should it take to unlock everything?
- How powerful should unlocks be?

### 2. Simulation Detail
- Should games be instant or have play-by-play?
- How much randomness vs determinism?
- Should there be in-game adjustments (timeouts, subs)?
- What stats should be tracked?

### 3. Progression System
- How many unlockable skills should there be?
- Should there be multiple currencies or one?
- How should draft prospects be generated?
- What makes a "good" unlock feel rewarding?

### 4. UI/UX Design
- How to visualize hexagon stats effectively?
- Best way to present weekly action choices?
- How to make simulation engaging to watch?
- Mobile-friendly considerations?

### 5. Technical Decisions
- Should game state be stored in database or localStorage?
- How to handle real-time updates during simulation?
- Caching strategy for AI opponents?
- How to structure JSONB fields for flexibility?

---

## 📋 Deliverable Checklist

Your planning documents should include:

- [ ] Executive summary with timeline
- [ ] Complete database schema (SQL)
- [ ] All API route specifications
- [ ] Component hierarchy and props
- [ ] Game simulation algorithm
- [ ] AI opponent generation logic
- [ ] Progression system mechanics
- [ ] Action processing system
- [ ] User flow diagrams
- [ ] Architecture diagrams
- [ ] Implementation phases (prioritized)
- [ ] Code examples for key systems
- [ ] Testing strategy
- [ ] Edge case handling
- [ ] Performance considerations
- [ ] Security considerations
- [ ] Accessibility guidelines
- [ ] Mobile responsiveness plan

---

## 🚀 Getting Started

### Step 1: Read Everything
1. Read [`BASKETBALL_ROGUELIKE_GAME_DESIGN.md`](./BASKETBALL_ROGUELIKE_GAME_DESIGN.md) thoroughly
2. Study the reference planning documents
3. Explore the existing codebase structure
4. Understand the Supabase patterns used

### Step 2: Ask Questions
If anything is unclear or you need more context:
- Ask about existing patterns
- Request clarification on game mechanics
- Inquire about technical constraints
- Seek guidance on priorities

### Step 3: Create Your Plan
Start with high-level structure, then drill down into details:
1. Outline major systems
2. Design database schema
3. Plan API routes
4. Design components
5. Detail game logic
6. Create implementation phases

### Step 4: Be Thorough
Remember: The implementation team will rely entirely on your plan. Include:
- Clear explanations
- Code examples
- Visual diagrams
- Edge cases
- Testing approaches

---

## 🎯 Success Criteria

Your plan is successful if:

1. **Complete**: Covers all aspects of the game
2. **Clear**: Anyone can understand and implement it
3. **Actionable**: Provides concrete steps
4. **Realistic**: Fits within project constraints
5. **Creative**: Adds value beyond the initial concept
6. **Maintainable**: Follows best practices
7. **Scalable**: Can grow with future features

---

## 💬 Communication Style

When creating your plan:
- Be **specific** with technical details
- Use **code examples** liberally
- Include **visual diagrams** where helpful
- Explain **rationale** for decisions
- Anticipate **questions** and answer them
- Provide **alternatives** when appropriate
- Be **realistic** about complexity

---

## 🏀 Final Thoughts

This is an exciting project that combines:
- Strategic gameplay (roguelike mechanics)
- Sports simulation (basketball)
- Progression systems (unlocks, aging)
- Modern web tech (Next.js, Supabase)

Your planning will set the foundation for a fun, engaging game. Take your time, be thorough, and don't hesitate to suggest improvements to the original concept.

**Remember**: You have creative freedom to enhance and improve the design wherever you see opportunities. The goal is to create the best possible basketball roguelike game!

Good luck, and have fun planning! 🎮🏀

---

## 📞 Questions?

If you need clarification on:
- **Game mechanics**: Refer back to the design document
- **Technical patterns**: Check the reference documents
- **Project structure**: Explore the existing codebase
- **Anything else**: Ask! Better to clarify than assume.

Let's build something awesome! 🚀