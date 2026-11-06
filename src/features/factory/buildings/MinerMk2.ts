// Abbaumaschine Mk2: elektrisch, doppelt so schnell wie der Mk1, verschmutzt selbst nicht (das Kraftwerk schon).
import { BALANCE } from '../balance';
import { aiFactor } from '../state';
import { drawMiner } from '../art/minerArt';
import { BaseBuilding, type BuildingDef, type BuildingInit, type Game, type ItemId } from '../../../core';

const MINE_TICKS = BALANCE.miner.mk2Ticks; // 1 Erz/s bei voller Versorgung
const MAX_BUFFER = BALANCE.miner.buffer + 1;
const POWER_KW = BALANCE.miner.mk2Kw;

export class MinerMk2 extends BaseBuilding {
  private progress = 0;
  private buffer = 0;
  private lastPower = 1;
  private ore: ItemId | null;

  constructor(init: BuildingInit) {
    super(init);
    this.ore = this.resourceUnder();
  }

  tick(): void {
    if (!this.ore) return;
    if (this.buffer > 0 && this.pushForward(this.ore)) this.buffer--;
    if (this.buffer >= MAX_BUFFER) return;
    const f = this.game.power.consume(POWER_KW);
    this.lastPower = f;
    this.progress += f * aiFactor(this.game);
    if (this.progress >= MINE_TICKS) {
      this.progress = 0;
      this.buffer++;
    }
  }

  info(): string[] {
    const name = this.ore ? (this.game.registries.items.get(this.ore)?.name ?? this.ore) : 'kein Erz';
    const lines = [`Baut ab: ${name}`, `Strom: ${POWER_KW} kW, Versorgung ${Math.round(this.lastPower * 100)} %`, `Fortschritt: ${Math.round((this.progress / MINE_TICKS) * 100)} %`];
    if (this.buffer >= MAX_BUFFER) lines.push('Ausgang blockiert');
    return lines;
  }

  /** Optik: siehe art/minerArt.ts (nur Zeichnen, keine Logik) */
  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const working = this.lastPower > 0 && this.buffer < MAX_BUFFER;
    const led = this.blockedTicks > 0 || this.lastPower <= 0 ? 'stop' : working ? 'run' : 'wait';
    drawMiner(ctx, this, time, { working, variant: 'mk2', led, power: this.lastPower });
  }
}

export const MINER_MK2_DEF: BuildingDef = {
  id: 'factory:miner_mk2',
  name: 'Abbaumaschine Mk2',
  description: `Elektrische Abbaumaschine (${POWER_KW} kW), 1 Erz/s. Nur auf Erz baubar.`,
  size: { w: 1, h: 1 },
  cost: { iron_plate: 10, gear: 5, circuit: 3 },
  requiresResearch: 'power_coal',
  maxHp: 100,
  color: '#3e5a7a',
  tags: ['power_consumer'],
  rotatable: true,
  canPlace: (game: Game, x: number, y: number) => game.world.getResource(x, y) !== null || 'Nur auf Erz baubar',
  create: (init) => new MinerMk2(init),
};
