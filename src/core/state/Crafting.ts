// Handcrafting-Warteschlange. game.handCraft(recipeId) zieht die Zutaten sofort ab;
// nach recipe.time Sekunden landen die Produkte im Inventar.
import type { Game } from '../Game';
import type { RecipeDef } from '../defs';

export interface CraftJob {
  recipe: RecipeDef;
  /** verbleibende Ticks */
  remaining: number;
  total: number;
}

export class HandCrafting {
  readonly queue: CraftJob[] = [];

  constructor(private game: Game) {}

  /** Warum (nicht) craftbar? null = ok, sonst Grund. */
  check(recipeId: string): string | null {
    const r = this.game.registries.recipes.get(recipeId);
    if (!r) return `Unbekanntes Rezept '${recipeId}'`;
    if (!r.madeIn.includes('hand')) return 'Nicht von Hand herstellbar';
    if (!this.game.research.isUnlocked(r.requiresResearch)) return 'Noch nicht erforscht';
    if (!this.game.inventory.hasAll(r.inputs)) return 'Zutaten fehlen';
    return null;
  }

  craft(recipeId: string): boolean {
    if (this.check(recipeId) !== null) return false;
    const r = this.game.registries.recipes.require(recipeId);
    this.game.inventory.removeAll(r.inputs);
    const ticks = Math.max(1, Math.round(r.time * 60));
    this.queue.push({ recipe: r, remaining: ticks, total: ticks });
    this.game.events.emit('craftQueued', { recipeId });
    return true;
  }

  /** Fortschritt des vordersten Auftrags 0..1 (0 wenn leer). */
  get progress(): number {
    const j = this.queue[0];
    return j ? 1 - j.remaining / j.total : 0;
  }

  /** @internal Vom Core pro Tick aufgerufen. */
  _tick(): void {
    const job = this.queue[0];
    if (!job) return;
    if (--job.remaining > 0) return;
    this.queue.shift();
    this.game.inventory.addAll(job.recipe.outputs);
    this.game.events.emit('craftFinished', { recipeId: job.recipe.id });
  }
}
