// Gemeinsame Datentypen für Registries (Items, Rezepte, Forschung, Aktionen).
import type { Game } from './Game';

/** Item-ID, z. B. 'iron_plate' (zentral) oder 'factory:belt_item' (modul-eigen). */
export type ItemId = string;

/** Mengenangabe: Item → Anzahl, z. B. { iron_plate: 2, gear: 1 }. */
export type ItemCounts = Record<ItemId, number>;

/** Grundform, mit der ein Item gezeichnet wird (siehe drawItem). */
export type ItemShape = 'circle' | 'square' | 'diamond' | 'triangle';

export interface ItemDef {
  id: ItemId;
  /** Anzeigename (Deutsch) */
  name: string;
  /** Füllfarbe, z. B. '#c0c0c0' */
  color: string;
  /** Standard: 'circle' */
  shape?: ItemShape;
  /** Optionales Sprite relativ zu public/assets/, z. B. 'factory/gear.png' */
  sprite?: string;
  description?: string;
}

/** Wo ein Rezept hergestellt werden kann: 'hand' oder eine Gebäude-ID. */
export type CraftPlace = 'hand' | string;

export interface RecipeDef {
  id: string;
  /** Anzeigename; Standard: Name des ersten Outputs */
  name?: string;
  inputs: ItemCounts;
  outputs: ItemCounts;
  /** Herstellungszeit in Sekunden (bei 100 % Geschwindigkeit) */
  time: number;
  /** z. B. ['hand', 'factory:assembler'] */
  madeIn: CraftPlace[];
  /** Rezept erst nach dieser Forschung verfügbar */
  requiresResearch?: string;
  /** Freie Gruppierung für Menüs, z. B. 'intermediate' */
  category?: string;
}

export interface ResearchDef {
  id: string;
  name: string;
  description?: string;
  /** Item-Kosten (setzt progression) */
  cost: ItemCounts;
  /** Geldkosten (optional, setzt progression) */
  money?: number;
  /** Forschungszeit in Sekunden (optional) */
  time?: number;
  /** Voraussetzungen (Forschungs-IDs) */
  requires: string[];
}

/**
 * Eine Aktion, die ein Modul anbietet und die UI (oder das Debugpanel) als Knopf anzeigen kann,
 * ohne das Modul zu kennen. Beispiel: 'progression:pr_campaign' (Demonstration auflösen).
 */
export interface ActionDef {
  id: string;
  name: string;
  description?: string;
  /** Freie Gruppierung für Menüs, z. B. 'economy' */
  category?: string;
  run(game: Game): void;
  /** false → Knopf ausgegraut */
  isAvailable?(game: Game): boolean;
}
