# Youth Sports Scheduling MVP - Specification

## Project Overview
- **Project Name:** Youth Sports Scheduler
- **Type:** Single-page web application
- **Core Functionality:** Manage players, coaches, teams, and automatically schedule games/practices
- **Target Users:** Youth sports league administrators, coaches

## UI/UX Specification

### Layout Structure
- **Header:** App title + navigation tabs
- **Main Content:** Tab-based interface with 4 sections
- **No footer** - clean minimal design

### Visual Design

#### Color Palette
- **Background:** `#0f0f0f` (deep black)
- **Card Background:** `#1a1a1a` (dark gray)
- **Primary:** `#22c55e` (vibrant green - field/sports feel)
- **Secondary:** `#f59e0b` (amber - for accents)
- **Text Primary:** `#fafafa` (off-white)
- **Text Secondary:** `#a1a1aa` (muted gray)
- **Border:** `#2a2a2a` (subtle dark border)
- **Danger:** `#ef4444` (red for delete actions)

#### Typography
- **Font Family:** 'DM Sans' (headings), 'IBM Plex Mono' (data/labels)
- **Headings:** 24px bold
- **Subheadings:** 16px semibold
- **Body:** 14px regular
- **Labels:** 12px medium, uppercase, letter-spacing 0.05em

#### Spacing
- **Container max-width:** 900px centered
- **Card padding:** 24px
- **Section gaps:** 20px
- **Element gaps:** 12px

#### Visual Effects
- **Cards:** 1px border, 8px border-radius
- **Buttons:** 6px border-radius, subtle hover lift
- **Inputs:** Dark background with green focus ring
- **Transitions:** 150ms ease-out for all interactive elements

### Components

#### Navigation Tabs
- Tabs: Players | Coaches | Teams | Schedule
- Active tab: green underline, white text
- Inactive: gray text

#### Forms
- Input fields with dark bg (#0f0f0f), light border
- Labels above inputs
- Add button: green primary

#### Data Tables/Cards
- Grid of cards for players/coaches
- Team cards showing member count
- Schedule items with date/time/teams

#### Modals
- Centered overlay with dark backdrop
- White card with form content

## Functionality Specification

### 1. Player Management
- Add player: name, email, phone, skill level (Beginner/Intermediate/Advanced)
- Edit player details
- Delete player (with confirmation)
- List all players in card grid
- Assign player to team

### 2. Coach Management
- Add coach: name, email, phone, specialization
- Edit coach details
- Delete coach (with confirmation)
- List all coaches
- Assign coach to team

### 3. Team Management
- Create team: name, sport type, division
- Add players to team (multi-select)
- Assign coach to team
- View team roster
- Delete team

### 4. Scheduling Algorithm
- Auto-generate game schedule based on teams
- Consider: equal games per team, reasonable time slots
- Set practice sessions for teams
- Display schedule in chronological order
- Manual schedule entry option

### Data Handling
- LocalStorage for persistence
- JSON structure for all entities

### Edge Cases
- Prevent scheduling without at least 2 teams
- Handle team with no players
- Validate required fields before save
- Confirm destructive actions

## Acceptance Criteria
1. ✅ Can add/edit/delete players
2. ✅ Can add/edit/delete coaches
3. ✅ Can create teams and assign members
4. ✅ Can generate automatic schedule
5. ✅ Data persists on page reload
6. ✅ Responsive on mobile devices
7. ✅ All CRUD operations work correctly
8. ✅ Schedule displays correctly sorted
