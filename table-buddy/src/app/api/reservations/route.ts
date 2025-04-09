import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/reservations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    const db = await getDb();
    let query = `
      SELECT 
        r.*,
        t.name as table_name,
        t.section as table_section
      FROM reservations r
      JOIN tables t ON r.table_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND r.date = ?';
      params.push(date);
    }

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.date, r.time';

    const reservations = await db.all(query, params);
    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}

// POST /api/reservations
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tableId: table_id,
      customerName: customer_name,
      email: customer_email,
      phoneNumber: customer_phone,
      numberOfGuests: party_size,
      date: date,
      time: time,
      occasion,
      specialRequests:special_requests
    } = body;
    console.log(body);
    // Validate required fields
    if (!table_id || !customer_name || !customer_phone || !party_size || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if table exists and has enough capacity
    const table = await db.get('SELECT * FROM tables WHERE id = ?', table_id);
    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    if (table.capacity < party_size) {
      return NextResponse.json(
        { error: 'Table capacity is not sufficient for the party size' },
        { status: 400 }
      );
    }

    // Check if table is available at the requested time
    const existingReservation = await db.get(`
      SELECT * FROM reservations 
      WHERE table_id = ? 
      AND date = ? 
      AND time = ?
      AND status = 'confirmed'
    `, [table_id, date, time]);

    if (existingReservation) {
      return NextResponse.json(
        { error: 'Table is already reserved for this time' },
        { status: 400 }
      );
    }

    // Create the reservation
    const result = await db.run(`
      INSERT INTO reservations (
        table_id, customer_name, customer_email, customer_phone,
        party_size, date, time, occasion, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      table_id, customer_name, customer_email, customer_phone,
      party_size, date, time, occasion, special_requests
    ]);

    // Update table status
    // await db.run(
    //   'UPDATE tables SET status = ? WHERE id = ?',
    //   ['reserved', table_id]
    // );

    const newReservation = await db.get('SELECT * FROM reservations WHERE id = ?', result.lastID);
    return NextResponse.json(newReservation, { status: 201 });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
} 