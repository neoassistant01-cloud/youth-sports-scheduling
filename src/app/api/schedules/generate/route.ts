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

// Check if a time slot conflicts with facility availability rules
function isFacilityAvailable(dbData: any, facility: any, startTime: Date): boolean {
  const dayName = getDayName(startTime);
  const hour = startTime.getHours();
  const minutes = startTime.getMinutes();
  const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Check availability rules for this facility
  const rules = (dbData.availability_rules || []).filter((r: any) => 
    r.facility_id === facility.id && r.is_active !== 0
  );
  
  if (rules.length === 0) {
    // No rules = assume always available
    return true;
  }
  
  const matchingRule = rules.find((r: any) => 
    r.day_of_week === dayName && timeStr >= r.start_time && timeStr < r.end_time
  );
  
  return !!matchingRule;
}

// Check if a slot conflicts with existing schedules
function hasTimeConflict(schedules: any[], facilityId: number, startTime: number, endTime: number, excludeIds: number[] = []): boolean {
  return schedules.some((s: any) => {
    if (excludeIds.includes(s.id)) return false;
    if (s.facility_id !== facilityId) return false;
    
    const existingStart = s.start_time;
    const existingEnd = s.end_time;
    
    // Check for overlap
    return (startTime < existingEnd && endTime > existingStart);
  });
}

// Check if a team already has an event at this time
function hasTeamConflict(schedules: any[], teamId: number, startTime: number, endTime: number, excludeIds: number[] = []): boolean {
  return schedules.some((s: any) => {
    if (excludeIds.includes(s.id)) return false;
    if (s.home_team_id !== teamId && s.away_team_id !== teamId) return false;
    
    const existingStart = s.start_time;
    const existingEnd = s.end_time;
    
    return (startTime < existingEnd && endTime > existingStart);
  });
}

// Check if team has had enough rest days (min 1 day between events)
function hasRestDayConflict(schedules: any[], teamId: number, startTime: number): boolean {
  const teamEvents = schedules
    .filter((s: any) => s.home_team_id === teamId || s.away_team_id === teamId)
    .sort((a: any, b: any) => a.start_time - b.start_time);
  
  if (teamEvents.length === 0) return false;
  
  const lastEvent = teamEvents[teamEvents.length - 1];
  const daysBetween = (startTime - lastEvent.end_time) / (1000 * 60 * 60 * 24);
  
  // Require at least 1 day rest
  return daysBetween < 1;
}

// Check if time slot is within preferred hours from settings
function isWithinPreferredHours(startTime: Date, preferredStartHour: number = 16, preferredEndHour: number = 21): boolean {
  const hour = startTime.getHours();
  return hour >= preferredStartHour && hour < preferredEndHour;
}

