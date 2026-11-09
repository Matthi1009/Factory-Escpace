// Forschungsbaum: Kosten, Abhängigkeiten und Ablauf für alle zentralen Forschungs-IDs.
// Die UI startet eine Forschung mit game.research.request(id) – was dann passiert, entscheidet dieser Handler.
import { TICKS_PER_SECOND, type CoreResearchId, type Game, type ItemCounts } from '../../core';

interface ResearchEntry {
  /** Item-Kosten, werden beim Start abgezogen */
  cost: ItemCounts;
  /** Geldkosten in €, werden beim Start abgezogen */
  money?: number;
  /** Forschungsdauer in Sekunden */
  time: number;
  requires: CoreResearchId[];
}

/**
 * Der Baum. Wurzeln: automation, defense_walls.
 * Jede Forschung kostet auch Geld (Issue #13). Satire: Öko-Technik ist absichtlich am teuersten.
 */
export const RESEARCH_TREE: Record<CoreResearchId, ResearchEntry> = {
  automation: { cost: { iron_plate: 20, copper_plate: 10 }, money: 200, time: 10, requires: [] },
  defense_walls: { cost: { stone: 30, iron_plate: 10 }, money: 150, time: 10, requires: [] },
  logistics: { cost: { iron_plate: 40, gear: 10 }, money: 600, time: 20, requires: ['automation'] },
  steel: { cost: { iron_plate: 50, coal: 20 }, money: 500, time: 20, requires: ['automation'] },
  power_coal: { cost: { iron_plate: 40, copper_plate: 20, stone: 20 }, money: 800, time: 25, requires: ['automation'] },
  concrete: { cost: { stone: 50, granite: 30, steel: 10 }, money: 1000, time: 25, requires: ['steel'] },
  electronics: { cost: { copper_plate: 50, iron_plate: 30, steel: 10 }, money: 1500, time: 30, requires: ['steel'] },
  turrets: { cost: { iron_plate: 50, gear: 20, copper_plate: 20 }, money: 800, time: 25, requires: ['defense_walls'] },
  ropeway: { cost: { steel: 40, gear: 30 }, money: 2500, time: 30, requires: ['logistics'] },
  waste_management: { cost: { steel: 20, concrete: 20 }, money: 3000, time: 30, requires: ['power_coal'] },
  eco_tech: { cost: { circuit: 60, steel: 60, concrete: 40 }, money: 25000, time: 90, requires: ['power_coal'] },
  ai_datacenter: { cost: { circuit: 80, steel: 30 }, money: 6000, time: 45, requires: ['electronics'] },
  ai_automation: { cost: { circuit: 150 }, money: 12000, time: 60, requires: ['ai_datacenter'] },
  nuclear: { cost: { circuit: 50, steel: 50, concrete: 50, uranium_ore: 20 }, money: 12000, time: 60, requires: ['power_coal', 'concrete'] },
  force_field: { cost: { circuit: 60, steel: 40 }, money: 10000, time: 60, requires: ['turrets', 'power_coal'] },
  rocket: { cost: { circuit: 200, steel: 200, concrete: 100, uranium_fuel: 10 }, money: 30000, time: 120, requires: ['nuclear', 'electronics'] },
};

export function setupResearch(game: Game): void {
  for (const [id, e] of Object.entries(RESEARCH_TREE)) {
    game.registries.research.update(id, { cost: e.cost, money: e.money, time: e.time, requires: e.requires });
  }
  game.research.setRequestHandler((id) => startResearch(game, id));
  game.onTick(() => tickResearch(game));
}

/** Warum kann id gerade nicht erforscht werden? null = möglich. Gilt auch für Forschung anderer Module. */
export function researchError(game: Game, id: string): string | null {
  const def = game.registries.research.get(id);
  if (!def) return `Unbekannte Forschung '${id}'`;
  if (game.research.isUnlocked(id)) return `${def.name} ist bereits erforscht`;
  const current = game.research.current;
  if (current) {
    const name = game.registries.research.get(current)?.name ?? current;
    return current === id ? `${def.name} wird bereits erforscht` : `Es läuft schon eine Forschung: ${name}`;
  }
  const missing = def.requires.filter((r) => !game.research.isUnlocked(r));
  if (missing.length) return `Zuerst erforschen: ${missing.map((r) => researchName(game, r)).join(', ')}`;
  const lacking = Object.entries(def.cost)
    .filter(([item, n]) => game.inventory.count(item) < n)
    .map(([item, n]) => `${n - game.inventory.count(item)}× ${game.registries.items.get(item)?.name ?? item}`);
  if (lacking.length) return `Für ${def.name} fehlt: ${lacking.join(', ')}`;
  if (def.money && !game.economy.canAfford(def.money)) return `Für ${def.name} fehlen ${formatMoney(def.money - game.economy.money)}`;
  return null;
}

function startResearch(game: Game, id: string): boolean {
  const err = researchError(game, id);
  if (err) {
    game.notify(err, 'warn');
    return false;
  }
  const def = game.registries.research.require(id);
  game.inventory.removeAll(def.cost);
  if (def.money) game.economy.spend(def.money, `Forschung: ${def.name}`);
  game.research.current = id;
  game.research.progress = 0;
  game.notify(`Forschung gestartet: ${def.name}`, 'info');
  if (!def.time || def.time <= 0) finishResearch(game, id);
  return true;
}

function tickResearch(game: Game): void {
  const id = game.research.current;
  if (!id) return;
  const def = game.registries.research.get(id);
  // Abgebrochen von außen (z. B. „Alles erforschen“ im Debugpanel)
  if (!def || game.research.isUnlocked(id)) {
    game.research.current = null;
    game.research.progress = 0;
    return;
  }
  const ticks = Math.max(1, (def.time ?? 0) * TICKS_PER_SECOND);
  game.research.progress = Math.min(1, game.research.progress + 1 / ticks);
  if (game.research.progress >= 1) finishResearch(game, id);
}

function finishResearch(game: Game, id: string): void {
  game.research.current = null;
  game.research.progress = 0;
  game.research.unlock(id);
  game.notify(`Erforscht: ${researchName(game, id)}. Die Aktionäre sind begeistert.`, 'success');
}

function researchName(game: Game, id: string): string {
  return game.registries.research.get(id)?.name ?? id;
}

export function formatMoney(n: number): string {
  return `${Math.round(n).toLocaleString('de-AT')} €`;
}
