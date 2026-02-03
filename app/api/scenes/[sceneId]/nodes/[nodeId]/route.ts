import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string; nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const body = await request.json();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.position) {
      updates.push('position_x = ?', 'position_y = ?');
      values.push(body.position.x, body.position.y);
    }
    if (body.width !== undefined) {
      updates.push('width = ?');
      values.push(body.width);
    }
    if (body.height !== undefined) {
      updates.push('height = ?');
      values.push(body.height);
    }
    if (body.referenceId !== undefined) {
      updates.push('reference_id = ?');
      values.push(body.referenceId);
    }
    if (body.config !== undefined) {
      updates.push('config = ?');
      values.push(JSON.stringify(body.config));
    }

    if (updates.length > 0) {
      values.push(nodeId);
      db.prepare(`UPDATE canvas_nodes SET ${updates.join(', ')} WHERE id = ?`).run(
        ...values
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update node:', error);
    return NextResponse.json({ error: 'Failed to update node' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string; nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    db.prepare('DELETE FROM canvas_nodes WHERE id = ?').run(nodeId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete node:', error);
    return NextResponse.json({ error: 'Failed to delete node' }, { status: 500 });
  }
}
