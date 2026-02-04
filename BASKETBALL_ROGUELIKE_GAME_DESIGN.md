# Basketball Roguelike - Game Design Document

## 🎯 Project Overview

This document outlines the design for a **Basketball Simulation Roguelike PVE Game** to be built using the existing Rift project infrastructure (Next.js 14, TypeScript, Supabase, Tailwind CSS).

---

## 🏀 Core Game Concept

### High-Level Summary
A roguelike basketball management game where players manage a team through a 14-week season (11 regular season + 3 playoff weeks). Success requires strategic player development, tactical decisions, and smart resource management across multiple season runs.

### Victory Condition
Win the championship (finals) to beat the game. If you lose, the season resets with progression mechanics (unlocks, aging system, draft).

### Roguelike Elements
- **Permadeath**: Season resets on failure
- **Progression**: Unlock new skills, tactics, and player abilities across runs
- **Randomization**: Draft picks, opponent teams, event outcomes
- **Strategic Depth**: Limited actions per week force meaningful choices

---

## 👥 Player Attributes System

### Core Hexagon Stats (6 Attributes)
Each player has 6 fundamental attributes visualized as a hexagon:

1. **Outside Offense** - Three-point shooting, perimeter scoring
2. **Inside Offense** - Post moves, layups, dunks
3. **Passing** - Assists, ball movement (affects both offense types)
4. **Outside Defense** - Perimeter defense, steals, three-point contests
5. **Inside Defense** - Rim protection, blocks, post defense
6. **Athleticism** - Speed, stamina, versatility (affects both defense types)

### Attribute Ranges
- Values: 1-100 (or 1-20 for simpler math)
- Visual representation: Hexagon radar chart
- Color coding: Red (weak), Yellow (average), Green (strong)

### Derived Stats
- **Overall Rating**: Weighted average of all attributes
- **Position Fit**: How well attributes match position requirements
- **Chemistry**: Team synergy based on complementary skills

---

## 🗓️ Season Structure

### Timeline
- **Regular Season**: 11 weeks (play 11 different teams)
- **Playoffs**: 3 weeks
  - Week 12: Quarterfinals (top 8 teams)
  - Week 13: Semifinals (top 4 teams)
  - Week 14: Finals (top 2 teams)
- **Total**: 14 weeks per season run

### Weekly Cycle
1. **Planning Phase**: Make 3 actions from available options
2. **Simulation Phase**: Watch/simulate the game vs AI opponent
3. **Results Phase**: Review stats, injuries, progression
4. **Repeat**: Move to next week

---

## 🎮 Weekly Actions System

### Action Budget
- **3 actions per week** (fixed)
- Actions are consumed immediately
- Must choose wisely based on current needs

### Available Actions (To Be Expanded)

#### Player Development
- **Training Session**: Improve specific attribute for selected player(s)
  - Focus training: +3 to one attribute
  - Balanced training: +1 to three attributes
  - Team training: +1 to all players in one attribute

#### Roster Management
- **Buy Player**: Acquire player from market (costs currency)
  - Free agents
  - Trade market
  - Scout reports available
- **Sell Player**: Release player for currency
  - Immediate sale
  - Market value based on stats + age
- **Draft Scouting**: Preview upcoming draft prospects (if near season end)

#### Infrastructure
- **Upgrade Facility**: Improve training effectiveness
  - Gym: +10% to physical training
  - Court: +10% to skill training
  - Medical: Reduce injury risk/duration
  - Analytics: Better opponent scouting
- **Hire Staff**: Add coaching bonuses
  - Offensive Coordinator: +5% offensive stats in games
  - Defensive Coordinator: +5% defensive stats in games
  - Trainer: +15% training effectiveness

#### Tactical Preparation
- **Buy Tactic**: Unlock new playbook strategies
  - Offensive schemes: Fast break, Pick & Roll, Post-up, Motion
  - Defensive schemes: Man-to-man, Zone, Press, Switch-heavy
  - Special plays: Clutch plays, Timeout strategies
- **Scout Opponent**: Gain advantage in next game
  - Reveal opponent strengths/weaknesses
  - +10% effectiveness against scouted team
  - Lasts one game

