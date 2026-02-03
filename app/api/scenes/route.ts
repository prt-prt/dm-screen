import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const rows = db
      .prepare(
        `SELECT id, name, viewport_x, viewport_y, viewport_zoom, created_at, updated_at
         FROM scenes ORDER BY created_at`
      )
      .all() as Record<string, unknown>[];

    const scenes = rows.map((row) => ({
      id: row.id,
      name: row.name,
      viewport: {
        x: row.viewport_x,
        y: row.viewport_y,
        zoom: row.viewport_zoom,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ scenes });
  } catch (error) {
    console.error('Failed to get scenes:', error);
    return NextResponse.json({ error: 'Failed to get scenes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, viewport } = body;

    db.prepare(
      `INSERT INTO scenes (id, name, viewport_x, viewport_y, viewport_zoom)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, name, viewport?.x ?? 0, viewport?.y ?? 0, viewport?.zoom ?? 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create scene:', error);
    return NextResponse.json({ error: 'Failed to create scene' }, { status: 500 });
  }
}
