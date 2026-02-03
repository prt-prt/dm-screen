import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { safeJsonParse } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackerId: string }> }
) {
  try {
    const { trackerId } = await params;
    const row = db
      .prepare(
        `SELECT id, name, combatants, current_turn, round, created_at, updated_at
         FROM initiative_trackers WHERE id = ?`
      )
      .get(trackerId) as Record<string, unknown> | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Tracker not found' }, { status: 404 });
    }

    const tracker = {
      id: row.id,
      name: row.name,
      combatants: safeJsonParse(row.combatants as string, []),
      currentTurn: row.current_turn,
      round: row.round,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json({ tracker });
  } catch (error) {
    console.error('Failed to get initiative tracker:', error);
    return NextResponse.json({ error: 'Failed to get initiative tracker' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ trackerId: string }> }
) {
  try {
    const { trackerId } = await params;
    const body = await request.json();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.combatants !== undefined) {
      updates.push('combatants = ?');
      values.push(JSON.stringify(body.combatants));
    }
    if (body.currentTurn !== undefined) {
      updates.push('current_turn = ?');
      values.push(body.currentTurn);
    }
    if (body.round !== undefined) {
      updates.push('round = ?');
      values.push(body.round);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(trackerId);
      db.prepare(
        `UPDATE initiative_trackers SET ${updates.join(', ')} WHERE id = ?`
      ).run(...values);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update initiative tracker:', error);
    return NextResponse.json({ error: 'Failed to update initiative tracker' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ trackerId: string }> }
) {
  try {
    const { trackerId } = await params;
    db.prepare('DELETE FROM initiative_trackers WHERE id = ?').run(trackerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete initiative tracker:', error);
    return NextResponse.json({ error: 'Failed to delete initiative tracker' }, { status: 500 });
  }
}
