// Monster-Typen (Mutationen). Welche Art spawnt, hängt von der Umwelt an der Spawn-Kachel ab.

export type MonsterKind = 'beetle' | 'ant' | 'slug' | 'spider';

export interface MonsterType {
  id: string;
  name: string;
  /** Kurzbeschreibung für die Meldung beim ersten Auftauchen */
  description: string;
  kind: MonsterKind;
  maxHp: number;
  /** Kacheln pro Sekunde */
  speed: number;
  /** Schaden pro Biss */
  damage: number;
  /** Ticks zwischen zwei Bissen */
  attackTicks: number;
  /** Körpergröße in Kacheln (Durchmesser) */
  size: number;
  body: string;
  spots: string;
}

export const MUTANT_BEETLE: MonsterType = {
  id: 'environment:mutant_beetle',
  name: 'Mutierter Käfer',
  description: 'der Klassiker aus dem Smog',
  kind: 'beetle',
  maxHp: 30,
  speed: 1.2,
  damage: 8,
  attackTicks: 60,
  size: 0.55,
  body: '#4a2a5e',
  spots: '#9dff3a',
};

export const FIRE_ANT: MonsterType = {
  id: 'environment:fire_ant',
  name: 'Hitzeameise',
  description: 'schnell, aber schwach – entsteht, wo es zu heiß ist',
  kind: 'ant',
  maxHp: 18,
  speed: 2.2,
  damage: 5,
  attackTicks: 40,
  size: 0.45,
  body: '#b5361c',
  spots: '#ffb02e',
};

export const GLOW_SLUG: MonsterType = {
  id: 'environment:glow_slug',
  name: 'Strahlenschnecke',
  description: 'langsam, zäh und bissig – entsteht in verstrahlten Gebieten',
  kind: 'slug',
  maxHp: 120,
  speed: 0.55,
  damage: 18,
  attackTicks: 75,
  size: 0.7,
  body: '#3c6b2a',
  spots: '#b6ff3d',
};

export const FROST_SPIDER: MonsterType = {
  id: 'environment:frost_spider',
  name: 'Frostspinne',
  description: 'flink und ausdauernd – entsteht im Smog-Winter',
  kind: 'spider',
  maxHp: 45,
  speed: 1.6,
  damage: 10,
  attackTicks: 50,
  size: 0.6,
  body: '#5d8fb5',
  spots: '#e8f6ff',
};

export const MONSTER_TYPES: readonly MonsterType[] = [MUTANT_BEETLE, FIRE_ANT, GLOW_SLUG, FROST_SPIDER];

/** Mutation nach Umwelt an der Spawn-Kachel: Strahlung vor Hitze vor Kälte. */
export function chooseMonsterType(temperature: number, radiation: number): MonsterType {
  if (radiation > 1) return GLOW_SLUG;
  if (temperature > 30) return FIRE_ANT;
  if (temperature < 8) return FROST_SPIDER;
  return MUTANT_BEETLE;
}
