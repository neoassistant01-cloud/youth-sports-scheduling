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

// POST /api/schedules/bulk - create multiple schedules at once
export async function POST(request: NextRequest) {
  try {
    const data = loadDb();
    const body = await request.json();
    const { schedules } = body;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json({ error: 'Missing schedules array' }, { status: 400 });
    }

    data.schedules = data.schedules || [];
    const maxId = data.schedules.reduce((max: number, s: any) => Math.max(max, s.id), 0) || 0;

    const created: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < schedules.length; i++) {
      const sched = schedules[i];
      
      if (!sched.facilityId || !sched.startTime || !sched.eventType) {
        errors.push(`Schedule ${i + 1}: Missing required fields`);
        continue;
      }

      const facility = (data.facilities || []).find((f: any) => f.id === sched.facilityId);
      if (!facility) {
        errors.push(`Schedule ${i + 1}: Facility not found`);
        continue;
      }

      const startTime = typeof sched.startTime === 'number' ? sched.startTime : new Date(sched.startTime).getTime();
      const endTime = sched.endTime || startTime + (sched.eventType === 'game' ? 5400000 : 3600000);

      const hasConflict = (data.schedules || []).some((s: any) => {
        if (s.facility_id !== sched.facilityId) return false;
        return (startTime < s.end_time && endTime > s.start_time);
      });

      if (hasConflict) {
        errors.push(`Schedule ${i + 1}: Time conflict`);
        continue;
      }

      const homeTeam = sched.homeTeamId ? (data.teams || []).find((t: any) => t.id === sched.homeTeamId) : null;
      const awayTeam = sched.awayTeamId ? (data.teams || []).find((t: any) => t.id === sched.awayTeamId) : null;

      const newSchedule = {
        id: maxId + created.length + 1,
        facility_id: sched.facilityId,
        home_team_id: sched.homeTeamId || null,
        away_team_id: sched.awayTeamId || null,
        event_type: sched.eventType,
        title: sched.title || (
          sched.eventType === 'game'
            ? `Game: ${homeTeam?.name || 'TBD'} vs ${awayTeam?.name || 'TBD'}`
            : `Practice: ${homeTeam?.name || 'TBD'}`
        ),
        start_time: startTime,
        end_time: endTime,
        is_published: sched.isPublished ? 1 : 0,
        has_conflict: 0,
        conflict_reason: null,
        created_at: Date.now(),
        updated_at: Date.now()
      };

      created.push(newSchedule);
    }

    data.schedules.push(...created);
    saveDb(data);

    return NextResponse.json({
      created: created.length,
      errors,
      schedules: created.map(s => ({ id: s.id, title: s.title, start_time: s.start_time }))
    });
  } catch (error) {
    console.error('Bulk schedule error:', error);
    return NextResponse.json({ error: 'Failed to create schedules' }, { status: 500 });
  }
}
