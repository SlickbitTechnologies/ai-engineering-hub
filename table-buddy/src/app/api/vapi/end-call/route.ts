import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const response = await fetch('https://api.vapi.ai/call/end', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to end Vapi call');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending Vapi call:', error);
    return NextResponse.json({ error: 'Failed to end call' }, { status: 500 });
  }
} 