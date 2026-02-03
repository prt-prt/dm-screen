import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { safeJsonParse } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const rows = db
      .prepare(
        `SELECT id, scene_id, type, position_x, position_y, width, height, reference_id, config
         FROM canvas_nodes WHERE scene_id = ?`
      )
      .all(sceneId) as Record<string, unknown>[];

    const nodes = rows.map((row) => ({
      id: row.id,
      type: row.type,
      position: { x: row.position_x, y: row.position_y },
      style: { width: row.width, height: row.height },
      data: {
        referenceId: row.reference_id,
        config: safeJsonParse(row.config as string, {}),
        label: (row.type as string).charAt(0).toUpperCase() + (row.type as string).slice(1),
      },
    }));

    return NextResponse.json({ nodes });
  } catch (error) {
    console.error('Failed to get nodes:', error);
    return NextResponse.json({ error: 'Failed to get nodes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const body = await request.json();
    const { id, type, position, width, height, data } = body;

    db.prepare(
      `INSERT INTO canvas_nodes (id, scene_id, type, position_x, position_y, width, height, reference_id, config)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      sceneId,
      type,
      position.x,
      position.y,
      width,
      height,
      data?.referenceId || null,
      JSON.stringify(data?.config || {})
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create node:', error);
    return NextResponse.json({ error: 'Failed to create node' }, { status: 500 });
  }
}
