import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

export async function GET() {
  try {
    const rows = db
      .prepare(
        `SELECT id, name, filename, duration, created_at
         FROM audio_files ORDER BY name`
      )
      .all() as Record<string, unknown>[];

    const audioFiles = rows.map((row) => ({
      id: row.id,
      name: row.name,
      filename: row.filename,
      duration: row.duration,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ audioFiles });
  } catch (error) {
    console.error('Failed to get audio files:', error);
    return NextResponse.json({ error: 'Failed to get audio files' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Ensure audio directory exists
    await mkdir(AUDIO_DIR, { recursive: true });

    // Generate unique filename
    const id = crypto.randomUUID();
    const ext = path.extname(file.name);
    const filename = `${id}${ext}`;
    const filepath = path.join(AUDIO_DIR, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Get original name without extension
    const name = path.basename(file.name, ext);

    // Save to database
    db.prepare(
      `INSERT INTO audio_files (id, name, filename) VALUES (?, ?, ?)`
    ).run(id, name, filename);

    const audioFile = {
      id,
      name,
      filename,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ audioFile });
  } catch (error) {
    console.error('Failed to upload audio file:', error);
    return NextResponse.json({ error: 'Failed to upload audio file' }, { status: 500 });
  }
}
