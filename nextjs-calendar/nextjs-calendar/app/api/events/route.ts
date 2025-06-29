import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = 'SELECT * FROM events';
    const params: any[] = [];

    if (startDate && endDate) {
      query += ' WHERE date >= $1 AND date <= $2';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY date, time';

    const result = await pool.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, date, time, duration, description, color } = body;

    const query = `
      INSERT INTO events (title, date, time, duration, description, color)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [title, date, time, duration, description, color];
    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}