import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    const data = { facilities: [], teams: [], schedules: [], preferences: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(data));
    return data;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = loadDb();
    return NextResponse.json(data.teams || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = loadDb();
    const body = await request.json();
    const now = Date.now();
    const team = {
      id: (data.teams?.length || 0) + 1,
      name: body.name,
      age_group: body.ageGroup || null,
      division: body.division || null,
      sport: body.sport || null,
      coach_name: body.coachName || null,
      coach_email: body.coachEmail || null,
      coach_phone: body.coachPhone || null,
      created_at: now,
      updated_at: now
    };
    data.teams = data.teams || [];
    data.teams.push(team);
    saveDb(data);
    return NextResponse.json({ id: team.id, ...body, message: 'Team created' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
