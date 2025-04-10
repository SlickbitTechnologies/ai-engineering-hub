import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
export async function GET() {
    try {
      const db = await getDb();
      
      const tables = await db.all(`
        SELECT 
          t.id,
          t.name as tableName,
          t.capacity || ' guests' as capacity,
          t.section,
          t.attributes,
          r.customer_name as customerName,
          r.time,
          r.party_size || ' guests' as guests,
          r.status
        FROM tables t
        LEFT JOIN reservations r ON t.id = r.table_id 
          AND r.date = date('now')
          AND r.status != 'cancelled'
        ORDER BY t.id
      `);
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