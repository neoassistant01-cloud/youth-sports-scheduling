import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    const data = { facilities: [], teams: [], players: [], schedules: [], preferences: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(data));
    return data;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const dynamic = 'force-dynamic';

// GET /api/players - list all players or filter by teamId
export async function GET(request: NextRequest) {
  try {
    const data = loadDb();
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    
    let players = data.players || [];
    if (teamId) {
      players = players.filter((p: any) => p.team_id === parseInt(teamId));
    }
    
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

// POST /api/players - create a new player
export async function POST(request: NextRequest) {
  try {
    const data = loadDb();
    const body = await request.json();
    
    if (!body.teamId || !body.firstName || !body.lastName) {
      return NextResponse.json({ error: 'Missing required fields: teamId, firstName, lastName' }, { status: 400 });
    }
    
    const now = Date.now();
    const maxId = data.players?.reduce((max: number, p: any) => Math.max(max, p.id), 0) || 0;
    
    const player = {
      id: maxId + 1,
      team_id: body.teamId,
      first_name: body.firstName,
      last_name: body.lastName,
      parent_name: body.parentName || null,
      parent_email: body.parentEmail || null,
      parent_phone: body.parentPhone || null,
      created_at: now
    };
    
    data.players = data.players || [];
    data.players.push(player);
    saveDb(data);
    
    return NextResponse.json({ id: player.id, ...body, message: 'Player created' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
  }
}
