import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getDayName(date: Date): string {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
}

function generateScheduleSlots(numEvents: number) {
  const slots: { start: Date; end: Date }[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(16, 0, 0, 0);
  const preferredDays = ['saturday', 'monday', 'wednesday'];
  for (let dayOffset = 0; dayOffset < 14 && slots.length < numEvents; dayOffset++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    if (preferredDays.includes(getDayName(checkDate))) {
      const slotDate = new Date(checkDate);
      slotDate.setHours(16 + (slots.length % 3), 0, 0, 0);
      const endDate = new Date(slotDate);
      endDate.setHours(endDate.getHours() + 1);
      slots.push({ start: slotDate, end: endDate });
    }
  }
  return slots;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const data = loadDb();
    const body = await request.json();
    const { facilityId, teamIds, eventType } = body;
    if (!facilityId || !teamIds || teamIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const slots = generateScheduleSlots(teamIds.length * 2);
    data.schedules = data.schedules || [];
    const createdIds: number[] = [];
    for (let i = 0; i < Math.min(slots.length, teamIds.length); i++) {
      const slot = slots[i];
      const schedule = {
        id: (data.schedules.length || 0) + i + 1,
        facility_id: facilityId,
        home_team_id: teamIds[i % teamIds.length],
        away_team_id: eventType === 'game' && teamIds.length > 1 ? teamIds[(i + 1) % teamIds.length] : null,
        event_type: eventType || 'practice',
        title: eventType === 'game' ? `Game ${i + 1}` : `Practice ${i + 1}`,
        start_time: slot.start.getTime(),
        end_time: slot.end.getTime(),
        is_published: 0,
        has_conflict: 0,
        conflict_reason: null,
        created_at: Date.now(),
        updated_at: Date.now()
      };
      data.schedules.push(schedule);
      createdIds.push(schedule.id);
    }
    saveDb(data);
    return NextResponse.json({ message: 'Schedules generated', count: createdIds.length, scheduleIds: createdIds });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}
