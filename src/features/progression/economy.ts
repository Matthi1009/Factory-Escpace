// Geld: Je mehr Verschmutzung und je stärker die SDGs verfehlt werden, desto mehr Geld (Satire).
// Einmal pro Sekunde: SDG-Wertung aktualisieren, Einnahmen auszahlen, Kennzahlen setzen.
import { TICKS_PER_SECOND, type Game } from '../../core';
import { PROGRESSION_CONFIG } from './config';
import type { SdgTracker } from './sdg';

const C = PROGRESSION_CONFIG.economy;

export const STAT_INCOME = 'progression:income';
export const STAT_MULTIPLIER = 'progression:multiplier';

/** Multiplikator aus der SDG-Verfehlung (0..100 %) → 1..3 */
export function incomeMultiplier(sdgTotal: number): number {
  return 1 + Math.max(0, sdgTotal) / C.multiplierDivisor;
}

/** Einnahmen in €/s. */
export function incomePerSecond(totalPollution: number, sdgTotal: number): number {
  return (C.baseIncome + C.pollutionIncome * Math.max(0, totalPollution)) * incomeMultiplier(sdgTotal);
}

export function setupEconomy(game: Game, sdg: SdgTracker): void {
  game.stats.define({ id: STAT_INCOME, label: 'Einnahmen', unit: '€/s', group: 'economy' });
  game.stats.define({ id: STAT_MULTIPLIER, label: 'Umweltsünden-Multiplikator', unit: '×', group: 'economy' });

  // Bruchteile von Euro sammeln, damit nur ganze Beträge ausgezahlt werden
  let carry = 0;

  const update = (pay: boolean) => {
    sdg.update();
    const income = incomePerSecond(game.env.total('pollution'), sdg.total);
    game.stats.set(STAT_INCOME, Math.round(income * 100) / 100);
    game.stats.set(STAT_MULTIPLIER, Math.round(incomeMultiplier(sdg.total) * 100) / 100);
    if (!pay) return;
    carry += income;
    const whole = Math.floor(carry);
    if (whole > 0) {
      carry -= whole;
      game.economy.add(whole, 'Umweltsünden-Bonus');
    }
  };

  game.events.on('ready', () => update(false));
  game.onTick((g) => {
    if (g.tickCount % TICKS_PER_SECOND === 0) update(true);
  });
}
