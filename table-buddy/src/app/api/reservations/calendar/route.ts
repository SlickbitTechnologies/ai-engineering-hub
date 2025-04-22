import { NextResponse } from 'next/server';
import { getReservationCountByDate } from '@/lib/dbQueries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
    }

    const reservations = await getReservationCountByDate(year, month);

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching calendar reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar reservations' },
      { status: 500 }
    );
  }
} 