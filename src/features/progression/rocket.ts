// Raketen-Ziel: Genug Raketenteile im Inventar → Aktion „Rakete starten“ → Countdown → Sieg.
// Die Rakete steht während des Countdowns neben dem Wrack und hebt in den letzten Sekunden ab.
import { TICKS_PER_SECOND, type Game } from '../../core';
import { PROGRESSION_CONFIG } from './config';
import { formatMoney } from './research';
import type { SdgTracker } from './sdg';

const C = PROGRESSION_CONFIG.rocket;
export const STAT_ROCKET = 'progression:rocket_parts';

export class RocketGoal {
  /** Tick, an dem der Countdown begonnen hat (null = kein Start) */
  launchTick: number | null = null;
  private announced = false;

  constructor(private game: Game, private sdg: SdgTracker) {
    game.stats.define({ id: STAT_ROCKET, label: `Raketenteile (Ziel: ${C.partsNeeded})`, group: 'Ziel' });
    game.stats.set(STAT_ROCKET, 0);
    game.events.on('inventoryChanged', ({ item, count }) => {
      if (item !== 'rocket_part') return;
      game.stats.set(STAT_ROCKET, count);
      if (count >= C.partsNeeded && !this.announced && this.launchTick === null) {
        this.announced = true;
        game.notify('Genug Raketenteile! Starte die Rakete im Aktionen-Menü: „Rakete starten“.', 'success');
      }
    });
    game.registries.actions.register({
      id: 'progression:launch_rocket',
      name: 'Rakete starten',
      description: `Braucht ${C.partsNeeded} Raketenteile. Ab nach Hause – der Planet bleibt, wie er ist.`,
      category: 'Ziel',
      run: () => this.launch(),
      isAvailable: (g) => this.launchTick === null && !g.over && g.inventory.has('rocket_part', C.partsNeeded),
    });
    game.onTick(() => this.tick());
    game.renderer.addDrawHook('effects', (ctx, view) => this.draw(ctx, view.time));
  }

  launch(): boolean {
    if (this.launchTick !== null || this.game.over) return false;
    if (!this.game.inventory.remove('rocket_part', C.partsNeeded)) {
      this.game.notify(`Für den Start fehlen Raketenteile (${C.partsNeeded} nötig).`, 'warn');
      return false;
    }
    this.launchTick = this.game.tickCount;
    this.game.notify(`Countdown läuft: ${C.countdownSeconds} Sekunden bis zum Start!`, 'success');
    return true;
  }

  private tick(): void {
    if (this.launchTick === null) return;
    const elapsed = (this.game.tickCount - this.launchTick) / TICKS_PER_SECOND;
    if (elapsed >= C.countdownSeconds) {
      this.launchTick = null;
      const sdg = Math.round(this.sdg.total);
      this.game.endGame(
        true,
        `Die Rakete hebt ab! Zurück bleibt ein Planet mit ${sdg} % SDG-Verfehlung – ` +
          `und auf deinem Konto ${formatMoney(this.game.economy.money)}. Die Aktionäre jubeln.`,
      );
    }
  }

  private draw(ctx: CanvasRenderingContext2D, time: number): void {
    if (this.launchTick === null || !this.game.wreck) return;
    const elapsed = time - this.launchTick / TICKS_PER_SECOND;
    const liftStart = C.countdownSeconds - 3;
    const lift = Math.max(0, elapsed - liftStart);
    const c = this.game.wreck.center();
    const x = c.x + 2.6;
    const y = c.y - lift * lift * 2.5; // beschleunigt nach oben
    // Rauch am Boden
    if (elapsed > liftStart - 1) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + time;
        ctx.fillStyle = `rgba(200,200,200,${0.35 - i * 0.03})`;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * (0.6 + lift * 0.3), c.y + 1 + Math.sin(a) * 0.3, 0.4 + lift * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Flamme
    if (elapsed > liftStart - 0.5) {
      const f = 0.6 + Math.random() * 0.4;
      ctx.fillStyle = '#ffb02e';
      ctx.beginPath();
      ctx.moveTo(x - 0.25, y + 0.9);
      ctx.lineTo(x, y + 0.9 + f * 1.2);
      ctx.lineTo(x + 0.25, y + 0.9);
      ctx.fill();
    }
    // Rakete
    ctx.fillStyle = '#eef1f5';
    ctx.beginPath();
    ctx.moveTo(x, y - 1.3);
    ctx.quadraticCurveTo(x + 0.35, y - 0.7, x + 0.3, y + 0.9);
    ctx.lineTo(x - 0.3, y + 0.9);
    ctx.quadraticCurveTo(x - 0.35, y - 0.7, x, y - 1.3);
    ctx.fill();
    ctx.fillStyle = '#d93a2b';
    ctx.beginPath();
    ctx.moveTo(x - 0.3, y + 0.4);
    ctx.lineTo(x - 0.6, y + 1);
    ctx.lineTo(x - 0.3, y + 0.9);
    ctx.moveTo(x + 0.3, y + 0.4);
    ctx.lineTo(x + 0.6, y + 1);
    ctx.lineTo(x + 0.3, y + 0.9);
    ctx.fill();
    ctx.fillStyle = '#5fb3d9';
    ctx.beginPath();
    ctx.arc(x, y - 0.4, 0.13, 0, Math.PI * 2);
    ctx.fill();
    // Countdown-Zahl
    const left = Math.ceil(C.countdownSeconds - elapsed);
    if (left > 0) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 0.08;
      ctx.font = 'bold 1px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(String(left), c.x, c.y - 2.4);
      ctx.fillText(String(left), c.x, c.y - 2.4);
    }
  }
}
