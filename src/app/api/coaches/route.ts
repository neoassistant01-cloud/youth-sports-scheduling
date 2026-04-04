import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    const data = { facilities: [], teams: [], players: [], coaches: [], schedules: [], preferences: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(data));
    return data;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const dynamic = 'force-dynamic';

// GET /api/coaches - list coaches, optionally filtered by teamId
export async function GET(request: NextRequest) {
  try {
    const data = loadDb();
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    
    let coaches = data.coaches || [];
    if (teamId) {
      coaches = coaches.filter((c: any) => c.team_id === parseInt(teamId));
    }
    
    return NextResponse.json(coaches);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coaches' }, { status: 500 });
  }
}

// POST /api/coaches - create a new coach
export async function POST(request: NextRequest) {
  try {
    const data = loadDb();
    const body = await request.json();
    
    if (!body.teamId || !body.name) {
      return NextResponse.json({ error: 'Missing required fields: teamId, name' }, { status: 400 });
    }
    
    const now = Date.now();
    const maxId = data.coaches?.reduce((max: number, c: any) => Math.max(max, c.id), 0) || 0;
    
    const coach = {
      id: maxId + 1,
      team_id: body.teamId,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      created_at: now
    };
    
    data.coaches = data.coaches || [];
    data.coaches.push(coach);
    saveDb(data);
    
    return NextResponse.json({ id: coach.id, ...body, message: 'Coach created' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create coach' }, { status: 500 });
  }
}
