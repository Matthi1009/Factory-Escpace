// Monster-Typen (Mutationen). M1: ein Typ. Weitere Mutationen (Hitze, Strahlung, Kälte) folgen in M2.

export interface MonsterType {
  id: string;
  name: string;
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
  maxHp: 30,
  speed: 1.2,
  damage: 8,
  attackTicks: 60,
  size: 0.55,
  body: '#4a2a5e',
  spots: '#9dff3a',
};

export const MONSTER_TYPES: readonly MonsterType[] = [MUTANT_BEETLE];
