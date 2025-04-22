import { NextResponse } from 'next/server';
import { getReservationCountByDateAndStatus, getUpcomingReservations } from '@/lib/dbQueries';


export async function GET() {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get current time in HH:MM format

    // Fetch confirmed reservations for today
    const confirmedReservations = await getReservationCountByDateAndStatus(today, 'confirmed');

    // Fetch pending reservations for today
    const pendingReservations = await getReservationCountByDateAndStatus(today, 'pending');
    

      // Fetch upcoming reservations within the next hour
      const upcomingResult = await getUpcomingReservations(today);
    console.log(upcomingResult);
    const upcomingReservations = upcomingResult?.count || 0;

    return NextResponse.json({
      confirmed: confirmedReservations,
      pending: pendingReservations,
      upcoming: upcomingReservations
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
} 