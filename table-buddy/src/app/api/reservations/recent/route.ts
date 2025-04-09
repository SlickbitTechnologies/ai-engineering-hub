import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    const reservations = await db.all(`
      SELECT 
        id,
        customer_name as customerName,
        customer_phone as phoneNumber,
        date,
        time,
        party_size as guests,
        status,
        created_at as created
      FROM reservations 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching recent reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent reservations' },
      { status: 500 }
    );
  }
} 