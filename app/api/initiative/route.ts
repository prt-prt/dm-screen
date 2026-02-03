import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { safeJsonParse } from '@/lib/utils';

export async function GET() {
  try {
    const rows = db
      .prepare(
        `SELECT id, name, combatants, current_turn, round, created_at, updated_at
         FROM initiative_trackers ORDER BY updated_at DESC`
      )
      .all() as Record<string, unknown>[];

    const trackers = rows.map((row) => ({
      id: row.id,
      name: row.name,
      combatants: safeJsonParse(row.combatants as string, []),
      currentTurn: row.current_turn,
      round: row.round,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ trackers });
  } catch (error) {
    console.error('Failed to get initiative trackers:', error);
    return NextResponse.json({ error: 'Failed to get initiative trackers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, combatants, currentTurn, round } = body;

    db.prepare(
      `INSERT INTO initiative_trackers (id, name, combatants, current_turn, round)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, name, JSON.stringify(combatants || []), currentTurn || 0, round || 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create initiative tracker:', error);
    return NextResponse.json({ error: 'Failed to create initiative tracker' }, { status: 500 });
  }
}
