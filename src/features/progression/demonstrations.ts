// Demonstrationen (gewaltfrei!): Demonstranten blockieren ein verschmutzendes Gebäude für eine Weile.
// Auflösen nur mit Geld: PR-Kampagne (Gebäude zweimal anklicken oder Aktion im Aktionen-Menü).
// Je stärker die SDGs verfehlt werden, desto öfter wird demonstriert.
import { createRng, TICKS_PER_SECOND, type Building, type Game } from '../../core';
import { PROGRESSION_CONFIG } from './config';
import { formatMoney } from './research';
import type { SdgTracker } from './sdg';

const C = PROGRESSION_CONFIG.demonstrations;

const SLOGANS = [
  'Es gibt keinen Planet B!',
  'SDGs jetzt!',
  'Wir wollen atmen!',
  'Stoppt den Smog!',
  'Profit ≠ Zukunft',
  'Klimagerechtigkeit!',
  'Wasser für alle!',
  'Käfer sind auch Tiere!',
];
const SHIRTS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22'];

interface Protester {
  dx: number;
  dy: number;
  phase: number;
  shirt: string;
  slogan: string | null;
}

interface Demo {
  building: Building;
  people: Protester[];
}

export const STAT_DEMOS = 'progression:demonstrations';

export class Demonstrations {
  readonly demos = new Map<Building, Demo>();
  private rng: () => number;
  private confirm: { building: Building; untilTick: number } | null = null;
  /** Gebäude, deren Blockade gerade per PR-Kampagne aufgehoben wird (andere Meldung) */
  private resolving = new Set<Building>();

  constructor(private game: Game, private sdg: SdgTracker) {
    this.rng = createRng(game.seed ^ 0xd3e0);
    game.stats.define({ id: STAT_DEMOS, label: 'Demonstrationen', group: 'events' });
    game.stats.set(STAT_DEMOS, 0);

    game.onTick((g) => {
      if (g.tickCount % (C.checkSeconds * TICKS_PER_SECOND) === 0) this.maybeStart();
    });
    game.events.on('buildingUnblocked', ({ building }) => this.end(building));
    game.events.on('buildingRemoved', ({ building }) => this.end(building));
    game.events.on('buildingDestroyed', ({ building }) => this.end(building));
    game.events.on('buildingClicked', ({ building }) => this.onClick(building));

    game.registries.actions.register({
      id: 'progression:pr_campaign',
      name: 'PR-Kampagne: alle Demonstrationen auflösen',
      description: 'Greenwashing gegen Bares. Der Preis steigt mit der SDG-Verfehlung.',
      category: 'Wirtschaft',
      run: (g) => this.campaign([...this.demos.keys()], g),
      isAvailable: (g) => this.demos.size > 0 && g.economy.canAfford(this.prCost() * this.demos.size),
    });

    game.renderer.addDrawHook('entities', (ctx, view) => this.draw(ctx, view.time, view.zoom, view.minX, view.minY, view.maxX, view.maxY));
  }

  /** Preis einer PR-Kampagne für eine Demonstration in € */
  prCost(): number {
    return Math.round(C.prBaseCost * (1 + this.sdg.total / 50));
  }

