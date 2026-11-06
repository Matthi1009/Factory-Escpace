// Ofen: nimmt Items an, wählt anhand des ersten Items ein Rezept (madeIn: factory:furnace),
// verarbeitet es und gibt das Ergebnis nach vorne aus. Verschmutzt, solange er arbeitet.
import { BaseBuilding, type BuildingDef, type BuildingInit, type ItemId, type RecipeDef, type Direction, TICKS_PER_SECOND } from '../../../core';
import { FURNACE_ID } from '../recipes';

/** Verschmutzung pro Sekunde, solange der Ofen arbeitet */
const POLLUTION_PER_SECOND = 0.5;
/** Eingangspuffer je Zutat = Rezeptmenge × dieser Faktor */
const INPUT_BUFFER_FACTOR = 2;

export class Furnace extends BaseBuilding {
  private recipe: RecipeDef | null = null;
  private stock: Record<ItemId, number> = {};
  /** 0..1 Fortschritt des laufenden Auftrags, null = keiner läuft */
  private progress: number | null = null;
  /** fertige Produkte, die noch nach vorne wollen */
  private outbox: ItemId[] = [];

  constructor(init: BuildingInit) {
    super(init);
  }

  acceptItem(item: ItemId, _from: Direction): boolean {
    let r = this.recipe;
    if (!r) {
      r = this.findRecipeFor(item);
      if (!r) return false;
    }
    const need = r.inputs[item];
    if (!need) return false;
    if ((this.stock[item] ?? 0) >= need * INPUT_BUFFER_FACTOR) return false;
    this.recipe = r;
    this.stock[item] = (this.stock[item] ?? 0) + 1;
    return true;
  }

  tick(): void {
    // 1. Fertiges nach vorne schieben
    if (this.outbox.length > 0 && this.pushForward(this.outbox[0]!)) this.outbox.shift();

    const r = this.recipe;
    if (!r) return;

    // 2. Neuen Auftrag starten, wenn Zutaten da und Ausgang nicht überfüllt
    if (this.progress === null) {
      if (this.outbox.length > 0 || !this.hasInputs(r)) {
        if (this.outbox.length === 0 && this.isEmpty()) this.recipe = null; // wieder frei für anderes Rezept
        return;
      }
      for (const [item, n] of Object.entries(r.inputs)) this.stock[item]! -= n;
      this.progress = 0;
    }

    // 3. Arbeiten
    this.progress += 1 / (r.time * TICKS_PER_SECOND);
    this.game.env.add('pollution', this.x, this.y, POLLUTION_PER_SECOND / TICKS_PER_SECOND);
    if (this.progress >= 1) {
      this.progress = null;
      for (const [item, n] of Object.entries(r.outputs)) for (let i = 0; i < n; i++) this.outbox.push(item);
    }
  }

  onRemove(): void {
    // Inhalt zurückgeben statt verlieren
    for (const [item, n] of Object.entries(this.stock)) if (n > 0) this.game.inventory.add(item, n);
    for (const item of this.outbox) this.game.inventory.add(item, 1);
    this.stock = {};
    this.outbox = [];
  }

  info(): string[] {
    const items = this.game.registries.items;
    const name = (id: ItemId) => items.get(id)?.name ?? id;
    if (!this.recipe) return ['Leerlauf – wartet auf Erz oder Stein'];
    const lines = [`Rezept: ${this.recipe.name ?? this.recipe.id}`];
    const inputs = Object.entries(this.stock).filter(([, n]) => n > 0).map(([id, n]) => `${n}× ${name(id)}`);
    if (inputs.length) lines.push(`Eingang: ${inputs.join(', ')}`);
    if (this.progress !== null) lines.push(`Fortschritt: ${Math.round(this.progress * 100)} %`);
    if (this.outbox.length) lines.push(`Ausgang: ${this.outbox.length}× ${name(this.outbox[0]!)}${this.outbox.length > 0 && !this.buildingInFront() ? ' (nichts davor)' : ''}`);
    return lines;
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = '#7a3b2a';
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.strokeStyle = '#3d1c13';
    ctx.lineWidth = 0.05;
    ctx.strokeRect(-0.45, -0.45, 0.9, 0.9);
    // Glut: heller, solange gearbeitet wird
    const working = this.progress !== null;
    const glow = working ? 0.6 + 0.3 * Math.sin(time * 8) : 0.15;
    ctx.fillStyle = `rgba(255,${working ? 150 : 90},30,${glow})`;
    ctx.fillRect(-0.25, -0.2, 0.5, 0.45);
    // Ausgabepfeil
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -0.46);
    ctx.lineTo(0.14, -0.3);
    ctx.lineTo(-0.14, -0.3);
    ctx.closePath();
    ctx.fill();
  }

  private findRecipeFor(item: ItemId): RecipeDef | null {
    for (const r of this.game.registries.recipes.all()) {
      if (r.madeIn.includes(FURNACE_ID) && r.inputs[item] && this.game.research.isUnlocked(r.requiresResearch)) return r;
    }
    return null;
  }

  private hasInputs(r: RecipeDef): boolean {
    return Object.entries(r.inputs).every(([item, n]) => (this.stock[item] ?? 0) >= n);
  }

  private isEmpty(): boolean {
    return Object.values(this.stock).every((n) => n === 0);
  }
}

export const FURNACE_DEF: BuildingDef = {
  id: FURNACE_ID,
  name: 'Ofen',
  description: 'Schmilzt Erz zu Platten und brennt Stein zu Beton. Verschmutzt die Umgebung.',
  size: { w: 1, h: 1 },
  cost: { stone: 5 },
  maxHp: 120,
  color: '#7a3b2a',
  tags: ['pollutes'],
  rotatable: true,
  create: (init) => new Furnace(init),
};
