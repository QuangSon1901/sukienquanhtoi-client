import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const boundsStr = searchParams.get('bounds');
    const search = searchParams.get('search')?.toLowerCase();
    const status = searchParams.get('status') || 'upcoming';

    // Đọc file JSON
    const filePath = path.join(process.cwd(), 'data', 'events.json');
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileData);
    let events = data.events;

    // Lọc theo status (upcoming/past/all)
    const currentDate = new Date();
    if (status !== 'all') {
      events = events.filter(event => {
        const startDate = new Date(event.startTime);
        if (status === 'upcoming') {
          return startDate >= currentDate;
        } else if (status === 'past') {
          return startDate < currentDate;
        }
        return true;
      });
    }

    // Lọc theo bounds
    if (boundsStr) {
      const bounds = JSON.parse(boundsStr);
      events = events.filter(event => {
        if (!event.latitude || !event.longitude) return false;
        
        return event.latitude >= bounds.south && 
               event.latitude <= bounds.north &&
               event.longitude >= bounds.west && 
               event.longitude <= bounds.east;
      });
    }

    // Lọc theo search
    if (search) {
      events = events.filter(event => {
        return event.title.toLowerCase().includes(search) ||
               event.address.toLowerCase().includes(search) ||
               event.description.toLowerCase().includes(search);
      });
    }

    return NextResponse.json({
      success: true,
      total: events.length,
      events: events
    });

  } catch (error) {
    console.error('Error loading events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load events' },
      { status: 500 }
    );
  }
}