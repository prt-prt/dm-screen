import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const row = db
      .prepare(
        `SELECT id, name, viewport_x, viewport_y, viewport_zoom, created_at, updated_at
         FROM scenes WHERE id = ?`
      )
      .get(sceneId) as Record<string, unknown> | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    const scene = {
      id: row.id,
      name: row.name,
      viewport: {
        x: row.viewport_x,
        y: row.viewport_y,
        zoom: row.viewport_zoom,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json({ scene });
  } catch (error) {
    console.error('Failed to get scene:', error);
    return NextResponse.json({ error: 'Failed to get scene' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const body = await request.json();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.viewport) {
      if (body.viewport.x !== undefined) {
        updates.push('viewport_x = ?');
        values.push(body.viewport.x);
      }
      if (body.viewport.y !== undefined) {
        updates.push('viewport_y = ?');
        values.push(body.viewport.y);
      }
      if (body.viewport.zoom !== undefined) {
        updates.push('viewport_zoom = ?');
        values.push(body.viewport.zoom);
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(sceneId);
      db.prepare(`UPDATE scenes SET ${updates.join(', ')} WHERE id = ?`).run(
        ...values
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update scene:', error);
    return NextResponse.json({ error: 'Failed to update scene' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    db.prepare('DELETE FROM scenes WHERE id = ?').run(sceneId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete scene:', error);
    return NextResponse.json({ error: 'Failed to delete scene' }, { status: 500 });
  }
}
