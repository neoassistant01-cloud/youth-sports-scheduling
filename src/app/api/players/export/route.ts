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
    
    let players = data.players || [];
    if (teamId) {
      players = players.filter((p: any) => p.team_id === parseInt(teamId));
    }
    
    const teams = data.teams || [];
    const getTeamName = (id: number) => teams.find((t: any) => t.id === id)?.name || 'Unknown';
    
    const headers = ['First Name', 'Last Name', 'Team', 'Parent/Guardian', 'Email', 'Phone'];
    const rows = players.map((p: any) => [
      p.first_name,
      p.last_name,
      getTeamName(p.team_id),
      p.parent_name || '',
      p.parent_email || '',
      p.parent_phone || ''
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="players.csv"'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export players' }, { status: 500 });
  }
}
