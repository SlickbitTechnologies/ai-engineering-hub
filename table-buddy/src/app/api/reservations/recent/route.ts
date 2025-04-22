import { NextResponse } from 'next/server';
import { getRecentReservations } from '@/lib/dbQueries';

export async function GET() {
  try {
    const reservations = await getRecentReservations();

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching recent reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent reservations' },
      { status: 500 }
    );
  }
} 