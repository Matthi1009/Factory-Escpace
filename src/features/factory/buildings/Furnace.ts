// Ofen: wählt anhand des ersten angenommenen Items ein Rezept (madeIn: factory:furnace),
// verarbeitet es und gibt das Ergebnis nach vorne aus. Verschmutzt, solange er arbeitet.
import { type BuildingDef, type BuildingInit, type ItemId, type RecipeDef } from '../../../core';
import { FURNACE_ID } from '../recipes';
import { BALANCE } from '../balance';
import { drawFurnace } from '../art/furnaceArt';
import { RecipeMachine } from './RecipeMachine';

export class Furnace extends RecipeMachine {
  protected override pollutionPerSecond: number = BALANCE.furnace.pollution;

  constructor(init: BuildingInit) {
    super(init);
  }

  protected override pickRecipe(item: ItemId): RecipeDef | null {
    for (const r of this.game.registries.recipes.all()) {
      if (r.madeIn.includes(FURNACE_ID) && r.inputs[item] && this.game.research.isUnlocked(r.requiresResearch)) return r;
    }
    return null;
  }

  protected override onIdle(): void {
    if (this.isIdleEmpty()) this.recipe = null; // wieder frei für ein anderes Rezept
  }

  protected override idleText(): string {
    return 'Leerlauf – wartet auf Erz, Platten oder Stein';
  }

  /** Optik: siehe art/furnaceArt.ts (nur Zeichnen, keine Logik) */
  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const working = this.progress !== null && this.lastPower > 0;
    const led = this.blockedTicks > 0 ? 'stop' : working ? 'run' : 'wait';
    drawFurnace(ctx, this, time, { heat: working ? 1 : this.progress !== null ? 0.4 : 0, led, accent: this.def.tags.includes('eco') ? 'eco' : 'orange' });
  }
}

export const FURNACE_DEF: BuildingDef = {
  id: FURNACE_ID,
  name: 'Ofen',
  description: 'Schmilzt Erz zu Platten, Platten zu Stahl und brennt Stein zu Beton. Verschmutzt die Umgebung.',
  size: { w: 1, h: 1 },
  cost: { stone: 5 },
  maxHp: 120,
  color: '#7a3b2a',
  tags: ['pollutes'],
  rotatable: true,
  create: (init) => new Furnace(init),
};