#### Player Enhancement
- **Buy Skill**: Unlock permanent ability for a player
  - Offensive skills: "Clutch Gene", "Hot Hand", "Ankle Breaker"
  - Defensive skills: "Lockdown", "Rim Protector", "Ball Hawk"
  - Utility skills: "Floor General", "Energy Boost", "Mentor"
  - Skills persist across seasons if player survives

#### Recovery & Maintenance
- **Rest Players**: Reduce injury risk, restore stamina
- **Medical Treatment**: Heal injured players faster
- **Team Building**: Improve chemistry/morale

---

## 🎲 Game Simulation

### Simulation Options
1. **Quick Sim**: Instant results, see final score
2. **Detailed Sim**: Play-by-play text commentary
3. **Visual Sim**: Animated 2D court view (stretch goal)

### Simulation Factors
- Player attributes vs opponent attributes
- Tactics matchup (your scheme vs their scheme)
- Fatigue/injuries
- Home court advantage (if applicable)
- Random variance (dice rolls, hot/cold streaks)

### Game Outcomes
- **Win/Loss**: Affects playoff seeding
- **Player Stats**: Individual performance tracking
- **Injuries**: Random chance based on minutes played
- **Progression**: Players gain small XP from games
- **Unlocks**: Achievements may unlock new content

---

## 🔄 Roguelike Progression System

### Between-Season Changes

#### 1. Player Aging System
- **Draft Age**: 18 years old
- **Retirement Age**: 21 years old
- **Aging Process**:
  - After each season, all players age +1 year
  - 21-year-olds retire at season end
  - Must draft new 18-year-old to replace retiree

#### 2. Draft System
- **When**: After season ends (win or lose)
- **Process**:
  1. One 21-year-old retires from your roster
  2. You draft one 18-year-old replacement
  3. Draft pool has randomized prospects
  4. Prospects can have **unlocked abilities** from previous runs

#### 3. Unlock System (Meta-Progression)
Permanent unlocks that carry across all future runs:

**Skill Unlocks**
- When you buy a skill for a player, it becomes available in draft pool
- Future draftees can spawn with these skills pre-equipped
- Example: Unlock "Clutch Gene" → future 18-year-olds may have it

**Tactic Unlocks**
- Purchased tactics remain available in future seasons
- Start new runs with expanded playbook

**Facility Unlocks**
- Permanent infrastructure improvements
- Carry over to new seasons

**Starting Bonuses**
- Extra starting currency
- Better initial roster
- Additional action points per week

### Progression Currency
- **Championship Tokens**: Earned only by winning finals
  - Used for major unlocks
  - Rare and valuable
- **Season Points**: Earned based on performance
  - Win games: +10 points
  - Playoff appearance: +50 points
  - Finals appearance: +100 points
  - Used for minor unlocks

---

## 🏆 Team Composition

### Starting Roster
- **5 players** (one per position)
- **Age Distribution**: 18, 19, 20, 20, 21 (example)
- **Randomized Attributes**: Each new game generates different starting team
- **Positions**: PG, SG, SF, PF, C (traditional basketball positions)

### Roster Management
- **Max Roster Size**: 5-8 players (to be decided)
- **Active Lineup**: 5 players per game
- **Bench**: Substitutes for injuries/fatigue

---

## 🎨 UI/UX Design Considerations

### Key Screens

#### 1. Main Menu
- New Game
- Continue Season
- Unlocks/Progression
- Settings

#### 2. Team Overview
- Roster display with hexagon stats
- Team overall rating
- Current record (W-L)
- Playoff standing
- Available currency

#### 3. Weekly Planning Screen
- Action selection interface (3 slots)
- Available actions with costs/effects
- Next opponent preview
- Week number / Season progress

#### 4. Player Detail View
- Full hexagon stat visualization
- Age, position, skills
- Career stats
- Injury status
- Training history

#### 5. Game Simulation Screen
- Score display
- Play-by-play log (optional)
- Player stats during game
- Timeout/substitution controls (optional)

#### 6. Post-Game Results
- Final score
- Player performances
- Injuries/events
- Playoff implications
- Continue button

