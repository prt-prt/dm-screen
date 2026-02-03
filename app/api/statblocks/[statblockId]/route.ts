import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ statblockId: string }> }
) {
  try {
    const { statblockId } = await params;
    const row = db
      .prepare(`SELECT * FROM statblocks WHERE id = ?`)
      .get(statblockId) as Record<string, unknown> | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Statblock not found' }, { status: 404 });
    }

    const statblock = {
      id: row.id,
      name: row.name,
      size: row.size,
      type: row.type,
      alignment: row.alignment,
      armorClass: row.armor_class,
      hitPoints: row.hit_points,
      hitDice: row.hit_dice,
      speed: row.speed,
      str: row.str,
      dex: row.dex,
      con: row.con,
      int: row.int,
      wis: row.wis,
      cha: row.cha,
      savingThrows: row.saving_throws,
      skills: row.skills,
      damageResistances: row.damage_resistances,
      damageImmunities: row.damage_immunities,
      conditionImmunities: row.condition_immunities,
      senses: row.senses,
      languages: row.languages,
      challenge: row.challenge,
      traits: row.traits,
      actions: row.actions,
      reactions: row.reactions,
      legendaryActions: row.legendary_actions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json({ statblock });
  } catch (error) {
    console.error('Failed to get statblock:', error);
    return NextResponse.json({ error: 'Failed to get statblock' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ statblockId: string }> }
) {
  try {
    const { statblockId } = await params;
    const body = await request.json();

    const fieldMap: Record<string, string> = {
      name: 'name',
      size: 'size',
      type: 'type',
      alignment: 'alignment',
      armorClass: 'armor_class',
      hitPoints: 'hit_points',
      hitDice: 'hit_dice',
      speed: 'speed',
      str: 'str',
      dex: 'dex',
      con: 'con',
      int: 'int',
      wis: 'wis',
      cha: 'cha',
      savingThrows: 'saving_throws',
      skills: 'skills',
      damageResistances: 'damage_resistances',
      damageImmunities: 'damage_immunities',
      conditionImmunities: 'condition_immunities',
      senses: 'senses',
      languages: 'languages',
      challenge: 'challenge',
      traits: 'traits',
      actions: 'actions',
      reactions: 'reactions',
      legendaryActions: 'legendary_actions',
    };

    const updates: string[] = [];
    const values: unknown[] = [];

    for (const [key, column] of Object.entries(fieldMap)) {
      if (body[key] !== undefined) {
        updates.push(`${column} = ?`);
        values.push(body[key]);
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(statblockId);
      db.prepare(`UPDATE statblocks SET ${updates.join(', ')} WHERE id = ?`).run(
        ...values
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update statblock:', error);
    return NextResponse.json({ error: 'Failed to update statblock' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ statblockId: string }> }
) {
  try {
    const { statblockId } = await params;
    db.prepare('DELETE FROM statblocks WHERE id = ?').run(statblockId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete statblock:', error);
    return NextResponse.json({ error: 'Failed to delete statblock' }, { status: 500 });
  }
}
