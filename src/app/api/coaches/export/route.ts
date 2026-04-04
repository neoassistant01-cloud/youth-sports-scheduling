import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const data = loadDb();
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    
    let coaches = data.coaches || [];
    if (teamId) {
      coaches = coaches.filter((c: any) => c.team_id === parseInt(teamId));
    }
    
    const teams = data.teams || [];
    const getTeamName = (id: number) => teams.find((t: any) => t.id === id)?.name || 'Unknown';
    
    const headers = ['Name', 'Team', 'Email', 'Phone'];
    const rows = coaches.map((c: any) => [
      c.name,
      getTeamName(c.team_id),
      c.email || '',
      c.phone || ''
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="coaches.csv"'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export coaches' }, { status: 500 });
  }
}
