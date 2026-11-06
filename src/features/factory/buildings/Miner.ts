// Abbaumaschine Mk1: nur auf Erz baubar, läuft mit Kohle (Mk2 mit Strom folgt in M2).
// Kohle kommt per Band/Greifarm oder per Linksklick aus dem Inventar. Baut das Erz unter sich ab und gibt es nach vorne aus.
import type { Refuelable } from '../transfer';
import { BALANCE } from '../balance';
import { aiFactor } from '../state';
import { BaseBuilding, type BuildingDef, type BuildingInit, type Direction, type Game, type ItemId, TICKS_PER_SECOND } from '../../../core';

/** Ticks pro Erz (120 → 0,5 Erz/s) */
const MINE_TICKS = BALANCE.miner.mk1Ticks;
/** So viele Erze werden maximal gepuffert, bevor die Maschine wartet */
const MAX_BUFFER = BALANCE.miner.buffer;
/** Wie viele Erze 1 Kohle für den Mk1 reicht (8 · 2 s = 16 s Laufzeit) */
export const ORE_PER_COAL = BALANCE.miner.orePerCoal;
/** Kohle-Vorrat, den der Mk1 maximal hält */
export const MAX_COAL = BALANCE.miner.mk1CoalCapacity;
/** Verschmutzung pro Sekunde, solange der Mk1 Kohle verbrennt */
const POLLUTION_PER_SECOND = BALANCE.miner.mk1Pollution;

export class Miner extends BaseBuilding implements Refuelable {
  private progress = 0;
  private buffer = 0;
  /** Kohle im Vorrat */
  private coal = 0;
  /** Erze, die die gerade verbrannte Kohle noch hergibt */
  private burn = 0;
  private ore: ItemId | null;

  constructor(init: BuildingInit) {
    super(init);
    this.ore = this.resourceUnder();
  }

  /** Nimmt Kohle an (Band, Greifarm). Alles andere lehnt der Mk1 ab. */
  acceptItem(item: ItemId, _from: Direction): boolean {
    if (item !== 'coal' || this.coal >= MAX_COAL) return false;
    this.coal++;
    return true;
  }

  /** Füllt Kohle aus dem Spieler-Inventar auf. Gibt die Anzahl nachgefüllter Kohle zurück. */
  refuel(): number {
    const n = Math.min(MAX_COAL - this.coal, this.game.inventory.count('coal'));
    if (n > 0 && this.game.inventory.remove('coal', n)) this.coal += n;
    return n > 0 ? n : 0;
  }

  fuelFull(): boolean {
    return this.coal >= MAX_COAL;
  }

  onRemove(): void {
    if (this.coal > 0) this.game.inventory.add('coal', this.coal);
    this.coal = 0;
  }

  tick(): void {
    if (!this.ore) return;
    // Ausgabe zuerst, damit der Puffer sich leert
    if (this.buffer > 0 && this.pushForward(this.ore)) this.buffer--;
    if (this.buffer >= MAX_BUFFER) return;
    if (this.burn <= 0) {
      if (this.coal <= 0) return; // kein Brennstoff
      this.coal--;
      this.burn = ORE_PER_COAL;
    }
    this.progress += aiFactor(this.game);
    this.game.env.add('pollution', this.x, this.y, POLLUTION_PER_SECOND / TICKS_PER_SECOND);
    if (this.progress >= MINE_TICKS) {
      this.progress = 0;
      this.buffer++;
      this.burn--;
    }
  }

  info(): string[] {
    const name = this.ore ? (this.game.registries.items.get(this.ore)?.name ?? this.ore) : 'kein Erz';
    const lines = [`Baut ab: ${name}`, `Kohle: ${this.coal}/${MAX_COAL}${this.burn <= 0 && this.coal <= 0 ? ' – Brennstoff fehlt (Klick mit Kohle im Inventar)' : ''}`, `Fortschritt: ${Math.round((this.progress / MINE_TICKS) * 100)} %`];
    if (this.buffer > 0) lines.push(`Puffer: ${this.buffer}/${MAX_BUFFER}${this.buffer >= MAX_BUFFER ? ' (Ausgang blockiert)' : ''}`);
    return lines;
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = '#5a5f66';
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.strokeStyle = '#2d3035';
    ctx.lineWidth = 0.05;
    ctx.strokeRect(-0.45, -0.45, 0.9, 0.9);
    // drehender Bohrkopf
    ctx.save();
    ctx.rotate(this.active && this.buffer < MAX_BUFFER && (this.burn > 0 || this.coal > 0) ? time * 6 : 0);
    ctx.fillStyle = '#d6a21e';
    ctx.fillRect(-0.25, -0.06, 0.5, 0.12);
    ctx.fillRect(-0.06, -0.25, 0.12, 0.5);
    ctx.restore();
    // Ausgabepfeil
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -0.46);
    ctx.lineTo(0.14, -0.3);
    ctx.lineTo(-0.14, -0.3);
    ctx.closePath();
    ctx.fill();
  }
}

export const MINER_DEF: BuildingDef = {
  id: 'factory:miner',
  name: 'Abbaumaschine Mk1',
  description: 'Baut das Erz unter sich ab und gibt es nach vorne aus. Läuft mit Kohle (Klick mit Kohle im Inventar oder per Band). Nur auf Erz baubar.',
  size: { w: 1, h: 1 },
  cost: { iron_plate: 6, gear: 2 },
  maxHp: 80,
  color: '#5a5f66',
  tags: ['pollutes'],
  rotatable: true,
  canPlace: (game: Game, x: number, y: number) => game.world.getResource(x, y) !== null || 'Nur auf Erz baubar',
  create: (init) => new Miner(init),
};
