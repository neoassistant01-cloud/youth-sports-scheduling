import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

// Enhanced stub for sending email and SMS notifications
// In production, email would use SendGrid/Mailgun, SMS would use Twilio
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const data = loadDb();
    const body = await request.json();
    const { type, scheduleIds, teamIds, channel = 'both' } = body;

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

    // Get parent emails and phone numbers from players
    const affectedTeamIds = new Set<number>();
    targetSchedules.forEach((s: any) => {
      if (s.home_team_id) affectedTeamIds.add(s.home_team_id);
      if (s.away_team_id) affectedTeamIds.add(s.away_team_id);
    });

    const parentEmails: string[] = [];
    const parentPhones: string[] = [];
    const players = data.players || [];
    affectedTeamIds.forEach(teamId => {
      const teamPlayers = players.filter((p: any) => p.team_id === teamId);
      teamPlayers.forEach((p: any) => {
        if (p.parent_email) parentEmails.push(p.parent_email);
        if (p.parent_phone) parentPhones.push(p.parent_phone);
      });
    });

    const uniqueEmails = [...new Set(parentEmails)];
    const uniquePhones = [...new Set(parentPhones)];

    // Stub responses based on channel
    const results: any = {
      success: true,
      type,
      channels: [],
      recipients: {
        email: uniqueEmails.length,
        sms: uniquePhones.length
      }
    };

    if (channel === 'both' || channel === 'email') {
      console.log(`[EMAIL STUB] Would send ${type} notification to ${uniqueEmails.length} parents`);
      console.log(`[EMAIL STUB] Schedules:`, targetSchedules.map((s: any) => s.title));
      results.channels.push('email');
      results.emailPreview = {
        subject: type === 'game' ? '⚽ Game Scheduled!' : '🏃 Practice Scheduled!',
        body: `Your child's ${type} has been scheduled. Please check the GameOn portal for details.\n\nDate: ${targetSchedules[0] ? new Date(targetSchedules[0].start_time).toLocaleDateString() : 'TBD'}\nTime: ${targetSchedules[0] ? new Date(targetSchedules[0].start_time).toLocaleTimeString() : 'TBD'}`
      };
    }

    if (channel === 'both' || channel === 'sms') {
      console.log(`[SMS STUB] Would send ${type} reminder to ${uniquePhones.length} parents`);
      results.channels.push('sms');
      results.smsPreview = {
        message: `GameOn: ${type === 'game' ? 'Game' : 'Practice'} scheduled for ${targetSchedules[0] ? new Date(targetSchedules[0].start_time).toLocaleDateString() : 'TBD'} at ${targetSchedules[0] ? new Date(targetSchedules[0].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}. Log in to view details.`
      };
    }

    results.message = `Notification stub: Would send ${type} via ${results.channels.join(' & ')} to ${results.recipients.email} email(s) and ${results.recipients.sms} SMS(es)`;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}

// GET - retrieve notification settings and history (stub)
export async function GET() {
  return NextResponse.json({
    history: [],
    settings: {
      emailEnabled: true,
      smsEnabled: false,
      defaultChannel: 'both',
      reminderHoursBefore: 24
    },
    message: 'Notification settings - configure in production'
  });
}
