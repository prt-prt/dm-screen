import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ audioId: string }> }
) {
  try {
    const { audioId } = await params;
    const row = db
      .prepare(
        `SELECT id, name, filename, duration, created_at
         FROM audio_files WHERE id = ?`
      )
      .get(audioId) as Record<string, unknown> | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Audio file not found' }, { status: 404 });
    }

    const audioFile = {
      id: row.id,
      name: row.name,
      filename: row.filename,
      duration: row.duration,
      createdAt: row.created_at,
    };

    return NextResponse.json({ audioFile });
  } catch (error) {
    console.error('Failed to get audio file:', error);
    return NextResponse.json({ error: 'Failed to get audio file' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ audioId: string }> }
) {
  try {
    const { audioId } = await params;

    // Get filename before deleting
    const row = db
      .prepare(`SELECT filename FROM audio_files WHERE id = ?`)
      .get(audioId) as { filename: string } | undefined;

    if (row) {
      // Delete file from disk
      try {
        await unlink(path.join(AUDIO_DIR, row.filename));
      } catch {
        // File might not exist, continue anyway
      }
    }

    db.prepare('DELETE FROM audio_files WHERE id = ?').run(audioId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete audio file:', error);
    return NextResponse.json({ error: 'Failed to delete audio file' }, { status: 500 });
  }
}
