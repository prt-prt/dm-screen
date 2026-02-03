import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const rows = db
      .prepare(
        `SELECT id, title, content, created_at, updated_at
         FROM notes ORDER BY updated_at DESC`
      )
      .all() as Record<string, unknown>[];

    const notes = rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Failed to get notes:', error);
    return NextResponse.json({ error: 'Failed to get notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content } = body;

    db.prepare(
      `INSERT INTO notes (id, title, content) VALUES (?, ?, ?)`
    ).run(id, title, content || '');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
