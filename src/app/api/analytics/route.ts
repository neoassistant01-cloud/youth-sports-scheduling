import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { facilities: [], teams: [], players: [], schedules: [], preferences: [] };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const data = loadDb();
    
    const teams = data.teams || [];
    const players = data.players || [];
    const coaches = data.coaches || [];
    const facilities = data.facilities || [];
    const schedules = data.schedules || [];
    
    const now = Date.now();
    const upcomingGames = schedules.filter((s: any) => s.start_time > now && s.is_published);
    const publishedSchedules = schedules.filter((s: any) => s.is_published);
    
    // Group teams by sport
    const teamsBySport: Record<string, number> = {};
    teams.forEach((t: any) => {
      const sport = t.sport || 'Unspecified';
      teamsBySport[sport] = (teamsBySport[sport] || 0) + 1;
    });
    
    // Group players by team
    const playersByTeam: Record<number, number> = {};
    players.forEach((p: any) => {
      playersByTeam[p.team_id] = (playersByTeam[p.team_id] || 0) + 1;
    });
    
    // Get facility usage
    const facilityUsage: Record<number, number> = {};
    schedules.forEach((s: any) => {
      facilityUsage[s.facility_id] = (facilityUsage[s.facility_id] || 0) + 1;
    });
    
    return NextResponse.json({
      totalTeams: teams.length,
      totalPlayers: players.length,
      totalCoaches: coaches.length,
      totalFacilities: facilities.length,
      totalSchedules: schedules.length,
      publishedSchedules: publishedSchedules.length,
      upcomingGames: upcomingGames.length,
      teamsBySport,
      playersByTeam,
      facilityUsage
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
