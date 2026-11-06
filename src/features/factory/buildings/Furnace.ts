// Ofen: wählt anhand des ersten angenommenen Items ein Rezept (madeIn: factory:furnace),
// verarbeitet es und gibt das Ergebnis nach vorne aus. Verschmutzt, solange er arbeitet.
import { type BuildingDef, type BuildingInit, type ItemId, type RecipeDef } from '../../../core';
import { FURNACE_ID } from '../recipes';
import { RecipeMachine } from './RecipeMachine';

export class Furnace extends RecipeMachine {
  protected override pollutionPerSecond = 0.5;

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
