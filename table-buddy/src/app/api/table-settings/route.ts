import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const settings = await db.get('SELECT * FROM table_settings');
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
    
    await db.run(`
      INSERT OR REPLACE INTO table_settings (id, turnaround_time)
      VALUES (1, ?)
    `, [turnaround_time]);

    return NextResponse.json({ turnaround_time });
  } catch (error) {
    console.error('Error updating table settings:', error);
    return NextResponse.json({ error: 'Failed to update table settings' }, { status: 500 });
  }
} 