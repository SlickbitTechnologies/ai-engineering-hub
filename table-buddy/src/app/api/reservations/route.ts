import { NextResponse } from 'next/server';
import { createReservation, getReservationById, getReservations, getReservationsByFilter, getTableById } from '@/lib/dbQueries';

// GET /api/reservations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    

    const reservations = await getReservationsByFilter(date, status);
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

    

    // Check if table exists and has enough capacity
    const table = await getTableById(table_id);
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
    const existingReservation = await getReservations(table_id, date, time);
    console.log("existingReservation",existingReservation);
    if (existingReservation.length > 0) {
      return NextResponse.json(
        { error: 'Table is already reserved for this time' },
        { status: 400 }
      );
    }

    // Create the reservation
    // const result = await db.run(`
    //   INSERT INTO reservations (
    //     table_id, customer_name, customer_email, customer_phone,
    //     party_size, date, time, occasion, special_requests
    //   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    // `, [
    //   table_id, customer_name, customer_email, customer_phone,
    //   party_size, date, time, occasion, special_requests
    // ]);
    const result = await createReservation({
      table_id,
      customer_name,
      customer_email,
      customer_phone,
      party_size,
      date,
      time,
      occasion,
      special_requests
    });
    // Update table status
    // await db.run(
    //   'UPDATE tables SET status = ? WHERE id = ?',
    //   ['reserved', table_id]
    // );

    const newReservation = await getReservationById(result.id);
    return NextResponse.json(newReservation, { status: 201 });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
} 