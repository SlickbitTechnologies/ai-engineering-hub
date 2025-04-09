import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface TimeSlot {
  openingTime: string;
  closingTime: string;
}

interface DaySchedule {
  lunch: TimeSlot;
  dinner: TimeSlot;
}

interface OperatingHours {
  day: string;
  lunch_opening_time: string;
  lunch_closing_time: string;
  dinner_opening_time: string;
  dinner_closing_time: string;
}

export async function GET() {
  try {
    const db = await getDb();
    const hours = await db.all('SELECT * FROM operating_hours');
    return NextResponse.json(hours);
  } catch (error) {
    console.error('Error fetching operating hours:', error);
    return NextResponse.json({ error: 'Failed to fetch operating hours' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json() as OperatingHours[];
    const db = await getDb();
    
    for (const item of data) {
      await db.run(`
        INSERT OR REPLACE INTO operating_hours (
          day,
          lunch_opening_time,
          lunch_closing_time,
          dinner_opening_time,
          dinner_closing_time
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        item.day,
        item.lunch_opening_time,
        item.lunch_closing_time,
        item.dinner_opening_time,
        item.dinner_closing_time
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating operating hours:', error);
    return NextResponse.json({ error: 'Failed to update operating hours' }, { status: 500 });
  }
} 