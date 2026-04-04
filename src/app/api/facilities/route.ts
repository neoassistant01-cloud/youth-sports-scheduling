import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = 'gameon.json';

interface DbData {
  facilities: any[];
  availabilityRules: any[];
  teams: any[];
  players: any[];
  schedules: any[];
  preferences: any[];
  nextId: { facilities: number; teams: number; schedules: number; preferences: number };
}

const defaultData: DbData = {
  facilities: [],
  availabilityRules: [],
  teams: [],
  players: [],
  schedules: [],
  preferences: [
    { key: 'weekday_evening_start', value: '16:00' },
    { key: 'weekday_evening_end', value: '21:00' },
    { key: 'rest_days_required', value: '1' }
  ],
  nextId: { facilities: 1, teams: 1, schedules: 1, preferences: 1 }
};

function loadDb(): DbData {
  if (!fs.existsSync(DB_PATH)) {
    const initialData: DbData = {
      ...defaultData,
      facilities: [
        { id: 1, name: 'Apple Valley High School Field', address: '100 Apple Valley Rd, Apple Valley, MN', capacity: 100, surface_type: 'grass', has_lighting: 1, notes: null, created_at: Date.now(), updated_at: Date.now() },
        { id: 2, name: 'Galaxie Sports Complex', address: '1500 Galaxie Ave, Apple Valley, MN', capacity: 200, surface_type: 'turf', has_lighting: 1, notes: null, created_at: Date.now(), updated_at: Date.now() },
        { id: 3, name: 'Memorial Park Court', address: '200 Main St, Lakeville, MN', capacity: 50, surface_type: 'hardwood', has_lighting: 0, notes: null, created_at: Date.now(), updated_at: Date.now() }
      ],
      teams: [
        { id: 1, name: 'Apple Valley U10 Blue', age_group: 'U10', division: 'Blue', sport: 'Soccer', coach_name: 'Mike Johnson', coach_email: 'mike@email.com', coach_phone: '612-555-0101', created_at: Date.now(), updated_at: Date.now() },
        { id: 2, name: 'Apple Valley U10 Red', age_group: 'U10', division: 'Red', sport: 'Soccer', coach_name: 'Sarah Smith', coach_email: 'sarah@email.com', coach_phone: '612-555-0102', created_at: Date.now(), updated_at: Date.now() }
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDb(data: DbData) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = loadDb();
    return NextResponse.json(data.facilities);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = loadDb();
    const body = await request.json();
    const now = Date.now();
    const facility = {
      id: data.nextId.facilities++,
      name: body.name,
      address: body.address || null,
      capacity: body.capacity || null,
      surface_type: body.surfaceType || null,
      has_lighting: body.hasLighting ? 1 : 0,
      notes: body.notes || null,
      created_at: now,
      updated_at: now
    };
    data.facilities.push(facility);
    saveDb(data);
    return NextResponse.json({ id: facility.id, ...body, message: 'Facility created' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create facility' }, { status: 500 });
  }
}
