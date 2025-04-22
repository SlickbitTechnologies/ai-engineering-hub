import { NextResponse } from 'next/server';
import { getOperatingHours, updateOperatingHours } from '@/lib/dbQueries';

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
    const hours = await getOperatingHours();
    return NextResponse.json(hours);
  } catch (error) {
    console.error('Error fetching operating hours:', error);
    return NextResponse.json({ error: 'Failed to fetch operating hours' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json() as OperatingHours[];
    
    for (const item of data) {
      await updateOperatingHours(item);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating operating hours:', error);
    return NextResponse.json({ error: 'Failed to update operating hours' }, { status: 500 });
  }
} 