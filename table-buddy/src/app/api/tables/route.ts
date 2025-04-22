import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createTable, getTableById, getTables } from '@/lib/dbQueries';
// GET /api/tables
export async function GET() {
  try {
    const db = await getDb();
    
      const tables = await getTables();

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
    const { name, section, capacity, attributes } = await request.json();

    // Validate required fields
    if (!name || !section || !capacity) {
      return NextResponse.json(
        { error: 'Name, section, and capacity are required' },
        { status: 400 }
      );
    }

    const result = await createTable({
      name,
      section,
      capacity:parseInt(capacity),
      attributes,
      status: 'available'
    });

    const newTable = await getTableById(result.id);
    return NextResponse.json(newTable, { status: 201 });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    );
  }
} 