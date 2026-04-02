import { NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = loadDb();
    const published = (data.schedules || []).filter((s: any) => s.is_published);
    if (!published.length) return new NextResponse('No published schedules', { status: 404 });
    
    let csv = 'Start Time,End Time,Event Type,Title,Facility,Home Team,Away Team\n';
    published.forEach((s: any) => {
      const facility = (data.facilities || []).find((f: any) => f.id === s.facility_id);
      const homeTeam = (data.teams || []).find((t: any) => t.id === s.home_team_id);
      const awayTeam = (data.teams || []).find((t: any) => t.id === s.away_team_id);
      csv += `"${new Date(s.start_time).toISOString()}","${new Date(s.end_time).toISOString()}","${s.event_type}","${s.title}","${facility?.name || ''}","${homeTeam?.name || ''}","${awayTeam?.name || ''}"\n`;
    });
    return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="schedule.csv"' } });
  } catch (error) {
    return new NextResponse('Export failed', { status: 500 });
  }
}