  /** Startet eine Demonstration vor b (auch für Tests). */
  start(b: Building): void {
    if (this.demos.has(b) || b.removed) return;
    const people: Protester[] = [];
    const n = 5 + Math.floor(this.rng() * 4);
    const { w, h } = b.def.size;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + this.rng() * 0.4;
      const r = Math.max(w, h) / 2 + 0.25 + this.rng() * 0.35;
      people.push({
        dx: Math.cos(a) * r,
        dy: Math.sin(a) * r,
        phase: this.rng() * Math.PI * 2,
        shirt: SHIRTS[Math.floor(this.rng() * SHIRTS.length)]!,
        slogan: i % 2 === 0 ? SLOGANS[Math.floor(this.rng() * SLOGANS.length)]! : null,
      });
    }
    this.demos.set(b, { building: b, people });
    this.game.blockBuilding(b, C.durationSeconds * TICKS_PER_SECOND, 'Demonstration');
    this.game.stats.set(STAT_DEMOS, this.demos.size);
    this.game.notify(
      `Demonstration vor ${b.def.name}! Die Produktion steht ${C.durationSeconds} s still. ` +
        `PR-Kampagne: ${formatMoney(this.prCost())} (Gebäude 2× anklicken oder Aktionen-Menü).`,
      'warn',
    );
  }

  private maybeStart(): void {
    if (this.game.over || this.sdg.total < C.minSdg || this.demos.size >= C.maxConcurrent) return;
    const chance = (C.maxChance * this.sdg.total) / 100;
    if (this.rng() > chance) return;
    const targets = this.game.world.buildingsWithTag('pollutes').filter((b) => !this.demos.has(b) && !this.game.isBlocked(b));
    if (!targets.length) return;
    this.start(targets[Math.floor(this.rng() * targets.length)]!);
  }

  private end(b: Building): void {
    if (!this.demos.delete(b)) return;
    this.game.stats.set(STAT_DEMOS, this.demos.size);
    if (this.confirm?.building === b) this.confirm = null;
    if (this.resolving.has(b)) return;
    if (!b.removed) this.game.notify(`Die Demonstranten vor ${b.def.name} ziehen weiter. Die Produktion läuft wieder.`, 'info');
  }

  private onClick(b: Building): void {
    if (!this.demos.has(b)) return;
    const now = this.game.tickCount;
    if (this.confirm && this.confirm.building === b && now <= this.confirm.untilTick) {
      this.confirm = null;
      this.campaign([b], this.game);
      return;
    }
    this.confirm = { building: b, untilTick: now + C.confirmSeconds * TICKS_PER_SECOND };
    this.game.notify(`PR-Kampagne für ${b.def.name}: ${formatMoney(this.prCost())}. Zum Bestätigen nochmal klicken.`, 'info');
  }

  /** Löst Demonstrationen per PR-Kampagne auf, sofern das Geld reicht. */
  private campaign(buildings: Building[], game: Game): void {
    if (!buildings.length) return;
    const cost = this.prCost() * buildings.length;
    if (!game.economy.spend(cost, 'PR-Kampagne')) {
      game.notify(`Zu wenig Geld für die PR-Kampagne (${formatMoney(cost)}).`, 'warn');
      return;
    }
    for (const b of buildings) {
      this.resolving.add(b);
      game.unblockBuilding(b);
      this.end(b);
      this.resolving.delete(b);
    }
    game.notify(
      `Greenwashing erfolgreich (${formatMoney(cost)})! Ein Werbespot mit Bäumen, und alle gehen nach Hause.`,
      'success',
    );
  }

  private draw(ctx: CanvasRenderingContext2D, time: number, zoom: number, minX: number, minY: number, maxX: number, maxY: number): void {
    for (const demo of this.demos.values()) {
      const c = demo.building.center();
      if (c.x < minX - 3 || c.y < minY - 3 || c.x > maxX + 4 || c.y > maxY + 4) continue;
      for (const p of demo.people) {
        const bob = Math.abs(Math.sin(time * 4 + p.phase)) * 0.06;
        const x = c.x + p.dx;
        const y = c.y + p.dy - bob;
        // Körper + Kopf
        ctx.fillStyle = p.shirt;
        ctx.beginPath();
        ctx.ellipse(x, y + 0.08, 0.09, 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f2c79b';
        ctx.beginPath();
        ctx.arc(x, y - 0.1, 0.07, 0, Math.PI * 2);
        ctx.fill();
        if (!p.slogan) continue;
        // Schild an einem Stab
        const sx = x + 0.1;
        const sy = y - 0.5 - bob;
        ctx.strokeStyle = '#6b4a2b';
        ctx.lineWidth = 0.03;
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        ctx.fillStyle = '#fdfdf5';
        ctx.fillRect(sx - 0.4, sy - 0.24, 0.8, 0.26);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 0.02;
        ctx.strokeRect(sx - 0.4, sy - 0.24, 0.8, 0.26);
        if (zoom >= 40) {
          ctx.fillStyle = '#b3261e';
          ctx.font = 'bold 0.13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.slogan, sx, sy - 0.11, 0.76);
        }
      }
    }
  }
}
