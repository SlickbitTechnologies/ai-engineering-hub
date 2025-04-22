import { NextResponse } from 'next/server';
import { deleteReservation, findExistingReservation, getReservationById, getTableById, updateReservation } from '@/lib/dbQueries';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/reservations/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const {id} = await params
    const reservation = await getReservationById(id);

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

// PUT /api/reservations/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const {
      table_id,
      customer_name,
      customer_email,
      customer_phone,
      party_size,
      date,
      time,
      status,
      occasion,
      special_requests
    } = body;

    // Validate required fields
    if (!table_id || !customer_name || !customer_phone || !party_size || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    

    // Check if table exists and has enough capacity
    const table = await getTableById(table_id)
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

    // Check if table is available at the requested time (excluding current reservation)
    // const existingReservation = await db.get(`
    //   SELECT * FROM reservations 
    //   WHERE table_id = ? 
    //   AND date = ? 
    //   AND time = ?
    //   AND status = 'confirmed'
    //   AND id != ?
    // `, [table_id, date, time, params.id]);
    const {id} = await params
    const existingReservation = await findExistingReservation(table_id, date, time, id);
    if (existingReservation) {
      return NextResponse.json(
        { error: 'Table is already reserved for this time' },
        { status: 400 }
      );
    }

    const result = await updateReservation(id, {
      table_id,
      customer_name,
      customer_email,
      customer_phone,
      party_size,
      date,
      time,
      status,
      occasion,
      special_requests
    });
    // Update the reservation
    // const result = await db.run(`
    //   UPDATE reservations SET
    //     table_id = ?,
    //     customer_name = ?,
    //     customer_email = ?,
    //     customer_phone = ?,
    //     party_size = ?,
    //     date = ?,
    //     time = ?,
    //     status = ?,
    //     occasion = ?,
    //     special_requests = ?
    //   WHERE id = ?
    // `, [
    //   table_id,
    //   customer_name,
    //   customer_email,
    //   customer_phone,
    //   party_size,
    //   date,
    //   time,
    //   status,
    //   occasion,
    //   special_requests,
    //   params.id
    // ]);

    const updatedReservation = await getReservationById(id)
    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
}

// DELETE /api/reservations/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
  

    // Get the reservation to find its table
    const {id} = await params
    const reservation = await getReservationById(id);
    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Delete the reservation
    await deleteReservation(id);

    // Update table status to available
    // await db.run(
    //   'UPDATE tables SET status = ? WHERE id = ?',
    //   ['available', reservation.table_id]
    // );

    return NextResponse.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json(
      { error: 'Failed to delete reservation' },
      { status: 500 }
    );
  }
} 