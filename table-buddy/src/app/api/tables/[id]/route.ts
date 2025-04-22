import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTableById, updateTable, deleteTable, getReservationsByTableId } from '@/lib/dbQueries';
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/tables/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const db = await getDb();
    const {id} = await params
    const table = await getTableById(id);

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table' },
      { status: 500 }
    );
  }
}

// PUT /api/tables/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { name, section, capacity, status } = body;

    // Validate required fields
    if (!name || !section || !capacity) {
      return NextResponse.json(
        { error: 'Name, section, and capacity are required' },
        { status: 400 }
      );
    }
    const {id} = await params
    const result = await updateTable(id, {
      name,
      section,
      capacity:parseInt(capacity),
      status
    });

    const updatedTable = await getTableById(id);
    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const db = await getDb();
    // const body = await request.json();
    const p = await params;
    // console.log("body",body);
    console.log("p",p);
    // Check if table has any reservations
    const reservations = await getReservationsByTableId(p.id);

    if (reservations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete table with existing reservations' },
        { status: 400 }
      );
    }

    const result = await deleteTable(p.id);

    return NextResponse.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    );
  }
} 