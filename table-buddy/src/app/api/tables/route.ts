import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/tables
export async function GET() {
  try {
    const db = await getDb();
    
    const tables = await db.all(`
      SELECT * FROM tables
    `);

    // Format the data to match the expected structure
    

    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error fetching table reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table reservations' },
      { status: 500 }
    );
  }
}

// POST /api/tables
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, section, capacity, attributes } = body;

    // Validate required fields
    if (!name || !section || !capacity) {
      return NextResponse.json(
        { error: 'Name, section, and capacity are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.run(
      'INSERT INTO tables (name, section, capacity, attributes, status) VALUES (?, ?, ?, ?, ?)',
      [name, section, capacity, attributes, 'available']
    );

    const newTable = await db.get('SELECT * FROM tables WHERE id = ?', result.lastID);
    return NextResponse.json(newTable, { status: 201 });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    );
  }
} 