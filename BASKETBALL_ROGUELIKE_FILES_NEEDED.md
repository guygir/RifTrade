# Files Needed for Basketball Roguelike Planning Agent

## 🎯 Essential Files (MUST HAVE)

These are the core files the planning agent absolutely needs:

### 1. Game Design Documents (Created for this project)
- **`BASKETBALL_ROGUELIKE_INITIAL_MESSAGE.md`** - Starting point, tells agent what to do
- **`BASKETBALL_ROGUELIKE_PLANNING_BRIEF.md`** - Complete mission brief with all instructions
- **`BASKETBALL_ROGUELIKE_GAME_DESIGN.md`** - Full game specification and mechanics

**Why needed**: These contain the entire game concept and instructions for the planning agent.

---

## 📚 Reference Files (HIGHLY RECOMMENDED)

These show the planning agent what good planning documentation looks like:

### Planning Pattern Examples
- **`FEATURE_SUMMARY.md`** - Shows how to write executive summaries
- **`IMPLEMENTATION_QUICK_START.md`** - Shows how to create quick-start guides
- **`POPULAR_DECKS_ARCHITECTURE.md`** - Shows how to document architecture with diagrams
- **`POPULAR_DECKS_CARDS_PLAN.md`** - Shows comprehensive planning format
- **`HANDOFF_TO_IMPLEMENTATION.md`** - Shows how to create developer handoff docs

**Why needed**: These provide templates and patterns for the agent to follow. Without them, the agent might not structure the documentation as well.

**Can skip if**: The agent is experienced with creating technical documentation and you're okay with a different format.

---

## 🏗️ Project Context Files (OPTIONAL BUT HELPFUL)

These help the agent understand the existing project structure:

### Core Configuration
- **`package.json`** - Shows dependencies and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`README.md`** - Project overview

### Example Code Patterns
- **`app/layout.tsx`** - Shows Next.js layout pattern
- **`lib/supabase/client.ts`** - Shows Supabase setup pattern
- **`supabase/migrations/001_initial_schema.sql`** - Shows migration pattern

**Why helpful**: Helps agent understand existing patterns and conventions.

**Can skip if**: You're okay with the agent making reasonable assumptions about Next.js/Supabase patterns.

---

## 📋 Recommended File List

### Minimal Set (Agent can work with just these)
```
BASKETBALL_ROGUELIKE_INITIAL_MESSAGE.md
BASKETBALL_ROGUELIKE_PLANNING_BRIEF.md
BASKETBALL_ROGUELIKE_GAME_DESIGN.md
```

### Recommended Set (Better quality output)
```
BASKETBALL_ROGUELIKE_INITIAL_MESSAGE.md
BASKETBALL_ROGUELIKE_PLANNING_BRIEF.md
BASKETBALL_ROGUELIKE_GAME_DESIGN.md
FEATURE_SUMMARY.md
IMPLEMENTATION_QUICK_START.md
POPULAR_DECKS_ARCHITECTURE.md
POPULAR_DECKS_CARDS_PLAN.md
HANDOFF_TO_IMPLEMENTATION.md
```

### Complete Set (Best results)
```
BASKETBALL_ROGUELIKE_INITIAL_MESSAGE.md
BASKETBALL_ROGUELIKE_PLANNING_BRIEF.md
BASKETBALL_ROGUELIKE_GAME_DESIGN.md
FEATURE_SUMMARY.md
IMPLEMENTATION_QUICK_START.md
POPULAR_DECKS_ARCHITECTURE.md
POPULAR_DECKS_CARDS_PLAN.md
HANDOFF_TO_IMPLEMENTATION.md
package.json
README.md
tsconfig.json
app/layout.tsx
lib/supabase/client.ts
supabase/migrations/001_initial_schema.sql
```

---

## 💡 My Recommendation

**Use the Recommended Set (8 files)**

The reference planning documents are valuable because they:
1. Show the exact format and structure you want
2. Demonstrate the level of detail expected
3. Provide concrete examples of good documentation
4. Help maintain consistency with your existing project style

The project context files are less critical because:
- The planning brief already describes the tech stack
- Standard Next.js/Supabase patterns are well-known
- The agent can make reasonable assumptions

---

## 🎯 Summary

**Minimum to function**: 3 files (game design docs only)
**Recommended for quality**: 8 files (+ reference planning docs)
**Maximum for best results**: 14 files (+ project context)

**My suggestion**: Go with the 8-file recommended set. It's a good balance between providing enough context and not overwhelming the agent with unnecessary files.