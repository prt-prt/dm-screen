import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const scene = db
      .prepare(`SELECT id, name, created_at, updated_at FROM audio_scenes WHERE id = ?`)
      .get(sceneId) as Record<string, unknown> | undefined;

    if (!scene) {
      return NextResponse.json({ error: 'Audio scene not found' }, { status: 404 });
    }

    const channels = db
      .prepare(
        `SELECT asc.id, asc.audio_file_id, asc.volume, asc.loop,
                af.id as af_id, af.name as af_name, af.filename as af_filename
         FROM audio_scene_channels asc
         JOIN audio_files af ON af.id = asc.audio_file_id
         WHERE asc.scene_id = ?`
      )
      .all(sceneId) as Record<string, unknown>[];

    const audioScene = {
      id: scene.id,
      name: scene.name,
      channels: channels.map((ch) => ({
        id: ch.id,
        audioFileId: ch.audio_file_id,
        audioFile: {
          id: ch.af_id,
          name: ch.af_name,
          filename: ch.af_filename,
        },
        volume: ch.volume,
        loop: ch.loop === 1,
      })),
      createdAt: scene.created_at,
      updatedAt: scene.updated_at,
    };

    return NextResponse.json({ audioScene });
  } catch (error) {
    console.error('Failed to get audio scene:', error);
    return NextResponse.json({ error: 'Failed to get audio scene' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const body = await request.json();

    if (body.name !== undefined) {
      db.prepare(
        `UPDATE audio_scenes SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(body.name, sceneId);
    }

    if (body.channels !== undefined) {
      // Delete existing channels
      db.prepare(`DELETE FROM audio_scene_channels WHERE scene_id = ?`).run(sceneId);

      // Insert new channels
      const insertChannel = db.prepare(
        `INSERT INTO audio_scene_channels (id, scene_id, audio_file_id, volume, loop)
         VALUES (?, ?, ?, ?, ?)`
      );

      for (const channel of body.channels) {
        insertChannel.run(
          channel.id,
          sceneId,
          channel.audioFileId,
          channel.volume,
          channel.loop ? 1 : 0
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update audio scene:', error);
    return NextResponse.json({ error: 'Failed to update audio scene' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    db.prepare('DELETE FROM audio_scenes WHERE id = ?').run(sceneId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete audio scene:', error);
    return NextResponse.json({ error: 'Failed to delete audio scene' }, { status: 500 });
  }
}
