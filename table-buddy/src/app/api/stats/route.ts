import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get current time in HH:MM format
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Get time one hour from now
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourLaterTime = oneHourLater.toTimeString().slice(0, 5);

    const db = await getDb();

    // Fetch confirmed reservations for today
    const confirmedResult = await db.get(
      'SELECT COUNT(*) as count FROM reservations WHERE date = ? AND status = ?',
      [today, 'confirmed']
    );
    const confirmedReservations = confirmedResult?.count || 0;

    // Fetch pending reservations for today
    const pendingResult = await db.get(
      'SELECT COUNT(*) as count FROM reservations WHERE date = ? AND status = ?',
      [today, 'pending']
    );
    const pendingReservations = pendingResult?.count || 0;

    // Fetch upcoming reservations within the next hour
    const upcomingResult = await db.get(
      'SELECT COUNT(*) as count FROM reservations WHERE date = ? AND time BETWEEN ? AND ? AND status = ?',
      [today, currentTime, oneHourLaterTime, 'confirmed']
    );
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