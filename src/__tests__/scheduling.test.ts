import { describe, it, expect } from 'vitest';

function getDayName(date: Date): string {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function hasTimeConflict(schedules: any[], facilityId: number, startTime: number, endTime: number, excludeIds: number[] = []): boolean {
  return schedules.some((s: any) => {
    if (excludeIds.includes(s.id)) return false;
    if (s.facility_id !== facilityId) return false;
    const existingStart = s.start_time;
    const existingEnd = s.end_time;
    return (startTime < existingEnd && endTime > existingStart);
  });
}

function hasTeamConflict(schedules: any[], teamId: number, startTime: number, endTime: number, excludeIds: number[] = []): boolean {
  return schedules.some((s: any) => {
    if (excludeIds.includes(s.id)) return false;
    if (s.home_team_id !== teamId && s.away_team_id !== teamId) return false;
    const existingStart = s.start_time;
    const existingEnd = s.end_time;
    return (startTime < existingEnd && endTime > existingStart);
  });
}

function hasRestDayConflict(schedules: any[], teamId: number, startTime: number): boolean {
  const teamEvents = schedules
    .filter((s: any) => s.home_team_id === teamId || s.away_team_id === teamId)
    .sort((a: any, b: any) => a.start_time - b.start_time);
  
  if (teamEvents.length === 0) return false;
  
  const lastEvent = teamEvents[teamEvents.length - 1];
  const lastEndDate = new Date(lastEvent.end_time);
  const newStartDate = new Date(startTime);
  
  if (lastEndDate.toDateString() === newStartDate.toDateString()) {
    return true;
  }
  
  const hoursBetween = (startTime - lastEvent.end_time) / (1000 * 60 * 60);
  return hoursBetween < 20;
}

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

function isWithinPreferredHours(startTime: Date, preferredStartHour: number = 16, preferredEndHour: number = 21): boolean {
  const hour = startTime.getHours();
  return hour >= preferredStartHour && hour < preferredEndHour;
}

describe('Scheduling Algorithm', () => {
  const existingSchedules = [
    { id: 1, facility_id: 1, home_team_id: 1, away_team_id: 2, start_time: 1704067200000, end_time: 1704070800000 },
    { id: 2, facility_id: 2, home_team_id: 2, away_team_id: null, start_time: 1704153600000, end_time: 1704157200000 },
  ];

  describe('hasTimeConflict', () => {
    it('should detect conflict for overlapping times at same facility', () => {
      // 4:30-6:30pm at facility 1 overlaps with 4-6pm
      const hasConflict = hasTimeConflict(existingSchedules, 1, 1704069000000, 1704072600000);
      expect(hasConflict).toBe(true);
    });

    it('should allow back-to-back events (end equals start)', () => {
      // 6-8pm is exactly back-to-back with 4-6pm (no overlap)
      const hasConflict = hasTimeConflict(existingSchedules, 1, 1704070800000, 1704074400000);
      expect(hasConflict).toBe(false);
    });

    it('should not detect conflict for different facilities', () => {
      const hasConflict = hasTimeConflict(existingSchedules, 3, 1704067200000, 1704070800000);
      expect(hasConflict).toBe(false);
    });

    it('should not detect conflict for non-overlapping times', () => {
      const hasConflict = hasTimeConflict(existingSchedules, 1, 1704081600000, 1704085200000);
      expect(hasConflict).toBe(false);
    });
  });

  describe('hasTeamConflict', () => {
    it('should detect conflict when team already has event', () => {
      const hasConflict = hasTeamConflict(existingSchedules, 1, 1704069000000, 1704072600000);
      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict for different teams', () => {
      const hasConflict = hasTeamConflict(existingSchedules, 3, 1704067200000, 1704070800000);
      expect(hasConflict).toBe(false);
    });

    it('should detect conflict when team is away team', () => {
      const hasConflict = hasTeamConflict(existingSchedules, 2, 1704067200000, 1704070800000);
      expect(hasConflict).toBe(true);
    });
  });

  describe('hasRestDayConflict', () => {
    it('should detect same-day conflict', () => {
      const restSchedules = [
        { id: 1, home_team_id: 1, away_team_id: null, end_time: 1704067200000 }
      ];
      const hasConflict = hasRestDayConflict(restSchedules, 1, 1704068000000);
      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict for next day', () => {
      const restSchedules = [
        { id: 1, home_team_id: 1, away_team_id: null, end_time: 1704067200000 }
      ];
      const hasConflict = hasRestDayConflict(restSchedules, 1, 1704153600000);
      expect(hasConflict).toBe(false);
    });
  });

  describe('hasMaxWeeklyConflict', () => {
    it('should detect when team has reached max weekly events', () => {
      const weekSchedules = [
        { id: 1, home_team_id: 1, away_team_id: null, start_time: 1704067200000 },
        { id: 2, home_team_id: 1, away_team_id: null, start_time: 1704153600000 },
        { id: 3, home_team_id: 1, away_team_id: null, start_time: 1704240000000 },
      ];
      const hasConflict = hasMaxWeeklyConflict(weekSchedules, 1, 1704326400000);
      expect(hasConflict).toBe(true);
    });

    it('should not conflict when under max', () => {
      const weekSchedules = [
        { id: 1, home_team_id: 1, away_team_id: null, start_time: 1704067200000 },
        { id: 2, home_team_id: 1, away_team_id: null, start_time: 1704153600000 },
      ];
      const hasConflict = hasMaxWeeklyConflict(weekSchedules, 1, 1704240000000);
      expect(hasConflict).toBe(false);
    });
  });

  describe('isWithinPreferredHours', () => {
    it('should return true for weekday evening hours', () => {
      const date = new Date();
      date.setHours(18, 0, 0, 0);
      expect(isWithinPreferredHours(date)).toBe(true);
    });

    it('should return false for early morning', () => {
      const date = new Date();
      date.setHours(8, 0, 0, 0);
      expect(isWithinPreferredHours(date)).toBe(false);
    });

    it('should return false for late night', () => {
      const date = new Date();
      date.setHours(22, 0, 0, 0);
      expect(isWithinPreferredHours(date)).toBe(false);
    });
  });

  describe('getDayName', () => {
    it('should return correct day names', () => {
      const sunday = new Date('2024-01-07');
      const monday = new Date('2024-01-08');
      expect(getDayName(sunday)).toBe('sunday');
      expect(getDayName(monday)).toBe('monday');
    });
  });

  describe('isWeekend', () => {
    it('should identify Saturday and Sunday', () => {
      const saturday = new Date('2024-01-06');
      const sunday = new Date('2024-01-07');
      const monday = new Date('2024-01-08');
      
      expect(isWeekend(saturday)).toBe(true);
      expect(isWeekend(sunday)).toBe(true);
      expect(isWeekend(monday)).toBe(false);
    });
  });
});
