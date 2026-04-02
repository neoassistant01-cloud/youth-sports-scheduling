import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

function loadDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = loadDb();
    return NextResponse.json(data.preferences || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = loadDb();
    const body = await request.json();
    const mappings = [
      { key: 'weekday_evening_start', value: body.weekdayEveningStart },
      { key: 'weekday_evening_end', value: body.weekdayEveningEnd },
      { key: 'weekend_morning_start', value: body.weekendMorningStart },
      { key: 'weekend_afternoon_end', value: body.weekendAfternoonEnd },
      { key: 'rest_days_required', value: body.restDaysRequired },
      { key: 'max_games_per_day', value: body.maxGamesPerDay }
    ];
    data.preferences = data.preferences || [];
    for (const { key, value } of mappings) {
      const idx = data.preferences.findIndex((p: any) => p.key === key);
      if (idx >= 0) data.preferences[idx].value = value;
      else data.preferences.push({ key, value });
    }
    saveDb(data);
    return NextResponse.json({ message: 'Saved' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
