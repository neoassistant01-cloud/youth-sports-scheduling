# GameOn Scheduler - Youth Sports Scheduling MVP

A Next.js 14 + TypeScript application for managing youth sports scheduling.

## Features

- **Facility Management**: Add, edit, and delete sports facilities (fields, courts, gyms)
- **Team Management**: Manage teams with coaches and contact information
- **Schedule Generation**: Auto-generate practice/game schedules based on constraints
- **Conflict Detection**: Visual indicators for scheduling conflicts
- **Export Options**: CSV and iCalendar (.ics) export for published schedules
- **Settings**: Configurable scheduling preferences

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open http://localhost:3000

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- JSON file-based storage (for easy deployment)
- CSS (custom styles, no Tailwind required)

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── facilities/    # Facilities page
│   ├── schedule/      # Schedule page
│   ├── settings/      # Settings page
│   ├── teams/         # Teams page
│   └── page.tsx       # Home page
├── components/        # React components
└── styles/           # CSS styles
```

## API Endpoints

- `GET/POST /api/facilities` - List/Create facilities
- `PUT/DELETE /api/facilities/[id]` - Update/Delete facility
- `GET/POST /api/teams` - List/Create teams
- `PUT/DELETE /api/teams/[id]` - Update/Delete team
- `GET /api/schedules` - List schedules
- `POST /api/schedules/generate` - Generate schedules
- `PUT/DELETE /api/schedules/[id]` - Update/Delete schedule
- `GET/POST /api/settings` - Get/Save preferences
- `GET /api/export/csv` - Export to CSV
- `GET /api/export/ics` - Export to iCalendar

## Database

Uses `gameon.json` file for data storage (created on first run with seed data).

## Deployment

The app runs entirely client-side (except API routes). Deploy to:
- Vercel (recommended)
- Railway
- Any Node.js hosting

```bash
# Build for production
pnpm build
```