function generateScheduleSlots(numEvents: number, startHour: number = 16) {
  const slots: { start: Date; end: Date }[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(startHour, 0, 0, 0);
  const preferredDays = ['saturday', 'monday', 'wednesday'];
  
  for (let dayOffset = 0; dayOffset < 28 && slots.length < numEvents; dayOffset++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    if (preferredDays.includes(getDayName(checkDate))) {
      const slotDate = new Date(checkDate);
      slotDate.setHours(startHour + (slots.length % 3), 0, 0, 0);
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
    const { facilityId, teamIds, eventType, startHour } = body;
    
    if (!facilityId || !teamIds || teamIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields: facilityId, teamIds' }, { status: 400 });
    }
    
    const facility = (data.facilities || []).find((f: any) => f.id === facilityId);
    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
    }
    
    const numEvents = eventType === 'game' ? Math.ceil(teamIds.length / 2) : teamIds.length;
    const slots = generateScheduleSlots(numEvents * 2, startHour || 16);
    
    data.schedules = data.schedules || [];
    const createdSchedules: any[] = [];
    let conflicts = 0;
    
    for (let i = 0; i < slots.length && createdSchedules.length < numEvents; i++) {
      const slot = slots[i];
      const startTime = slot.start.getTime();
      const endTime = slot.end.getTime();
      
      // Determine which teams for this slot
      let homeTeamIdx: number, awayTeamIdx: number | null;
      
      if (eventType === 'game' && teamIds.length > 1) {
        // For games: pair teams (0 vs 1, 2 vs 3, etc.)
        homeTeamIdx = createdSchedules.length * 2;
        awayTeamIdx = homeTeamIdx + 1;
        
        if (homeTeamIdx >= teamIds.length) break;
        if (awayTeamIdx >= teamIds.length) awayTeamIdx = null;
      } else {
        // For practices: each team gets their own slot
        homeTeamIdx = createdSchedules.length % teamIds.length;
        awayTeamIdx = null;
      }
      
      const homeTeamId = teamIds[homeTeamIdx];
      const awayTeamId = awayTeamIdx !== null ? teamIds[awayTeamIdx] : null;
      
      // Check for conflicts with existing schedules
      const existingAtFacility = hasTimeConflict(data.schedules, facilityId, startTime, endTime);
      if (existingAtFacility) {
        conflicts++;
        continue;
      }
      
      // Check team conflicts
      const team1Conflict = homeTeamId ? hasTeamConflict(data.schedules, homeTeamId, startTime, endTime) : false;
      const team2Conflict = awayTeamId ? hasTeamConflict(data.schedules, awayTeamId, startTime, endTime) : false;
      
      if (team1Conflict || team2Conflict) {
        conflicts++;
        continue;
      }
      
      // Check rest days - ensure at least 1 day between events
      const restDay1Conflict = homeTeamId ? hasRestDayConflict(data.schedules, homeTeamId, startTime) : false;
      const restDay2Conflict = awayTeamId ? hasRestDayConflict(data.schedules, awayTeamId, startTime) : false;
      
      if (restDay1Conflict || restDay2Conflict) {
        conflicts++;
        continue;
      }
      
      // Check preferred hours from settings (default 4pm-9pm)
      const settings = data.preferences || [];
      const startHourSetting = settings.find((p: any) => p.key === 'weekday_evening_start')?.value || '16';
      const endHourSetting = settings.find((p: any) => p.key === 'weekday_evening_end')?.value || '21';
      
      const prefStartHour = parseInt(startHourSetting.split(':')[0]);
      const prefEndHour = parseInt(endHourSetting.split(':')[0]);
      
      const withinHours = isWithinPreferredHours(slot.start, prefStartHour, prefEndHour);
      
      if (!withinHours) {
        conflicts++;
        continue;
      }
      
      // Check facility availability
      if (!isFacilityAvailable(data, facility, slot.start)) {
        conflicts++;
        continue;
      }
      
      const maxId = data.schedules.reduce((max: number, s: any) => Math.max(max, s.id), 0) || 0;
      
      const schedule = {
        id: maxId + createdSchedules.length + 1,
        facility_id: facilityId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        event_type: eventType || 'practice',
        title: eventType === 'game' 
          ? `Game: ${(data.teams || []).find((t: any) => t.id === homeTeamId)?.name || 'Team ' + homeTeamId} vs ${awayTeamId ? ((data.teams || []).find((t: any) => t.id === awayTeamId)?.name || 'Team ' + awayTeamId) : 'TBD'}`
          : `Practice: ${(data.teams || []).find((t: any) => t.id === homeTeamId)?.name || 'Team ' + homeTeamId}`,
        start_time: startTime,
        end_time: endTime,
        is_published: 0,
        has_conflict: 0,
        conflict_reason: null,
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      createdSchedules.push(schedule);
    }
    
    // Save all created schedules
    data.schedules.push(...createdSchedules);
    saveDb(data);
    
    return NextResponse.json({ 
      message: createdSchedules.length > 0 ? 'Schedules generated' : 'No schedules created',
      count: createdSchedules.length,
      skippedConflicts: conflicts,
      schedules: createdSchedules.map(s => ({ id: s.id, title: s.title, start_time: s.start_time }))
    });
  } catch (error) {
    console.error('Schedule generation error:', error);
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 });
  }
}
