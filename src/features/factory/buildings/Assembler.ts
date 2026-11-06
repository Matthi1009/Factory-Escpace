// Montagemaschine: Rezept frei wählbar (Linksklick → Auswahldialog), braucht Strom.
import { drawItem, type BuildingDef, type BuildingInit, type ItemId, type RecipeDef } from '../../../core';
import { ASSEMBLER_ID } from '../recipes';
import { RecipeMachine } from './RecipeMachine';

export class Assembler extends RecipeMachine {
  protected override powerKw = 75;

  constructor(init: BuildingInit) {
    super(init);
  }

  /** Rezepte, die diese Maschine herstellen kann und die schon erforscht sind. */
  availableRecipes(): RecipeDef[] {
    return this.game.registries.recipes.all().filter((r) => r.madeIn.includes(ASSEMBLER_ID) && this.game.research.isUnlocked(r.requiresResearch));
  }

  get currentRecipe(): RecipeDef | null {
    return this.recipe;
  }

  /** Wechselt das Rezept (null = keins). Inhalt geht ins Spieler-Inventar. */
  setRecipe(recipeId: string | null): void {
    const r = recipeId ? (this.availableRecipes().find((x) => x.id === recipeId) ?? null) : null;
    if (recipeId && !r) return;
    this.flushToInventory();
    this.recipe = r;
  }

  protected override pickRecipe(_item: ItemId): RecipeDef | null {
    return this.recipe; // Rezept ist fest gewählt
  }

  protected override idleText(): string {
    return 'Kein Rezept gewählt – Linksklick zum Auswählen';
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = '#3e5a7a';
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.strokeStyle = '#1f2f42';
    ctx.lineWidth = 0.05;
    ctx.strokeRect(-0.45, -0.45, 0.9, 0.9);
    // Anzeigefenster
    ctx.fillStyle = '#16212e';
    ctx.fillRect(-0.28, -0.22, 0.56, 0.5);
    const out = this.recipe ? Object.keys(this.recipe.outputs).find((i) => i !== 'waste' && i !== 'nuclear_waste') : undefined;
    if (out) drawItem(ctx, out, 0, 0.03, 0.34);
    // Betriebsleuchte
    const working = this.progress !== null && this.lastPower > 0;
    ctx.fillStyle = working ? `hsl(${120 + 20 * Math.sin(time * 6)},80%,55%)` : this.progress !== null ? '#d9534f' : '#555';
    ctx.beginPath();
    ctx.arc(0.32, 0.34, 0.07, 0, Math.PI * 2);
    ctx.fill();
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

export const ASSEMBLER_DEF: BuildingDef = {
  id: ASSEMBLER_ID,
  name: 'Montagemaschine',
  description: 'Stellt Zwischenprodukte her. Rezept per Linksklick wählen. Braucht Strom (75 kW).',
  size: { w: 1, h: 1 },
  cost: { iron_plate: 9, gear: 5 },
  requiresResearch: 'automation',
  maxHp: 120,
  color: '#3e5a7a',
  tags: ['power_consumer'],
  rotatable: true,
  create: (init) => new Assembler(init),
};
