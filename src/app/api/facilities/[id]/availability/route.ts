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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = loadDb();
    const facilityId = parseInt(params.id);
    const rules = (data.availabilityRules || []).filter((r: any) => r.facility_id === facilityId);
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = loadDb();
    const body = await request.json();
    const facilityId = parseInt(params.id);
    
    const rules = data.availabilityRules || [];
    const maxId = Math.max(0, ...rules.map((r: any) => r.id));
    
    const newRule = {
      id: maxId + 1,
      facility_id: facilityId,
      day_of_week: body.dayOfWeek,
      start_time: body.startTime,
      end_time: body.endTime,
      is_active: 1
    };
    
    rules.push(newRule);
    data.availabilityRules = rules;
    saveDb(data);
    
    return NextResponse.json(newRule);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = loadDb();
    const body = await request.json();
    const ruleId = parseInt(params.id);
    
    const rules = data.availabilityRules || [];
    const idx = rules.findIndex((r: any) => r.id === ruleId);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    rules[idx] = { ...rules[idx], ...body, is_active: body.isActive !== false ? 1 : 0 };
    data.availabilityRules = rules;
    saveDb(data);
    
    return NextResponse.json(rules[idx]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = loadDb();
    const ruleId = parseInt(params.id);
    
    data.availabilityRules = (data.availabilityRules || []).filter((r: any) => r.id !== ruleId);
    saveDb(data);
    
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
