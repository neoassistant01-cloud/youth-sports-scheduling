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
    const idx = (data.schedules || []).findIndex((s: any) => s.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (body.isPublished !== undefined) data.schedules[idx].is_published = body.isPublished ? 1 : 0;
    data.schedules[idx].updated_at = Date.now();
    saveDb(data);
    return NextResponse.json({ id, message: 'Updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = loadDb();
    const id = parseInt(params.id);
    data.schedules = (data.schedules || []).filter((s: any) => s.id !== id);
    saveDb(data);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
