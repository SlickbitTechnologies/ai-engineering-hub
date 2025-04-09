import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/tables/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const db = await getDb();
    const table = await db.get('SELECT * FROM tables WHERE id = ?', params.id);

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

    const db = await getDb();
    const result = await db.run(
      'UPDATE tables SET name = ?, section = ?, capacity = ?, status = ? WHERE id = ?',
      [name, section, capacity, status, params.id]
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    const updatedTable = await db.get('SELECT * FROM tables WHERE id = ?', params.id);
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
    const reservations = await db.get(
      'SELECT COUNT(*) as count FROM reservations WHERE table_id = ?',
      p.id
    );

    if (reservations.count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete table with existing reservations' },
        { status: 400 }
      );
    }

    const result = await db.run('DELETE FROM tables WHERE id = ?', params.id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    );
  }
} 