#### 7. Draft Screen
- Available prospects
- Hexagon stat previews
- Unlocked skills indicator
- Selection interface

#### 8. Unlocks/Progression Screen
- Skill tree visualization
- Available unlocks
- Currency display
- Purchase interface

---

## 🛠️ Technical Architecture

### Technology Stack (From Existing Project)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **State Management**: React hooks + Context API
- **Authentication**: Supabase Auth (for save games)

### Database Schema (Proposed)

```sql
-- Game saves
game_saves (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  season_number INTEGER,
  week_number INTEGER,
  team_data JSONB,
  unlocks JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Players (current roster)
players (
  id UUID PRIMARY KEY,
  game_save_id UUID REFERENCES game_saves(id),
  name TEXT,
  age INTEGER,
  position TEXT,
  outside_offense INTEGER,
  inside_offense INTEGER,
  passing INTEGER,
  outside_defense INTEGER,
  inside_defense INTEGER,
  athleticism INTEGER,
  skills JSONB,
  created_at TIMESTAMP
)

-- Opponents (AI teams)
opponents (
  id UUID PRIMARY KEY,
  team_name TEXT,
  difficulty_tier INTEGER,
  roster_data JSONB,
  created_at TIMESTAMP
)

-- Game history
game_results (
  id UUID PRIMARY KEY,
  game_save_id UUID REFERENCES game_saves(id),
  week_number INTEGER,
  opponent_id UUID REFERENCES opponents(id),
  player_score INTEGER,
  opponent_score INTEGER,
  player_stats JSONB,
  created_at TIMESTAMP
)

-- Unlocks (meta-progression)
unlocks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  unlock_type TEXT, -- 'skill', 'tactic', 'facility', 'bonus'
  unlock_id TEXT,
  unlocked_at TIMESTAMP
)

-- Draft prospects pool
draft_prospects (
  id UUID PRIMARY KEY,
  name TEXT,
  base_stats JSONB,
  potential_skills JSONB,
  created_at TIMESTAMP
)
```

### Component Structure

```
app/
  game/
    page.tsx                    # Main game hub
    team/page.tsx              # Team overview
    planning/page.tsx          # Weekly actions
    simulation/page.tsx        # Game simulation
    draft/page.tsx             # Draft screen
    unlocks/page.tsx           # Progression screen
  
components/
  game/
    HexagonStats.tsx           # Player stat visualization
    PlayerCard.tsx             # Player display component
    ActionSelector.tsx         # Weekly action interface
    GameSimulator.tsx          # Game simulation display
    DraftBoard.tsx             # Draft selection UI
    UnlockTree.tsx             # Progression tree
    OpponentPreview.tsx        # Next opponent info
    
lib/
  game/
    simulation-engine.ts       # Game simulation logic
    ai-opponent.ts             # AI team generation
    progression-system.ts      # Unlock/aging logic
    action-handlers.ts         # Process weekly actions
    stat-calculator.ts         # Attribute calculations
```

---

## 🎯 Design Principles

### Core Pillars
1. **Strategic Depth**: Every decision matters
2. **Meaningful Progression**: Unlocks feel rewarding
3. **Replayability**: Each run feels different
4. **Accessibility**: Easy to learn, hard to master
5. **Satisfying Feedback**: Clear cause and effect

### Balancing Goals
- **Early Game**: Focus on learning mechanics
- **Mid Game**: Strategic optimization
- **Late Game**: High-stakes decision making
- **Meta Game**: Long-term progression satisfaction

---

## 🚀 Implementation Phases (Suggested)

### Phase 1: Core Loop (MVP)
- Basic team management
- Simple simulation
- Weekly action system
- Win/loss conditions

### Phase 2: Progression
- Aging system
- Draft mechanics
- Basic unlocks
- Save/load system

### Phase 3: Depth
- Advanced tactics
- Skill system
- Infrastructure upgrades
- Enhanced simulation

### Phase 4: Polish
- Visual improvements
- Animations
- Sound effects
- Tutorial system
- Balance tuning

---

## 💡 Creative Freedom & Suggestions

### Areas for Agent Creativity

**You are encouraged to suggest improvements and additions in:**

