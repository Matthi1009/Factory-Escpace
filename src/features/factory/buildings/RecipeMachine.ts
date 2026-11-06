// Gemeinsame Basis für Maschinen, die ein Rezept abarbeiten (Ofen, Montagemaschine).
// Eingangspuffer → Auftrag (Zeit, ggf. Strom) → Ausgang nach vorne, Müll seitlich/hinten.
import { BaseBuilding, TICKS_PER_SECOND, type Direction, type ItemId, type RecipeDef } from '../../../core';
import type { Pullable, Previewable } from '../transfer';
import { BALANCE } from '../balance';
import { aiFactor } from '../state';
import { BYPRODUCTS, flushWasteBox } from '../waste';

/** Eingangspuffer je Zutat = Rezeptmenge × dieser Faktor */
const INPUT_BUFFER_FACTOR = 2;
/** So viel Müll darf liegen bleiben, bevor die Maschine stoppt */
const WASTE_CAP = BALANCE.waste.machineCap;

export abstract class RecipeMachine extends BaseBuilding implements Pullable, Previewable {
  protected recipe: RecipeDef | null = null;
  protected stock: Record<ItemId, number> = {};
  /** 0..1 Fortschritt des laufenden Auftrags, null = keiner läuft */
  protected progress: number | null = null;
  protected outbox: ItemId[] = [];
  protected wasteBox: ItemId[] = [];
  /** Strombedarf in kW (0 = kein Strom nötig) */
  protected powerKw = 0;
  /** Verschmutzung pro Sekunde während der Arbeit */
  protected pollutionPerSecond = 0;
  /** Geschwindigkeitsfaktor (z. B. KI-Automatisierung später) */
  protected speed = 1;
  /** Zuletzt gemessene Stromversorgung 0..1 (für info) */
  protected lastPower = 1;

  /** Welches Rezept gilt, wenn dieses Item als Erstes ankommt? null = nicht annehmbar. */
  protected abstract pickRecipe(item: ItemId): RecipeDef | null;
  /** Wird aufgerufen, wenn kein Auftrag gestartet werden kann (Ofen gibt sein Rezept dann frei). */
  protected onIdle(): void {}

  wouldAccept(item: ItemId, _from?: Direction): boolean {
    const r = this.recipe ?? this.pickRecipe(item);
    if (!r) return false;
    const need = r.inputs[item];
    if (!need) return false;
    return (this.stock[item] ?? 0) < need * INPUT_BUFFER_FACTOR;
  }

  acceptItem(item: ItemId, from: Direction): boolean {
    if (!this.wouldAccept(item, from)) return false;
    if (!this.recipe) this.recipe = this.pickRecipe(item);
    this.stock[item] = (this.stock[item] ?? 0) + 1;
    return true;
  }

  peekItem(): ItemId | null {
    return this.outbox[0] ?? null;
  }

  takeItem(): ItemId | null {
    return this.outbox.shift() ?? null;
  }

  tick(): void {
    if (this.outbox.length > 0 && this.pushForward(this.outbox[0]!)) this.outbox.shift();
    flushWasteBox(this, this.wasteBox);

    const r = this.recipe;
    if (!r) return;

    if (this.progress === null) {
      if (!this.canStart(r)) {
        this.onIdle();
        return;
      }
      for (const [item, n] of Object.entries(r.inputs)) this.stock[item]! -= n;
      this.progress = 0;
    }

    const f = this.powerKw > 0 ? this.game.power.consume(this.powerKw) : 1;
    this.lastPower = f;
    if (f <= 0) return;
    this.progress += (f * this.speed * aiFactor(this.game)) / (r.time * TICKS_PER_SECOND);
    if (this.pollutionPerSecond > 0) this.game.env.add('pollution', this.x, this.y, (this.pollutionPerSecond * f) / TICKS_PER_SECOND);
    if (this.progress >= 1) {
      this.progress = null;
      for (const [item, n] of Object.entries(r.outputs)) {
        for (let i = 0; i < n; i++) (BYPRODUCTS.has(item) ? this.wasteBox : this.outbox).push(item);
      }
    }
  }

  onRemove(): void {
    this.flushToInventory(); // Inhalt zurückgeben statt verlieren
  }

  info(): string[] {
    const items = this.game.registries.items;
    const name = (id: ItemId) => items.get(id)?.name ?? id;
    const r = this.recipe;
    if (!r) return [this.idleText()];
    const lines = [`Rezept: ${r.name ?? r.id}`];
    const inputs = Object.entries(this.stock).filter(([, n]) => n > 0).map(([id, n]) => `${n}× ${name(id)}`);
    if (inputs.length) lines.push(`Eingang: ${inputs.join(', ')}`);
    if (this.progress !== null) lines.push(`Fortschritt: ${Math.round(this.progress * 100)} %`);
    if (this.powerKw > 0) lines.push(`Strom: ${this.powerKw} kW, Versorgung ${Math.round(this.lastPower * 100)} %`);
    if (this.outbox.length) lines.push(`Ausgang: ${this.outbox.length}× ${name(this.outbox[0]!)}${this.buildingInFront() ? '' : ' (nichts davor)'}`);
    if (this.wasteBox.length) lines.push(`Müll: ${this.wasteBox.length}/${WASTE_CAP}${this.wasteBox.length >= WASTE_CAP ? ' – Maschine steht, Müll seitlich abführen!' : ''}`);
    return lines;
  }

  protected idleText(): string {
    return 'Leerlauf';
  }

  /** Alles aus Puffern ins Spieler-Inventar (z. B. bei Rezeptwechsel). */
  protected flushToInventory(): void {
    const inv = this.game.inventory;
    for (const [item, n] of Object.entries(this.stock)) if (n > 0) inv.add(item, n);
    if (this.progress !== null && this.recipe) inv.addAll(this.recipe.inputs);
    for (const item of [...this.outbox, ...this.wasteBox]) inv.add(item, 1);
    this.stock = {};
    this.outbox = [];
    this.wasteBox = [];
    this.progress = null;
  }

  private canStart(r: RecipeDef): boolean {
    if (this.outbox.length > 0 || this.wasteBox.length >= WASTE_CAP) return false;
    return Object.entries(r.inputs).every(([item, n]) => (this.stock[item] ?? 0) >= n);
  }

  protected isIdleEmpty(): boolean {
    return this.progress === null && this.outbox.length === 0 && this.wasteBox.length === 0 && Object.values(this.stock).every((n) => n === 0);
  }
}
