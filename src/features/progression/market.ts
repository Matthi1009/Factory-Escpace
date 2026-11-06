// Börse: Kurse schwanken (Zufall + Rückzug zum Grundpreis, ab und zu Crash/Boom).
// Kurse stehen als Kennzahlen in game.stats (Gruppe 'Börse'), Verkaufen über Aktionen (Kategorie 'Börse').
import { createRng, TICKS_PER_SECOND, type Game } from '../../core';
import { PROGRESSION_CONFIG } from './config';
import { formatMoney } from './research';

const C = PROGRESSION_CONFIG.market;

export class StockMarket {
  /** Aktueller Kurs pro Item in € pro Stück */
  readonly prices = new Map<string, number>();
  private rng: () => number;

  constructor(private game: Game) {
    this.rng = createRng(game.seed ^ 0xb0e5e);
    for (const [item, base] of Object.entries(C.basePrices)) {
      if (!game.registries.items.has(item)) continue;
      const name = game.registries.items.require(item).name;
      this.prices.set(item, base);
      game.stats.define({ id: `progression:price_${item}`, label: `Kurs ${name}`, unit: '€', group: 'Börse' });
      game.registries.actions.register({
        id: `progression:sell_${item}`,
        name: `${C.lotSize}× ${name} verkaufen`,
        description: 'Zum aktuellen Börsenkurs (Kurse: Übersicht, Tab)',
        category: 'Börse',
        run: (g) => this.sell(item, C.lotSize, g),
        isAvailable: (g) => g.inventory.has(item, C.lotSize),
      });
    }
    this.publish();
    game.onTick((g) => {
      if (g.tickCount % (C.tickSeconds * TICKS_PER_SECOND) === 0) this.step();
    });
  }

  price(item: string): number {
    return this.prices.get(item) ?? 0;
  }

  /** Verkauft n Stück zum aktuellen Kurs. false, wenn nicht genug im Inventar. */
  sell(item: string, n: number, game: Game = this.game): boolean {
    if (!game.inventory.remove(item, n)) {
      game.notify(`Nicht genug ${game.registries.items.get(item)?.name ?? item} zum Verkaufen.`, 'warn');
      return false;
    }
    const total = Math.round(this.price(item) * n);
    game.economy.add(total, 'Börse');
    game.notify(`Verkauft: ${n}× ${game.registries.items.get(item)?.name ?? item} für ${formatMoney(total)}`, 'success');
    return true;
  }

  private step(): void {
    let shock = 1;
    if (this.rng() < C.shockChance) {
      const crash = this.rng() < 0.5;
      shock = crash ? 0.5 : 1.6;
      this.game.notify(
        crash
          ? 'Börsencrash! Analysten empfehlen: mehr Kohle verbrennen.'
          : 'Börsenboom! Die Märkte feiern deine Rücksichtslosigkeit.',
        crash ? 'warn' : 'success',
      );
    }
    for (const [item, p] of this.prices) {
      const base = C.basePrices[item]!;
      let next = p * (1 + C.volatility * (this.rng() * 2 - 1)) + C.reversion * (base - p);
      next = Math.max(base * 0.2, next * shock);
      this.prices.set(item, next);
    }
    this.publish();
  }

  private publish(): void {
    for (const [item, p] of this.prices) this.game.stats.set(`progression:price_${item}`, Math.round(p * 100) / 100);
  }
}
