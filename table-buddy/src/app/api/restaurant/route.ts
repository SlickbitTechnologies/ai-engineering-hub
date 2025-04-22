import { NextResponse } from 'next/server';
import { getRestaurantSettings } from '@/lib/dbQueries';
import { updateRestaurantSettings } from '@/lib/dbQueries';


// GET /api/restaurant
export async function GET() {
  try {
    const settings = await getRestaurantSettings();
    
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


    
    const updatedSettings = await updateRestaurantSettings({
      name,
      phone,
      email,
      address
    });
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating restaurant settings:', error);
    return NextResponse.json(
      { error: 'Failed to update restaurant settings' },
      { status: 500 }
    );
  }
} 


