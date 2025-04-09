import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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

    const db = await getDb();
    
    const reservations = await db.all(`
      SELECT 
        date,
        COUNT(*) as count,
        GROUP_CONCAT(status) as statuses
      FROM reservations
      WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?
      GROUP BY date
    `, [year, month.padStart(2, '0')]);

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching calendar reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar reservations' },
      { status: 500 }
    );
  }
} 