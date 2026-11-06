// Geld. Die Logik, WOFÜR es Geld gibt, gehört progression.
import type { EventBus } from '../EventBus';

export class Economy {
  private _money = 0;

  constructor(private events: EventBus) {}

  get money(): number {
    return this._money;
  }

  add(amount: number, reason?: string): void {
    if (amount === 0) return;
    this._money += amount;
    this.events.emit('moneyChanged', { money: this._money, delta: amount, reason });
  }

  canAfford(amount: number): boolean {
    return this._money >= amount;
  }

  /** Gibt Geld aus. false (und keine Änderung), wenn es nicht reicht. */
  spend(amount: number, reason?: string): boolean {
    if (amount < 0) return false;
    if (this._money < amount) return false;
    this.add(-amount, reason);
    return true;
  }
}
