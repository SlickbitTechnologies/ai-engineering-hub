import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/restaurant
export async function GET() {
  try {
    const db = await getDb();
    const settings = await db.get('SELECT * FROM restaurant_settings LIMIT 1');
    
    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        id: 1,
        name: '',
        phone: '',
        email: '',
        address: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching restaurant settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant settings' },
      { status: 500 }
    );
  }
}

// PUT /api/restaurant
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, address } = body;

    // Validate required fields
    if (!name || !phone || !email || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if settings exist
    const existingSettings = await db.get('SELECT * FROM restaurant_settings LIMIT 1');

    if (existingSettings) {
      // Update existing settings
      await db.run(`
        UPDATE restaurant_settings SET
          name = ?,
          phone = ?,
          email = ?,
          address = ?,
          updated_at = ?
        WHERE id = ?
      `, [name, phone, email, address, new Date().toISOString(), existingSettings.id]);
    } else {
      // Create new settings
      await db.run(`
        INSERT INTO restaurant_settings (
          name, phone, email, address, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [name, phone, email, address, new Date().toISOString(), new Date().toISOString()]);
    }

    // Return updated settings
    const updatedSettings = await db.get('SELECT * FROM restaurant_settings LIMIT 1');
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating restaurant settings:', error);
    return NextResponse.json(
      { error: 'Failed to update restaurant settings' },
      { status: 500 }
    );
  }
} 