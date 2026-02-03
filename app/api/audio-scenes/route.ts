import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const scenes = db
      .prepare(
        `SELECT id, name, created_at, updated_at FROM audio_scenes ORDER BY name`
      )
      .all() as Record<string, unknown>[];

    // Get channels for each scene
    const audioScenes = scenes.map((scene) => {
      const channels = db
        .prepare(
          `SELECT asc.id, asc.audio_file_id, asc.volume, asc.loop,
                  af.id as af_id, af.name as af_name, af.filename as af_filename
           FROM audio_scene_channels asc
           JOIN audio_files af ON af.id = asc.audio_file_id
           WHERE asc.scene_id = ?`
        )
        .all(scene.id) as Record<string, unknown>[];

      return {
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
    });

    return NextResponse.json({ audioScenes });
  } catch (error) {
    console.error('Failed to get audio scenes:', error);
    return NextResponse.json({ error: 'Failed to get audio scenes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name } = body;

    db.prepare(`INSERT INTO audio_scenes (id, name) VALUES (?, ?)`).run(id, name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create audio scene:', error);
    return NextResponse.json({ error: 'Failed to create audio scene' }, { status: 500 });
  }
}
