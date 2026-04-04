import { NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = loadDb();
    const published = (data.schedules || []).filter((s: any) => s.is_published);
    if (!published.length) return new NextResponse('No published schedules', { status: 404 });
    
    let ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//GameOn Scheduler//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n`;
    published.forEach((s: any) => {
      const facility = (data.facilities || []).find((f: any) => f.id === s.facility_id);
      const homeTeam = (data.teams || []).find((t: any) => t.id === s.home_team_id);
      const awayTeam = (data.teams || []).find((t: any) => t.id === s.away_team_id);
      const description = `${s.event_type}${homeTeam ? ` - ${homeTeam.name}` : ''}${awayTeam ? ` vs ${awayTeam.name}` : ''}`;
      ics += `BEGIN:VEVENT\r\nUID:${s.id}@gameon-scheduler\r\nDTSTART:${formatICSDate(new Date(s.start_time))}\r\nDTEND:${formatICSDate(new Date(s.end_time))}\r\nSUMMARY:${s.title || description}\r\nDESCRIPTION:${description}\r\nLOCATION:${facility?.name || ''}\r\nEND:VEVENT\r\n`;
    });
    ics += 'END:VCALENDAR\r\n';
    return new NextResponse(ics, { headers: { 'Content-Type': 'text/calendar', 'Content-Disposition': 'attachment; filename="schedule.ics"' } });
  } catch (error) {
    return new NextResponse('Export failed', { status: 500 });
  }
}