1. **Action Types**: What other weekly actions would be interesting?
2. **Skills**: What unique player abilities would be fun?
3. **Tactics**: What basketball strategies should be included?
4. **Events**: Random events during season (injuries, hot streaks, trades)?
5. **Unlocks**: What progression rewards would feel satisfying?
6. **Simulation**: How detailed should game simulation be?
7. **UI/UX**: Best way to present information clearly?
8. **Balancing**: How to make decisions meaningful but not overwhelming?
9. **Narrative**: Should there be story elements or pure gameplay?
10. **Multiplayer**: Future consideration for PvP or leaderboards?

### Open Questions for Planning Agent

- Should there be a currency system or multiple currencies?
- How should player chemistry/morale work?
- Should there be random events (injuries, hot streaks, trades)?
- How much RNG vs player skill should determine outcomes?
- Should there be difficulty levels?
- How to handle player names (generated, custom, real players)?
- Should facilities be permanent or per-season?
- How to balance early game vs late game power?

---

## 📊 Success Metrics

### Player Engagement
- Average session length
- Seasons completed
- Win rate progression
- Unlock completion rate

### Game Balance
- Average seasons to first win
- Most/least used actions
- Most/least valuable unlocks
- Player attribute distribution

---

## 🎮 Example Gameplay Flow

### Season 1, Week 1
1. **Start**: Receive randomized team (18, 19, 20, 20, 21 year olds)
2. **Plan**: Choose 3 actions
   - Train PG's Outside Offense (+3)
   - Scout next opponent
   - Buy "Pick & Roll" tactic
3. **Simulate**: Play game vs Team A
   - Win 78-72
   - PG scores 24 points
   - No injuries
4. **Results**: Move to Week 2

### Season 1, Week 11 (Last Regular Season)
1. **Status**: 8-2 record, 3rd place
2. **Plan**: Prepare for playoffs
   - Rest key players
   - Buy "Clutch Gene" skill for SG
   - Upgrade Medical facility
3. **Simulate**: Win 85-80
4. **Results**: Qualify for playoffs (8-3)

### Season 1, Week 14 (Finals)
1. **Status**: Made it to finals!
2. **Plan**: All-in strategy
   - Train entire team
   - Buy defensive tactic
   - Scout opponent heavily
3. **Simulate**: Lose 88-92
4. **Season End**:
   - 21-year-old C retires
   - Draft new 18-year-old C
   - Unlock "Clutch Gene" for future drafts
   - Earn 150 Season Points
   - Start Season 2

---

## 📝 Notes for Planning Agent

### Your Mission
Create a **comprehensive, detailed, and thorough plan** for implementing this basketball roguelike game using the existing Rift project infrastructure.

### What to Include in Your Plan
1. **Complete Database Schema**: All tables, relationships, indexes
2. **API Routes**: All endpoints needed for game functionality
3. **Component Hierarchy**: Detailed UI component structure
4. **Game Logic**: Simulation algorithms, progression systems
5. **State Management**: How game state flows through the app
6. **User Flows**: Step-by-step player journeys
7. **Implementation Phases**: Prioritized development roadmap
8. **Technical Decisions**: Architecture choices with rationale
9. **Creative Enhancements**: Your suggestions for improving the design
10. **Edge Cases**: How to handle errors, edge cases, special scenarios

### Leverage Existing Infrastructure
- Use Supabase patterns from current project
- Follow Next.js App Router conventions
- Maintain TypeScript strict typing
- Use Tailwind for styling consistency
- Reference existing components for patterns

### Be Creative!
- Suggest new mechanics that fit the roguelike genre
- Propose UI/UX improvements
- Add depth to systems where you see opportunities
- Think about player psychology and engagement
- Consider accessibility and user experience

---

## 🎯 Final Notes

This is a **living document** - the planning agent should feel empowered to:
- Question assumptions
- Propose alternatives
- Add missing details
- Improve unclear areas
- Expand on interesting ideas
- Simplify overcomplicated systems

**The goal is to create a fun, engaging, replayable basketball roguelike that leverages the existing Rift project infrastructure effectively.**

Good luck, and have fun planning! 🏀🎮