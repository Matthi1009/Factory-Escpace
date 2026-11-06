// Geld und SDG-Satire-Wertung: Je mehr Verschmutzung, desto mehr Geld.
// Einmal pro Sekunde: Einnahmen auszahlen, Kennzahlen in game.stats aktualisieren.
import { TICKS_PER_SECOND, type Game } from '../../core';

/** Grundeinkommen in €/s (auch ohne Verschmutzung). */
export const BASE_INCOME = 1;
/** Zusätzliche €/s pro Verschmutzungs-Einheit (Summe über die ganze Karte). */
export const POLLUTION_INCOME = 0.02;
/** Bei dieser Gesamtverschmutzung sind die SDGs zu ~63 % verfehlt (1 − 1/e). */
export const SDG_SCALE = 2000;

export const STAT_SDG_TOTAL = 'progression:sdg_total';
export const STAT_INCOME = 'progression:income';

/** Wie stark die SDGs verfehlt werden, 0..100 %. */
export function sdgFailure(totalPollution: number): number {
  return 100 * (1 - Math.exp(-Math.max(0, totalPollution) / SDG_SCALE));
}

/** Einnahmen in €/s. Satire: Umweltzerstörung lohnt sich. */
export function incomePerSecond(totalPollution: number): number {
  return BASE_INCOME + POLLUTION_INCOME * Math.max(0, totalPollution);
}

export function setupEconomy(game: Game): void {
  game.stats.define({ id: STAT_SDG_TOTAL, label: 'SDG-Verfehlung', unit: '%', group: 'sdg' });
  game.stats.define({ id: STAT_INCOME, label: 'Einnahmen', unit: '€/s', group: 'economy' });

  // Bruchteile von Euro sammeln, damit nur ganze Beträge ausgezahlt werden
  let carry = 0;

  const update = (pay: boolean) => {
    const total = game.env.total('pollution');
    const income = incomePerSecond(total);
    game.stats.set(STAT_SDG_TOTAL, Math.round(sdgFailure(total) * 10) / 10);
    game.stats.set(STAT_INCOME, Math.round(income * 100) / 100);
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
