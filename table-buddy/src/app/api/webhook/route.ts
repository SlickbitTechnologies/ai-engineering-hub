import { NextResponse } from 'next/server';
import { getTablesByCapacity,getReservationsByDateAndTime, getOperatingHoursByDay, getTurnaroundTime, createReservationInWebhook, createCallLog, getNextDayOperatingHours } from '@/lib/webhookQueries';
interface VariableValues {
  date:string;
  time:string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Body:",body);
    const {message} = body;
    // Handle different webhook events
    console.log("Message:",message.type);
    const {type,toolCalls,call,timestamp} = message;
    console.log("Call:",JSON.stringify(call));
    const {assistantOverrides,id} = call;
    const {variableValues} = assistantOverrides;
    switch (type) {
      case 'tool-calls':
       
        const toolCall = toolCalls[0];
        // Get database connection
        let toolCallResponses = [];
       for(let toolCall of toolCalls){
        const response = await handleToolCall(toolCall,id,variableValues);
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
const handleToolCall = async (toolCall: any,callId:string,variableValues:VariableValues) => {
  try {
    console.log("Tool call:",toolCall);
  const {id,function:toolFunction } = toolCall;
  // Handle different tool functions
  const {name,arguments:toolArguments} = toolFunction;
  console.log("Tool arguments:",toolArguments,name);
  switch (name) {
    
    case 'checkAvailability':
      const checkAvailabilityResult = await checkAvailability(toolArguments);
      return checkAvailabilityResult;

    case 'createReservation':
      const createReservationResult = await createReservation(toolArguments,callId,variableValues);
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
  console.log("Check availability args:", args);
  const { date, time, no_of_people } = args;

  // Check if date and time are in the past
  const requestedDateTime = new Date(`${date}T${time}`);
  const currentDateTime = new Date();
  const tables = await getTablesByCapacity(no_of_people);

  if (tables.length === 0) {
    console.log("No tables available. Returning error message.");
    return `No tables available that can accommodate ${no_of_people} people.`;
  }
  if (requestedDateTime < currentDateTime) {
    return "Sorry, you cannot make a reservation for a past date and time.";
  }

  // Get the day of the week from the date
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  // Get operating hours for the day
  const operatingHours = await getOperatingHoursByDay(dayOfWeek);

  if (!operatingHours) {
    return `Sorry, we are closed on ${dayOfWeek}`;
  }

  // Get turnaround time from settings
  const settings = await getTurnaroundTime();
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
  
  
  // Get reservations for the given date and time, including those that might still be using the table
  const reservations = await getReservationsByDateAndTime(date,time,turnaroundTime);

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

const createReservation = async (args: any, callId: string, variableValues: VariableValues) => {
  console.log("Create reservation args:", args);
  const { name, phone, date, time, no_of_people, occasion, special_requests } = args;

  // Validate required fields
  if (!name || !phone || !date || !time || !no_of_people) {
    console.log("Missing required fields. Please provide name, phone, date, time, and no_of_people.");
    return "Missing required fields. Please provide name, phone, date, time, and no_of_people.";
  }

  // Check if date and time are in the past
  const requestedDateTime = new Date(`${date}T${time}`);
  const currentDateTime = new Date();
  
  if (requestedDateTime < currentDateTime) {
    console.log("Requested date and time are in the past. Returning error message.");
    return "Sorry, you cannot make a reservation for a past date and time.";
  }

  // Get the day of the week from the date
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  // Get operating hours for the day
  const operatingHours = await getOperatingHoursByDay(dayOfWeek);

  if (!operatingHours) {
    console.log("No operating hours found for the day. Returning error message.");
    return `Sorry, we are closed on ${dayOfWeek}`;
  }

  // Get turnaround time from settings
  const settings = await getTurnaroundTime();
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
    console.log("Time is not within operating hours. Returning error message.");
    return `Sorry, we are not open at ${time}. Our hours are: Lunch ${operatingHours.lunch_opening_time} - ${operatingHours.lunch_closing_time}, Dinner ${operatingHours.dinner_opening_time} - ${operatingHours.dinner_closing_time}`;
  }

  // Find available tables with sufficient capacity
  const tables = await getTablesByCapacity(no_of_people);

  if (tables.length === 0) {
    console.log("No tables available. Returning error message.");
    return `No tables available that can accommodate ${no_of_people} people.`;
  }

  // Get existing reservations for the time slot
  const existingReservations = await getReservationsByDateAndTime(date,time,turnaroundTime);

  // Find first available table
  const availableTable = tables.find(table => {
    const isReserved = existingReservations.some(res => res.table_id === table.id);
    return !isReserved;
  });

  if (!availableTable) {
    console.log("No tables available at the requested time. Returning error message.");
    return "No tables available at the requested time. Please try a different time.";
  }

  try {
    // Create the reservation
    const result = await createReservationInWebhook({name,phone,date,time,no_of_people,table_id:availableTable.id,occasion,special_requests});
    console.log("Reservation created successfully. Returning result.");
    const reservationId = result.id;

    // Store call logs
    const callDate = variableValues.date;
    const callTime = variableValues.time;
    const callDuration = Math.floor((new Date().getTime() - new Date(`${callDate}T${callTime}`).getTime()) / 1000); // Duration in seconds

    await createCallLog({
      call_id: callId,
      reservation_id: reservationId,
      customer_phone: phone,
      call_date: callDate,
      call_time: callTime,
      call_duration: callDuration,
      reservation_date: date,
      reservation_time: time
    });

    return `Reservation created successfully for ${name} at ${time} on ${date} for ${no_of_people} people at Table ${availableTable.id}.`;
  } catch (error) {
    console.error('Error creating reservation:', error);
    return "Failed to create reservation. Please try again.";
  }
}

const checkNextAvailableSlot = async (args: any) => {
  console.log("Check next available slot args:", args);
  const { date, time, no_of_people } = args;

  // Get operating hours for the day
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const operatingHours = await getOperatingHoursByDay(dayOfWeek);

  if (!operatingHours) {
    console.log("No operating hours found for the day. Returning error message.");
    return `Sorry, we are closed on ${dayOfWeek}`;
  }

  // Get turnaround time from settings
  const settings = await getTurnaroundTime();
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
  const tables = await getTablesByCapacity(no_of_people);
  if (tables.length === 0) {
    console.log("No tables available. Returning error message.");
    return `No tables available that can accommodate ${no_of_people} people.`;
  }
  // Function to check availability at a specific time
  const checkTimeSlot = async (checkTime: string) => {
    const reservations = await getReservationsByDateAndTime(date,checkTime,turnaroundTime);

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
      console.log("Next available slot is at",checkTime);
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
  
  const nextDayOperatingHours = await getNextDayOperatingHours(nextDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() );
  if (nextDayOperatingHours) {
    console.log("Next available slot is at",nextDayOperatingHours.lunch_opening_time);
    return `No slots available today. Next available slot is at ${nextDayOperatingHours.lunch_opening_time} on ${nextDay}`;
  }

  return "No available slots found in the next few days. Please try a different date.";
}