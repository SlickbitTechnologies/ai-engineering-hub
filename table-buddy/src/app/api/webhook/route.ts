import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {message} = body;
    // Handle different webhook events
    console.log("Message:",message.type);
    switch (message.type) {
      case 'tool-calls':
        // Handle tool calls from Vapi
        const toolCalls = message.toolCalls;
        const toolCall = toolCalls[0];
        // Get database connection
        let toolCallResponses = [];
       for(let toolCall of toolCalls){
        const response = await handleToolCall(toolCall);
        toolCallResponses.push({result:response,toolCallId:toolCall.id});
       }
       console.log("Tool call responses:",toolCallResponses);
       return NextResponse.json({results:toolCallResponses});

      default:
          return NextResponse.json({ response: 'Unknown webhook type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ result: 'Internal server error' }, { status: 500 });
  }
}
const handleToolCall = async (toolCall: any) => {
  try {
    console.log("Tool call:",toolCall);
  const db = await getDb();
  const {id,function:toolFunction } = toolCall;
  // Handle different tool functions
  const {name,arguments:toolArguments} = toolFunction;
  console.log("Tool arguments:",toolArguments,name);
  switch (name) {
    
    case 'checkAvailability':
      const checkAvailabilityResult = await checkAvailability(toolArguments);
      return checkAvailabilityResult;

    case 'createReservation':
      const createReservationResult = await createReservation(toolArguments);
      return createReservationResult;

    case 'checkNextAvailableSlot':
      const checkNextAvailableSlotResult = await checkNextAvailableSlot(toolArguments);
      return checkNextAvailableSlotResult;
    default:
      return 'Unknown tool call' ;
  }
}catch(error){
  console.error('Tool call error:', error);
  return 'Internal server error' ;
}
}

const checkAvailability = async (args: any) => {
  const db = await getDb();
  console.log("Check availability args:", args);
  const { date, time, no_of_people } = args;

  // Check if date and time are in the past
  const requestedDateTime = new Date(`${date}T${time}`);
  const currentDateTime = new Date();
  
  if (requestedDateTime < currentDateTime) {
    return "Sorry, you cannot make a reservation for a past date and time.";
  }

  // Get the day of the week from the date
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  // Get operating hours for the day
  const operatingHours = await db.get(
    'SELECT * FROM operating_hours WHERE day = :day',
    { ':day': dayOfWeek }
  );

  if (!operatingHours) {
    return `Sorry, we are closed on ${dayOfWeek}`;
  }

  // Get turnaround time from settings
  const settings = await db.get('SELECT turnaround_time FROM table_settings LIMIT 1');
  const turnaroundTime = settings?.turnaround_time || 15; // Default to 15 minutes if not set

  // Convert time to minutes for comparison
  const [hours, minutes] = time.split(':').map(Number);
  const requestedTimeInMinutes = hours * 60 + minutes;

  // Convert operating hours to minutes
  const [lunchOpenHours, lunchOpenMinutes] = operatingHours.lunch_opening_time.split(':').map(Number);
  const [lunchCloseHours, lunchCloseMinutes] = operatingHours.lunch_closing_time.split(':').map(Number);
  const [dinnerOpenHours, dinnerOpenMinutes] = operatingHours.dinner_opening_time.split(':').map(Number);
  const [dinnerCloseHours, dinnerCloseMinutes] = operatingHours.dinner_closing_time.split(':').map(Number);

  const lunchOpenInMinutes = lunchOpenHours * 60 + lunchOpenMinutes;
  const lunchCloseInMinutes = lunchCloseHours * 60 + lunchCloseMinutes;
  const dinnerOpenInMinutes = dinnerOpenHours * 60 + dinnerOpenMinutes;
  const dinnerCloseInMinutes = dinnerCloseHours * 60 + dinnerCloseMinutes;

  // Check if time is within operating hours
  const isWithinLunchHours = requestedTimeInMinutes >= lunchOpenInMinutes && requestedTimeInMinutes <= lunchCloseInMinutes;
  const isWithinDinnerHours = requestedTimeInMinutes >= dinnerOpenInMinutes && requestedTimeInMinutes <= dinnerCloseInMinutes;

  if (!isWithinLunchHours && !isWithinDinnerHours) {
    return `Sorry, we are not open at ${time}. Our hours are: Lunch ${operatingHours.lunch_opening_time} - ${operatingHours.lunch_closing_time}, Dinner ${operatingHours.dinner_opening_time} - ${operatingHours.dinner_closing_time}`;
  }

  // Get all available tables with sufficient capacity
  const tables = await db.all(
    'SELECT * FROM tables WHERE status = :status AND capacity >= :capacity', 
    { 
      ':status': 'available',
      ':capacity': no_of_people 
    }
  );
  
  // Get reservations for the given date and time, including those that might still be using the table
  const reservations = await db.all(`
    SELECT * FROM reservations 
    WHERE date = :date 
    AND status = :status
    AND (
      (time - :turnaroundTime < :time AND time + :turnaroundTime > :time)
    )
  `, { 
    ':date': date,
    ':status': 'confirmed',
    ':time': time,
    ':turnaroundTime': turnaroundTime
  });

  // Filter tables that are not reserved or will be available by the requested time
  const availableTables = tables.filter(table => {
    const tableReservations = reservations.filter(res => res.table_id === table.id);
    
    // If no reservations for this table, it's available
    if (tableReservations.length === 0) {
      return true;
    }

    // Check if the table will be available by the requested time
    return tableReservations.every(res => {
      const [resHours, resMinutes] = res.time.split(':').map(Number);
      const reservationEndTime = resHours * 60 + resMinutes + turnaroundTime;
      return reservationEndTime <= requestedTimeInMinutes;
    });
  });

  if (availableTables.length === 0) {
    return `No tables available at ${time}. Please try a different time.`;
  }

  return `Found ${availableTables.length} available tables that can accommodate ${no_of_people} people`;
}

const createReservation = async (args: any) => {
  const db = await getDb();
  console.log("Create reservation args:", args);
  const { name, phone, date, time, no_of_people, occasion, special_requests } = args;

  // Validate required fields
  if (!name || !phone || !date || !time || !no_of_people) {
    return "Missing required fields. Please provide name, phone, date, time, and no_of_people.";
  }

  // Check if date and time are in the past
  const requestedDateTime = new Date(`${date}T${time}`);
  const currentDateTime = new Date();
  
  if (requestedDateTime < currentDateTime) {
    return "Sorry, you cannot make a reservation for a past date and time.";
  }

  // Get the day of the week from the date
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  // Get operating hours for the day
  const operatingHours = await db.get(
    'SELECT * FROM operating_hours WHERE day = :day',
    { ':day': dayOfWeek }
  );

  if (!operatingHours) {
    return `Sorry, we are closed on ${dayOfWeek}`;
  }

  // Get turnaround time from settings
  const settings = await db.get('SELECT turnaround_time FROM table_settings LIMIT 1');
  const turnaroundTime = settings?.turnaround_time || 15;

  // Convert time to minutes for comparison
  const [hours, minutes] = time.split(':').map(Number);
  const requestedTimeInMinutes = hours * 60 + minutes;

  // Convert operating hours to minutes
  const [lunchOpenHours, lunchOpenMinutes] = operatingHours.lunch_opening_time.split(':').map(Number);
  const [lunchCloseHours, lunchCloseMinutes] = operatingHours.lunch_closing_time.split(':').map(Number);
  const [dinnerOpenHours, dinnerOpenMinutes] = operatingHours.dinner_opening_time.split(':').map(Number);
  const [dinnerCloseHours, dinnerCloseMinutes] = operatingHours.dinner_closing_time.split(':').map(Number);

  const lunchOpenInMinutes = lunchOpenHours * 60 + lunchOpenMinutes;
  const lunchCloseInMinutes = lunchCloseHours * 60 + lunchCloseMinutes;
  const dinnerOpenInMinutes = dinnerOpenHours * 60 + dinnerOpenMinutes;
  const dinnerCloseInMinutes = dinnerCloseHours * 60 + dinnerCloseMinutes;

  // Check if time is within operating hours
  const isWithinLunchHours = requestedTimeInMinutes >= lunchOpenInMinutes && requestedTimeInMinutes <= lunchCloseInMinutes;
  const isWithinDinnerHours = requestedTimeInMinutes >= dinnerOpenInMinutes && requestedTimeInMinutes <= dinnerCloseInMinutes;

  if (!isWithinLunchHours && !isWithinDinnerHours) {
    return `Sorry, we are not open at ${time}. Our hours are: Lunch ${operatingHours.lunch_opening_time} - ${operatingHours.lunch_closing_time}, Dinner ${operatingHours.dinner_opening_time} - ${operatingHours.dinner_closing_time}`;
  }

  // Find available tables with sufficient capacity
  const tables = await db.all(
    'SELECT * FROM tables WHERE status = :status AND capacity >= :capacity', 
    { 
      ':status': 'available',
      ':capacity': no_of_people 
    }
  );

  if (tables.length === 0) {
    return `No tables available that can accommodate ${no_of_people} people.`;
  }

  // Get existing reservations for the time slot
  const existingReservations = await db.all(`
    SELECT * FROM reservations 
    WHERE date = :date 
    AND status = :status
    AND (
      (time - :turnaroundTime < :time AND time + :turnaroundTime > :time)
    )
  `, { 
    ':date': date,
    ':status': 'confirmed',
    ':time': time,
    ':turnaroundTime': turnaroundTime
  });

  // Find first available table
  const availableTable = tables.find(table => {
    const isReserved = existingReservations.some(res => res.table_id === table.id);
    return !isReserved;
  });

  if (!availableTable) {
    return "No tables available at the requested time. Please try a different time.";
  }

  try {
    // Create the reservation
    await db.run(`
      INSERT INTO reservations (
        customer_name, 
        customer_phone, 
        date, 
        time, 
        party_size, 
        table_id, 
        status,
        occasion,
        special_requests,
        created_at,
        updated_at
      ) VALUES (
        :customer_name,
        :customer_phone,
        :date,
        :time,
        :party_size,
        :table_id,
        :status,
        :occasion,
        :special_requests,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `, {
      ':customer_name': name,
      ':customer_phone': phone,
      ':date': date,
      ':time': time,
      ':party_size': no_of_people,
      ':table_id': availableTable.id,
      ':status': 'confirmed',
      ':occasion': occasion || null,
      ':special_requests': special_requests || null
    });

    return `Reservation created successfully for ${name} at ${time} on ${date} for ${no_of_people} people at Table ${availableTable.id}.`;
  } catch (error) {
    console.error('Error creating reservation:', error);
    return "Failed to create reservation. Please try again.";
  }
}

const checkNextAvailableSlot = async (args: any) => {
  const db = await getDb();
  console.log("Check next available slot args:", args);
  const { date, time, no_of_people } = args;

  // Get operating hours for the day
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const operatingHours = await db.get(
    'SELECT * FROM operating_hours WHERE day = :day',
    { ':day': dayOfWeek }
  );

  if (!operatingHours) {
    return `Sorry, we are closed on ${dayOfWeek}`;
  }

  // Get turnaround time from settings
  const settings = await db.get('SELECT turnaround_time FROM table_settings LIMIT 1');
  const turnaroundTime = settings?.turnaround_time || 15;

  // Convert time to minutes for comparison
  const [hours, minutes] = time.split(':').map(Number);
  let currentTimeInMinutes = hours * 60 + minutes;

  // Convert operating hours to minutes
  const [lunchOpenHours, lunchOpenMinutes] = operatingHours.lunch_opening_time.split(':').map(Number);
  const [lunchCloseHours, lunchCloseMinutes] = operatingHours.lunch_closing_time.split(':').map(Number);
  const [dinnerOpenHours, dinnerOpenMinutes] = operatingHours.dinner_opening_time.split(':').map(Number);
  const [dinnerCloseHours, dinnerCloseMinutes] = operatingHours.dinner_closing_time.split(':').map(Number);

  const lunchOpenInMinutes = lunchOpenHours * 60 + lunchOpenMinutes;
  const lunchCloseInMinutes = lunchCloseHours * 60 + lunchCloseMinutes;
  const dinnerOpenInMinutes = dinnerOpenHours * 60 + dinnerOpenMinutes;
  const dinnerCloseInMinutes = dinnerCloseHours * 60 + dinnerCloseMinutes;

  // Get all tables with sufficient capacity
  const tables = await db.all(
    'SELECT * FROM tables WHERE status = :status AND capacity >= :capacity', 
    { 
      ':status': 'available',
      ':capacity': no_of_people 
    }
  );

  // Function to check availability at a specific time
  const checkTimeSlot = async (checkTime: string) => {
    const reservations = await db.all(`
      SELECT * FROM reservations 
      WHERE date = :date 
      AND status = :status
      AND (
        (time - :turnaroundTime < :time AND time + :turnaroundTime > :time)
      )
    `, { 
      ':date': date,
      ':status': 'confirmed',
      ':time': checkTime,
      ':turnaroundTime': turnaroundTime
    });

    const availableTables = tables.filter(table => {
      const tableReservations = reservations.filter(res => res.table_id === table.id);
      return tableReservations.length === 0;
    });

    return availableTables.length > 0;
  };

  // Function to format minutes to time string
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Check time slots in 15-minute intervals until we find an available one
  while (currentTimeInMinutes <= dinnerCloseInMinutes) {
    // Skip to dinner if we're past lunch hours
    if (currentTimeInMinutes > lunchCloseInMinutes && currentTimeInMinutes < dinnerOpenInMinutes) {
      currentTimeInMinutes = dinnerOpenInMinutes;
    }

    const checkTime = formatTime(currentTimeInMinutes);
    const isAvailable = await checkTimeSlot(checkTime);

    if (isAvailable) {
      return `Next available slot is at ${checkTime}`;
    }

    // Move to next 15-minute slot
    currentTimeInMinutes += 15;
  }

  // If no slots found for the day, suggest next day
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDay = nextDate.toISOString().split('T')[0];
  
  // Check first available time on next day
  const nextDayOperatingHours = await db.get(
    'SELECT * FROM operating_hours WHERE day = :day',
    { ':day': nextDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() }
  );

  if (nextDayOperatingHours) {
    return `No slots available today. Next available slot is at ${nextDayOperatingHours.lunch_opening_time} on ${nextDay}`;
  }

  return "No available slots found in the next few days. Please try a different date.";
}