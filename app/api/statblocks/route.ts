import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const rows = db
      .prepare(`SELECT * FROM statblocks ORDER BY name`)
      .all() as Record<string, unknown>[];

    const statblocks = rows.map((row) => ({
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
    }));

    return NextResponse.json({ statblocks });
  } catch (error) {
    console.error('Failed to get statblocks:', error);
    return NextResponse.json({ error: 'Failed to get statblocks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    db.prepare(
      `INSERT INTO statblocks (
        id, name, size, type, alignment, armor_class, hit_points, hit_dice, speed,
        str, dex, con, int, wis, cha, saving_throws, skills, damage_resistances,
        damage_immunities, condition_immunities, senses, languages, challenge,
        traits, actions, reactions, legendary_actions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      body.id,
      body.name,
      body.size,
      body.type,
      body.alignment,
      body.armorClass,
      body.hitPoints,
      body.hitDice,
      body.speed,
      body.str,
      body.dex,
      body.con,
      body.int,
      body.wis,
      body.cha,
      body.savingThrows || null,
      body.skills || null,
      body.damageResistances || null,
      body.damageImmunities || null,
      body.conditionImmunities || null,
      body.senses,
      body.languages,
      body.challenge,
      body.traits || null,
      body.actions || null,
      body.reactions || null,
      body.legendaryActions || null
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create statblock:', error);
    return NextResponse.json({ error: 'Failed to create statblock' }, { status: 500 });
  }
}
