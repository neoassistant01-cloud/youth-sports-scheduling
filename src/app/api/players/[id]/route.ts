import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const dynamic = 'force-dynamic';

// GET /api/players/[id] - get a single player
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = loadDb();
    const player = (data.players || []).find((p: any) => p.id === parseInt(id));
    
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    return NextResponse.json(player);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 });
  }
}

// PUT /api/players/[id] - update a player
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = loadDb();
    const body = await request.json();
    
    const players = data.players || [];
    const index = players.findIndex((p: any) => p.id === parseInt(id));
    
    if (index === -1) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    players[index] = {
      ...players[index],
      team_id: body.teamId ?? players[index].team_id,
      first_name: body.firstName ?? players[index].first_name,
      last_name: body.lastName ?? players[index].last_name,
      parent_name: body.parentName ?? players[index].parent_name,
      parent_email: body.parentEmail ?? players[index].parent_email,
      parent_phone: body.parentPhone ?? players[index].parent_phone
    };
    
    data.players = players;
    saveDb(data);
    
    return NextResponse.json({ message: 'Player updated', player: players[index] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}

// DELETE /api/players/[id] - delete a player
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = loadDb();
    
    const players = (data.players || []).filter((p: any) => p.id !== parseInt(id));
    
    if (players.length === (data.players || []).length) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    data.players = players;
    saveDb(data);
    
    return NextResponse.json({ message: 'Player deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 });
  }
}
