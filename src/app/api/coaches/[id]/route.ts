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

// GET /api/coaches/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = loadDb();
    const coach = (data.coaches || []).find((c: any) => c.id === parseInt(params.id));
    
    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }
    
    return NextResponse.json(coach);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coach' }, { status: 500 });
  }
}

// PUT /api/coaches/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = loadDb();
    const body = await request.json();
    const coachIndex = (data.coaches || []).findIndex((c: any) => c.id === parseInt(params.id));
    
    if (coachIndex === -1) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }
    
    data.coaches[coachIndex] = {
      ...data.coaches[coachIndex],
      name: body.name ?? data.coaches[coachIndex].name,
      email: body.email ?? data.coaches[coachIndex].email,
      phone: body.phone ?? data.coaches[coachIndex].phone
    };
    
    saveDb(data);
    return NextResponse.json({ message: 'Coach updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update coach' }, { status: 500 });
  }
}

// DELETE /api/coaches/[id]
export async function DELETE(request: NextRequest, { params: { params } }) {
  try {
    const data = loadDb();
    const coachIndex = (data.coaches || []).findIndex((c: any) => c.id === parseInt(params.id));
    
    if (coachIndex === -1) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }
    
    data.coaches.splice(coachIndex, 1);
    saveDb(data);
    
    return NextResponse.json({ message: 'Coach deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete coach' }, { status: 500 });
  }
}
