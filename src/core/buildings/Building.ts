// Gebäude-System: BuildingDef (Typ, wird registriert) und Building (Instanz auf der Karte).
// Referenz-Implementierung: src/core/buildings/Chest.ts
import type { Game } from '../Game';
import type { ItemCounts, ItemId } from '../defs';
import type { BuildingTag } from '../content/tags';
import type { ResourceId } from '../content/resources';
import { opposite, type Direction } from '../direction';
import type { TilePos } from '../world/World';

/** Daten, die create() bekommt. Einfach an den BaseBuilding-Konstruktor weiterreichen. */
export interface BuildingInit {
  game: Game;
  def: BuildingDef;
  /** Linke obere Kachel */
  x: number;
  y: number;
  dir: Direction;
}

export interface BuildingDef {
  /** z. B. 'factory:belt' */
  id: string;
  name: string;
  description?: string;
  /** Größe in Kacheln. Vorerst 1×1. Gebäude mit w ≠ h sollten rotatable: false haben. */
  size: { w: number; h: number };
  /** Baukosten, werden beim Platzieren aus dem Inventar abgezogen und beim Abriss erstattet. */
  cost: ItemCounts;
  /** Nur baubar, wenn diese Forschung freigeschaltet ist. */
  requiresResearch?: string;
  maxHp: number;
  /** Farbe für das Standard-Quadrat (wenn kein draw()) und für Vorschau/Bauleiste. */
  color: string;
  /** Tags aus src/core/content/tags.ts */
  tags: BuildingTag[];
  /** true → nicht in der Bauleiste anzeigen (z. B. Debug-Gebäude, Wrack). */
  hidden?: boolean;
  /** false → Spieler kann es nicht abreißen. Standard: true */
  removable?: boolean;
  /** false → R dreht es nicht. Standard: true */
  rotatable?: boolean;
  /** Zusätzliche Bau-Bedingung. true = ok, false oder Text (Grund) = nicht möglich. */
  canPlace?(game: Game, x: number, y: number, dir: Direction): boolean | string;
  /** Erzeugt die Instanz, meist: (init) => new MeinGebaeude(init) */
  create(init: BuildingInit): Building;
}

export interface Building {
  /** Eindeutige Instanz-Nummer */
  readonly uid: number;
  readonly def: BuildingDef;
  /** Linke obere Kachel */
  readonly x: number;
  readonly y: number;
  /** Ausrichtung: wohin „vorne“ zeigt */
  dir: Direction;
  hp: number;
  /** false → Core ruft tick() nicht auf */
  enabled: boolean;
  /** Vom Core verwaltet (game.blockBuilding). > 0 → blockiert, kein tick(). Nicht selbst setzen. */
  blockedTicks: number;
  /** Vom Core gesetzt, sobald das Gebäude entfernt/zerstört wurde. */
  removed: boolean;
  /** Mittelpunkt in Weltkoordinaten */
  center(): TilePos;

  /** Spiellogik, 60× pro Sekunde (nur wenn enabled und nicht blockiert). */
  tick?(): void;
  /**
   * Eigenes Zeichnen. ctx ist so verschoben und gedreht, dass (0,0) die Gebäudemitte ist,
   * 1 Einheit = 1 Kachel und „vorne“ nach oben (-y) zeigt. time = Spielzeit in Sekunden.
   */
  draw?(ctx: CanvasRenderingContext2D, time: number): void;
  /**
   * Item-Transfer-Vertrag: Ein anderes Gebäude bietet ein Item an.
   * from = Seite DIESES Gebäudes, an der das Item ankommt (Band im Westen schiebt nach Osten → from = W).
   * true = angenommen (der Absender gibt es ab), false = abgelehnt (Absender behält es).
   */
  acceptItem?(item: ItemId, from: Direction): boolean;
  /**
   * Zustandszeilen für Tooltip/Inspektor der UI (Deutsch), z. B. ['Rezept: Eisenplatte', 'Fortschritt: 40 %'].
   * So kann die UI Gebäude anderer Module anzeigen, ohne sie zu kennen.
   */
  info?(): string[];
  /** Nach dem Platzieren (Gebäude steht schon auf der Karte). */
  onPlace?(): void;
  /** Vor dem Entfernen/Zerstören (Gebäude steht noch auf der Karte). */
  onRemove?(): void;
}

let nextUid = 1;

/**
 * Basisklasse mit Helfern. Eigene Gebäude erben davon und ergänzen tick/draw/acceptItem nach Bedarf.
 */
export abstract class BaseBuilding implements Building {
  readonly uid = nextUid++;
  readonly game: Game;
  readonly def: BuildingDef;
  readonly x: number;
  readonly y: number;
  dir: Direction;
  hp: number;
  enabled = true;
  blockedTicks = 0;
  removed = false;

  constructor(init: BuildingInit) {
    this.game = init.game;
    this.def = init.def;
    this.x = init.x;
    this.y = init.y;
    this.dir = init.dir;
    this.hp = init.def.maxHp;
  }

  center(): TilePos {
    return { x: this.x + this.def.size.w / 2, y: this.y + this.def.size.h / 2 };
  }

  /** Läuft das Gebäude gerade? (enabled, nicht blockiert, nicht entfernt) */
  get active(): boolean {
    return this.game.isActive(this);
  }

  /** Kachel direkt vor dem Gebäude (bei 1×1: Nachbar in Richtung dir). */
  frontTile(): TilePos {
    return this.sideTile(this.dir);
  }

  /** Kachel direkt neben dem Gebäude in Richtung dir (mittig an der Seite). */
  sideTile(dir: Direction): TilePos {
    const c = this.center();
    const { w, h } = this.def.size;
    switch (dir) {
      case 0: return { x: Math.floor(c.x - 0.001), y: this.y - 1 };
      case 1: return { x: this.x + w, y: Math.floor(c.y - 0.001) };
      case 2: return { x: Math.floor(c.x - 0.001), y: this.y + h };
      default: return { x: this.x - 1, y: Math.floor(c.y - 0.001) };
    }
  }

  /** Gebäude direkt vor diesem (oder null). */
  buildingInFront(): Building | null {
    return this.neighborBuilding(this.dir);
  }

  /** Gebäude neben diesem in Richtung dir (oder null). */
  neighborBuilding(dir: Direction): Building | null {
    const t = this.sideTile(dir);
    const b = this.game.world.getBuilding(t.x, t.y);
    return b === this ? null : b;
  }

  /** Gibt ein Item nach vorne ab. true = angenommen. */
  pushForward(item: ItemId): boolean {
    return this.pushTo(this.dir, item);
  }

  /** Gibt ein Item in Richtung dir ab. true = angenommen. Inaktive Ziele lehnen immer ab. */
  pushTo(dir: Direction, item: ItemId): boolean {
    const target = this.neighborBuilding(dir);
    if (!target || !target.acceptItem || !this.game.isActive(target)) return false;
    return target.acceptItem(item, opposite(dir));
  }

  /** Ressource unter der linken oberen Kachel (für Abbaumaschinen). */
  resourceUnder(): ResourceId | null {
    return this.game.world.getResource(this.x, this.y);
  }
}
