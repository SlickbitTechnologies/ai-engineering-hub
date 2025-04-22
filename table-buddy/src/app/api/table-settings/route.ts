import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTableSettings, updateTableSettings } from '@/lib/dbQueries';
export async function GET() {
  try {
    const db = await getDb();
    const settings = await getTableSettings();
    return NextResponse.json(settings || { turnaround_time: 30 });
  } catch (error) {
    console.error('Error fetching table settings:', error);
    return NextResponse.json({ error: 'Failed to fetch table settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { turnaround_time } = await request.json();
    const db = await getDb();
    
    await updateTableSettings({turnaround_time});

    return NextResponse.json({ turnaround_time });
  } catch (error) {
    console.error('Error updating table settings:', error);
    return NextResponse.json({ error: 'Failed to update table settings' }, { status: 500 });
  }
} 