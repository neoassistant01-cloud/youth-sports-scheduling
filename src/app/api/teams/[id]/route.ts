import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = loadDb();
    const body = await request.json();
    const id = parseInt(params.id);
    const idx = (data.teams || []).findIndex((t: any) => t.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    data.teams[idx] = { ...data.teams[idx], ...body, updated_at: Date.now() };
    saveDb(data);
    return NextResponse.json({ id, message: 'Team updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = loadDb();
    const id = parseInt(params.id);
    data.teams = (data.teams || []).filter((t: any) => t.id !== id);
    saveDb(data);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
