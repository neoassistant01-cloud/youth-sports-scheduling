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
    
    // Update fields if provided
    if (body.isPublished !== undefined) {
      data.schedules[idx].is_published = body.isPublished ? 1 : 0;
    }
    if (body.title !== undefined) {
      data.schedules[idx].title = body.title;
    }
    if (body.eventType !== undefined) {
      data.schedules[idx].event_type = body.eventType;
    }
    if (body.facilityId !== undefined) {
      data.schedules[idx].facility_id = body.facilityId;
    }
    if (body.homeTeamId !== undefined) {
      data.schedules[idx].home_team_id = body.homeTeamId;
    }
    if (body.awayTeamId !== undefined) {
      data.schedules[idx].away_team_id = body.awayTeamId;
    }
    if (body.startTime !== undefined) {
      data.schedules[idx].start_time = body.startTime;
    }
    if (body.endTime !== undefined) {
      data.schedules[idx].end_time = body.endTime;
    }
    
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = loadDb();
    const id = parseInt(params.id);
    const schedule = (data.schedules || []).find((s: any) => s.id === id);
    if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    // Enrich with related data
    const facility = (data.facilities || []).find((f: any) => f.id === schedule.facility_id);
    const homeTeam = (data.teams || []).find((t: any) => t.id === schedule.home_team_id);
    const awayTeam = schedule.away_team_id 
      ? (data.teams || []).find((t: any) => t.id === schedule.away_team_id)
      : null;
    
    return NextResponse.json({
      ...schedule,
      facility_name: facility?.name,
      home_team_name: homeTeam?.name,
      away_team_name: awayTeam?.name
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
