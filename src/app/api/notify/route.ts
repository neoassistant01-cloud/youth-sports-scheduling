import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

// Stub for sending email notifications
// In production, this would integrate with SendGrid, Mailgun, etc.
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const data = loadDb();
    const body = await request.json();
    const { type, scheduleIds, teamIds } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing required field: type' }, { status: 400 });
    }

    // Get schedules to notify about
    let targetSchedules = [];
    if (scheduleIds && scheduleIds.length > 0) {
      targetSchedules = (data.schedules || []).filter((s: any) => scheduleIds.includes(s.id));
    } else if (teamIds && teamIds.length > 0) {
      targetSchedules = (data.schedules || []).filter((s: any) => 
        teamIds.includes(s.home_team_id) || teamIds.includes(s.away_team_id)
      );
    } else {
      targetSchedules = data.schedules || [];
    }

    // Get parent emails from players
    const affectedTeamIds = new Set<number>();
    targetSchedules.forEach((s: any) => {
      if (s.home_team_id) affectedTeamIds.add(s.home_team_id);
      if (s.away_team_id) affectedTeamIds.add(s.away_team_id);
    });

    const parentEmails: string[] = [];
    const players = data.players || [];
    affectedTeamIds.forEach(teamId => {
      const teamPlayers = players.filter((p: any) => p.team_id === teamId);
      teamPlayers.forEach((p: any) => {
        if (p.parent_email) parentEmails.push(p.parent_email);
      });
    });

    // Stub response - in production would send actual emails
    const uniqueEmails = [...new Set(parentEmails)];
    
    console.log(`[STUB] Would send ${type} notification to ${uniqueEmails.length} parents`);
    console.log(`[STUB] Schedules:`, targetSchedules.map((s: any) => s.title));

    return NextResponse.json({
      success: true,
      message: `Stub: Would send ${type} notification to ${uniqueEmails.length} parent(s)`,
      recipientCount: uniqueEmails.length,
      type,
      preview: {
        subject: type === 'schedule' ? 'Game Schedule Update' : 'Practice Schedule Update',
        body: `Your child's schedule has been updated. Please check the portal for details.`
      }
    });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}

// GET - retrieve notification history (stub)
export async function GET() {
  return NextResponse.json({
    history: [],
    message: 'Notification history stub - no past notifications'
  });
}
