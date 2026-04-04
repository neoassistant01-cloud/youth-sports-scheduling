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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, eventType, facilityId, homeTeamId, awayTeamId, startTime, endTime, isPublished } = body;

    if (!title || !facilityId || !homeTeamId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const data = loadDb();
    const now = Date.now();

    // Check for conflicts
    let hasConflict = false;
    let conflictReason = null;

    const facilityConflict = data.schedules?.find((s: any) => 
      s.facility_id === facilityId &&
      startTime < s.end_time &&
      endTime > s.start_time
    );
    if (facilityConflict) {
      hasConflict = true;
      conflictReason = 'Facility double-booked';
    }

    const teamIds = [homeTeamId];
    if (awayTeamId) teamIds.push(awayTeamId);

    for (const teamId of teamIds) {
      const teamConflict = data.schedules?.find((s: any) => 
        (s.home_team_id === teamId || s.away_team_id === teamId) &&
        startTime < s.end_time &&
        endTime > s.start_time
      );
      if (teamConflict) {
        hasConflict = true;
        conflictReason = conflictReason || 'Team has another event at this time';
      }
    }

    const newId = (data.schedules?.reduce((max: number, s: any) => Math.max(max, s.id), 0) || 0) + 1;

    const newSchedule = {
      id: newId,
      facility_id: facilityId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId || null,
      event_type: eventType || 'practice',
      title,
      start_time: startTime,
      end_time: endTime,
      is_published: isPublished ? 1 : 0,
      has_conflict: hasConflict ? 1 : 0,
      conflict_reason: conflictReason,
      created_at: now,
      updated_at: now
    };

    if (!data.schedules) data.schedules = [];
    data.schedules.push(newSchedule);
    saveDb(data);

    return NextResponse.json(newSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}
