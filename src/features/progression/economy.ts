// Geld: Je mehr Verschmutzung und je stärker die SDGs verfehlt werden, desto mehr Geld (Satire).
// Dagegen stehen Betriebskosten für verschmutzende Gebäude, Kraftwerke, Rechenzentren und Reaktoren (Issue #13).
// Einmal pro Sekunde: SDG-Wertung aktualisieren, Einnahmen minus Betriebskosten verbuchen, Kennzahlen setzen.
import { TICKS_PER_SECOND, type Game } from '../../core';
import { PROGRESSION_CONFIG } from './config';
import { formatMoney } from './research';
import type { SdgTracker } from './sdg';

const C = PROGRESSION_CONFIG.economy;

export const STAT_INCOME = 'progression:income';
export const STAT_UPKEEP = 'progression:upkeep';
export const STAT_NET = 'progression:net_income';
export const STAT_MULTIPLIER = 'progression:multiplier';

/** Multiplikator aus der SDG-Verfehlung (0..100 %) → 1..3 */
export function incomeMultiplier(sdgTotal: number): number {
  return 1 + Math.max(0, sdgTotal) / C.multiplierDivisor;
}

/** Einnahmen in €/s (vor Betriebskosten). */
export function incomePerSecond(totalPollution: number, sdgTotal: number): number {
  return (C.baseIncome + C.pollutionIncome * Math.max(0, totalPollution)) * incomeMultiplier(sdgTotal);
}

/** Betriebskosten aller Gebäude in €/s (Summe der Tag-Kosten je Gebäude). */
export function upkeepPerSecond(game: Game): number {
  let sum = 0;
  for (const b of game.world.allBuildings()) {
    for (const tag of b.def.tags) sum += C.upkeepByTag[tag] ?? 0;
  }
  return sum;
}

export class Economy {
  /** Zuletzt berechnete Einnahmen in €/s (für die PR-Kampagne) */
  income = 0;
  private carry = 0;
  private lastBrokeTick = -Infinity;

  constructor(private game: Game, private sdg: SdgTracker) {
    game.stats.define({ id: STAT_INCOME, label: 'Einnahmen', unit: '€/s', group: 'economy' });
    game.stats.define({ id: STAT_UPKEEP, label: 'Betriebskosten', unit: '€/s', group: 'economy' });
    game.stats.define({ id: STAT_NET, label: 'Gewinn', unit: '€/s', group: 'economy' });
    game.stats.define({ id: STAT_MULTIPLIER, label: 'Umweltsünden-Multiplikator', unit: '×', group: 'economy' });
    game.events.on('ready', () => this.update(false));
    game.onTick((g) => {
      if (g.tickCount % TICKS_PER_SECOND === 0) this.update(true);
    });
  }

  private update(pay: boolean): void {
    const g = this.game;
    this.sdg.update();
    this.income = incomePerSecond(g.env.total('pollution'), this.sdg.total);
    const upkeep = upkeepPerSecond(g);
    const net = this.income - upkeep;
    g.stats.set(STAT_INCOME, round2(this.income));
    g.stats.set(STAT_UPKEEP, round2(upkeep));
    g.stats.set(STAT_NET, round2(net));
    g.stats.set(STAT_MULTIPLIER, round2(incomeMultiplier(this.sdg.total)));
    if (!pay) return;

    // Bruchteile von Euro sammeln, damit nur ganze Beträge verbucht werden
    this.carry += net;
    const whole = this.carry >= 0 ? Math.floor(this.carry) : Math.ceil(this.carry);
    if (whole === 0) return;
    this.carry -= whole;
    if (whole > 0) {
      g.economy.add(whole, 'Umweltsünden-Bonus');
      return;
    }
    // Verlust: Kasse kann nicht unter 0 fallen
    const pay2 = Math.min(-whole, g.economy.money);
    if (pay2 > 0) g.economy.spend(pay2, 'Betriebskosten');
    if (pay2 < -whole && g.tickCount - this.lastBrokeTick > C.brokeNoticeSeconds * TICKS_PER_SECOND) {
      this.lastBrokeTick = g.tickCount;
      g.notify(
        `Kasse leer: Die Betriebskosten (${formatMoney(upkeep)}/s) übersteigen die Einnahmen. ` +
          'Mehr verschmutzen, an der Börse verkaufen (K) oder Anlagen abreißen.',
        'warn',
      );
    }
  }
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
