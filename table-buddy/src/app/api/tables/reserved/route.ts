import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getReservedTables } from '@/lib/dbQueries';
export async function GET() {
    try {
      const db = await getDb();
      
      const tables = await getReservedTables();
      console.log("Tables:",tables);
      // Format the data to match the expected structure
      const formattedTables = tables.map(table => {
        const attributes = table.attributes ? typeof table.attributes === 'string' ? table.attributes.split(',') : table.attributes : [];
        return {
            id: table.id,
            tableName: table.tableName,
            capacity: table.capacity,
            section: table.section,
            attributes: attributes,
            reservation: table.customerName ? {
              customerName: table.customerName,
              time: table.time,
              guests: table.guests,
              status: table.status
            } : undefined
          }
      });
  
      return NextResponse.json(formattedTables);
    } catch (error) {
      console.error('Error fetching table reservations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch table reservations' },
        { status: 500 }
      );
    }
  }

  