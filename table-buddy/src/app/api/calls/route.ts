import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    const callLogs = await db.all(`
      SELECT 
        cl.id,
        cl.call_id,
        cl.customer_phone,
        cl.call_date,
        cl.call_time,
        cl.call_duration,
        cl.reservation_date,
        cl.reservation_time,
        r.customer_name,
        r.party_size,
        r.status as reservation_status
      FROM call_logs cl
      LEFT JOIN reservations r ON cl.reservation_id = r.id
      ORDER BY cl.call_date DESC, cl.call_time DESC
    `);

    // Format the data for the frontend
    const formattedLogs = callLogs.map(log => ({
      id: log.id,
      callId: log.call_id,
      phoneNumber: formatPhoneNumber(log.customer_phone),
      date: new Date(log.call_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: formatTime(log.call_time),
      duration: formatDuration(log.call_duration),
      reservation: log.reservation_date ? {
        datetime: `${log.reservation_date} at ${formatTime(log.reservation_time)}`,
        customerName: log.customer_name,
        partySize: log.party_size,
        status: log.reservation_status
      } : null
    }));

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call logs' },
      { status: 500 }
    );
  }
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  // Return original if format doesn't match
  return phone;
}

function formatTime(time: string): string {
  // Split the time into hours and minutes
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a date object with the time
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  
  // Format as hh:mm a
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
} 