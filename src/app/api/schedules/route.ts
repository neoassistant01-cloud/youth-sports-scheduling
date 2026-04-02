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
    const schedules = (data.schedules || []).map((s: any) => {
      const facility = (data.facilities || []).find((f: any) => f.id === s.facility_id);
      const homeTeam = (data.teams || []).find((t: any) => t.id === s.home_team_id);
      const awayTeam = (data.teams || []).find((t: any) => t.id === s.away_team_id);
      return { ...s, facility_name: facility?.name, home_team_name: homeTeam?.name, away_team_name: awayTeam?.name };
    });
    return NextResponse.json(schedules);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
