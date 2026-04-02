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

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Check if a time slot conflicts with facility availability rules
function isFacilityAvailable(dbData: any, facility: any, startTime: Date): boolean {
  const dayName = getDayName(startTime);
  const hour = startTime.getHours();
  const minutes = startTime.getMinutes();
  const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  const rules = (dbData.availability_rules || []).filter((r: any) => 
    r.facility_id === facility.id && r.is_active !== 0
  );
  
  if (rules.length === 0) return true;
  
  const matchingRule = rules.find((r: any) => 
    r.day_of_week === dayName && timeStr >= r.start_time && timeStr < r.end_time
  );
  
  return !!matchingRule;
}

// Check if a facility has a scheduling conflict
function hasTimeConflict(schedules: any[], facilityId: number, startTime: number, endTime: number, excludeIds: number[] = []): boolean {
  return schedules.some((s: any) => {
    if (excludeIds.includes(s.id)) return false;
    if (s.facility_id !== facilityId) return false;
    const existingStart = s.start_time;
    const existingEnd = s.end_time;
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

// Check if team has had enough rest - prevent same-day evening conflicts
function hasRestDayConflict(schedules: any[], teamId: number, startTime: number): boolean {
  const teamEvents = schedules
    .filter((s: any) => s.home_team_id === teamId || s.away_team_id === teamId)
    .sort((a: any, b: any) => a.start_time - b.start_time);
  
  if (teamEvents.length === 0) return false;
  
  const lastEvent = teamEvents[teamEvents.length - 1];
  const lastEndDate = new Date(lastEvent.end_time);
  const newStartDate = new Date(startTime);
  
  // Check if same calendar day
  if (lastEndDate.toDateString() === newStartDate.toDateString()) {
    return true; // same day conflict
  }
  
  // Check if less than 20 hours between events (overnight rest)
  const hoursBetween = (startTime - lastEvent.end_time) / (1000 * 60 * 60);
  return hoursBetween < 20;
}

// Check max weekly events per team
function hasMaxWeeklyConflict(schedules: any[], teamId: number, startTime: number, maxPerWeek: number = 3): boolean {
  const teamEvents = schedules.filter((s: any) => 
    s.home_team_id === teamId || s.away_team_id === teamId
  );
  
  const proposedDate = new Date(startTime);
  const proposedWeekStart = new Date(proposedDate);
  proposedWeekStart.setDate(proposedWeekStart.getDate() - proposedWeekStart.getDay());
  proposedWeekStart.setHours(0, 0, 0, 0);
  
  const proposedWeekEnd = new Date(proposedWeekStart);
  proposedWeekEnd.setDate(proposedWeekEnd.getDate() + 7);
  
  const eventsThisWeek = teamEvents.filter((s: any) => 
    s.start_time >= proposedWeekStart.getTime() && s.start_time < proposedWeekEnd.getTime()
  );
  
  return eventsThisWeek.length >= maxPerWeek;
}

// Check if time slot is within preferred hours
function isWithinPreferredHours(startTime: Date, preferredStartHour: number = 16, preferredEndHour: number = 21): boolean {
  const hour = startTime.getHours();
  return hour >= preferredStartHour && hour < preferredEndHour;
}

// Generate schedule slots with priority
function generateScheduleSlots(
  numEvents: number, 
  startHour: number = 16,
  endHour: number = 21,
  durationHours: number = 1
) {
  const slots: { start: Date; end: Date; priority: number }[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(0, 0, 0, 0);
  
  // Saturday is preferred for youth sports, then Monday/Wednesday
  const preferredDays = ['saturday', 'monday', 'wednesday'];
  
  // Time preferences: earlier weekday evenings are better
  const preferredHours = [16, 17, 18, 19, 20, 9, 10, 11, 8, 12];
  
  const maxAttempts = numEvents * 4;
  let dayOffset = 0;
  
  while (slots.length < maxAttempts && dayOffset < 45) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    dayOffset++;
    
    const dayName = getDayName(checkDate);
    const isPreferredDay = preferredDays.includes(dayName);
    
    // Skip Friday evenings (less available)
    if (dayName === 'friday') continue;
    
    for (const hour of preferredHours) {
      if (slots.length >= maxAttempts) break;
      
      const slotDate = new Date(checkDate);
      slotDate.setHours(hour, 0, 0, 0);
      const endDate = new Date(slotDate);
      endDate.setHours(endDate.getHours() + durationHours);
      
      let priority = 1;
      if (isPreferredDay) priority += 2;
      if (isWeekend(checkDate)) {
        priority += hour >= 9 && hour <= 14 ? 3 : 0; // morning/early afternoon on weekends
      } else {
        priority += hour >= 16 && hour <= 19 ? 2 : 0; // prime evening slots
      }
      
      slots.push({ start: slotDate, end: endDate, priority });
    }
  }
  
  slots.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.start.getTime() - b.start.getTime();
  });
  
  return slots;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const data = loadDb();
    const body = await request.json();
    const { facilityId, teamIds, eventType } = body;
    
    if (!facilityId || !teamIds || teamIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields: facilityId, teamIds' }, { status: 400 });
    }
    
    const facility = (data.facilities || []).find((f: any) => f.id === facilityId);
    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
    }
    
    const validTeams = teamIds.filter((tid: number) => 
      (data.teams || []).some((t: any) => t.id === tid)
    );
    if (validTeams.length === 0) {
      return NextResponse.json({ error: 'No valid teams found' }, { status: 400 });
    }
    
    const settings = data.preferences || [];
    const startHourSetting = settings.find((p: any) => p.key === 'weekday_evening_start')?.value || '16';
    const endHourSetting = settings.find((p: any) => p.key === 'weekday_evening_end')?.value || '21';
    
    const prefStartHour = parseInt(startHourSetting.split(':')[0]);
    const prefEndHour = parseInt(endHourSetting.split(':')[0]);
    const duration = eventType === 'game' ? 1.5 : 1;
    
    const numEvents = eventType === 'game' ? Math.ceil(validTeams.length / 2) : validTeams.length;
    const slots = generateScheduleSlots(numEvents * 2, prefStartHour, prefEndHour, duration);
    
    data.schedules = data.schedules || [];
    const createdSchedules: any[] = [];
    let conflicts = 0;
    const conflictReasons: string[] = [];
    
    for (let i = 0; i < slots.length && createdSchedules.length < numEvents; i++) {
      const slot = slots[i];
      const startTime = slot.start.getTime();
      const endTime = slot.end.getTime();
      
      let homeTeamIdx: number, awayTeamIdx: number | null;
      
      if (eventType === 'game' && validTeams.length > 1) {
        homeTeamIdx = createdSchedules.length * 2;
        awayTeamIdx = homeTeamIdx + 1;
        
        if (homeTeamIdx >= validTeams.length) break;
        if (awayTeamIdx >= validTeams.length) awayTeamIdx = null;
      } else {
        homeTeamIdx = createdSchedules.length % validTeams.length;
        awayTeamIdx = null;
      }
      
      const homeTeamId = validTeams[homeTeamIdx];
      const awayTeamId = awayTeamIdx !== null ? validTeams[awayTeamIdx] : null;
      
      // Check conflicts
      if (hasTimeConflict(data.schedules, facilityId, startTime, endTime)) {
        conflicts++;
        conflictReasons.push(`Facility conflict at ${slot.start.toLocaleString()}`);
        continue;
      }
      
      const team1Conflict = homeTeamId ? hasTeamConflict(data.schedules, homeTeamId, startTime, endTime) : false;
      const team2Conflict = awayTeamId ? hasTeamConflict(data.schedules, awayTeamId, startTime, endTime) : false;
      
      if (team1Conflict || team2Conflict) {
        conflicts++;
        conflictReasons.push(`Team conflict at ${slot.start.toLocaleString()}`);
        continue;
      }
      
      const restDay1Conflict = homeTeamId ? hasRestDayConflict(data.schedules, homeTeamId, startTime) : false;
      const restDay2Conflict = awayTeamId ? hasRestDayConflict(data.schedules, awayTeamId, startTime) : false;
      
      if (restDay1Conflict || restDay2Conflict) {
        conflicts++;
        conflictReasons.push(`Rest day conflict at ${slot.start.toLocaleString()}`);
        continue;
      }
      
      const weekly1Conflict = homeTeamId ? hasMaxWeeklyConflict(data.schedules, homeTeamId, startTime, 3) : false;
      const weekly2Conflict = awayTeamId ? hasMaxWeeklyConflict(data.schedules, awayTeamId, startTime, 3) : false;
      
      if (weekly1Conflict || weekly2Conflict) {
        conflicts++;
        conflictReasons.push(`Max weekly at ${slot.start.toLocaleString()}`);
        continue;
      }
      
      if (!isFacilityAvailable(data, facility, slot.start)) {
        conflicts++;
        conflictReasons.push(`Facility unavailable at ${slot.start.toLocaleString()}`);
        continue;
      }
      
      const maxId = data.schedules.reduce((max: number, s: any) => Math.max(max, s.id), 0) || 0;
      
      const homeTeam = (data.teams || []).find((t: any) => t.id === homeTeamId);
      const awayTeam = awayTeamId ? (data.teams || []).find((t: any) => t.id === awayTeamId) : null;
      
      const schedule = {
        id: maxId + createdSchedules.length + 1,
        facility_id: facilityId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        event_type: eventType || 'practice',
        title: eventType === 'game' 
          ? `Game: ${homeTeam?.name || 'Team ' + homeTeamId} vs ${awayTeam ? awayTeam.name : 'TBD'}`
          : `Practice: ${homeTeam?.name || 'Team ' + homeTeamId}`,
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
    
    data.schedules.push(...createdSchedules);
    saveDb(data);
    
    const uniqueReasons = Array.from(new Set(conflictReasons)).slice(0, 5);
    
    return NextResponse.json({ 
      message: createdSchedules.length > 0 ? 'Schedules generated' : 'No schedules created',
      count: createdSchedules.length,
      skippedConflicts: conflicts,
      conflictSummary: uniqueReasons,
      schedules: createdSchedules.map(s => ({ 
        id: s.id, 
        title: s.title, 
        start_time: s.start_time,
        event_type: s.event_type 
      }))
    });
  } catch (error) {
    console.error('Schedule generation error:', error);
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 });
  }
}
