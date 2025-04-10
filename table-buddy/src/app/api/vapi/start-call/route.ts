import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { assistantId } = await request.json();
    
    const response = await fetch('https://api.vapi.ai/call/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId,
        type: 'phone',
        phoneNumber: process.env.TEST_PHONE_NUMBER,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start Vapi call');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error starting Vapi call:', error);
    return NextResponse.json({ error: 'Failed to start call' }, { status: 500 });
  }
} 