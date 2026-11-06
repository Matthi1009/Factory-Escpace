// Rezepte des Moduls factory (M1: Platten, Zahnrad, Beton).
// madeIn mit 'hand' → erscheint im Crafting-Menü der UI; Gebäude-IDs → Maschine kann es herstellen.
import type { Game, RecipeDef } from '../../core';

export const FURNACE_ID = 'factory:furnace';
export const ASSEMBLER_ID = 'factory:assembler';

export const RECIPES: RecipeDef[] = [
  {
    id: 'factory:iron_plate',
    name: 'Eisenplatte',
    inputs: { iron_ore: 1 },
    outputs: { iron_plate: 1 },
    time: 1.6,
    madeIn: ['hand', FURNACE_ID],
    category: 'smelting',
  },
  {
    id: 'factory:copper_plate',
    name: 'Kupferplatte',
    inputs: { copper_ore: 1 },
    outputs: { copper_plate: 1 },
    time: 1.6,
    madeIn: ['hand', FURNACE_ID],
    category: 'smelting',
  },
  {
    id: 'factory:gear',
    name: 'Zahnrad',
    inputs: { iron_plate: 2 },
    outputs: { gear: 1 },
    time: 0.5,
    madeIn: ['hand', ASSEMBLER_ID],
    category: 'intermediate',
  },
  {
    // M1-Näherung: Stein → Beton direkt im Ofen (kein eigenes Vorstufen-Item im Core)
    id: 'factory:concrete',
    name: 'Beton',
    inputs: { stone: 2 },
    outputs: { concrete: 1 },
    time: 2.4,
    madeIn: ['hand', FURNACE_ID],
    requiresResearch: 'concrete',
    category: 'smelting',
  },
  {
    // Nebenprodukt Müll geht seitlich aus der Maschine (Müllkippe oder Entsorgung)
    id: 'factory:steel',
    name: 'Stahl',
    inputs: { iron_plate: 5 },
    outputs: { steel: 1, waste: 1 },
    time: 8,
    madeIn: [FURNACE_ID],
    requiresResearch: 'steel',
    category: 'smelting',
  },
  {
    id: 'factory:circuit',
    name: 'Schaltkreis',
    inputs: { iron_plate: 1, copper_plate: 2 },
    outputs: { circuit: 1, waste: 1 },
    time: 1.6,
    madeIn: [ASSEMBLER_ID],
    requiresResearch: 'electronics',
    category: 'intermediate',
  },
  {
    id: 'factory:uranium_fuel',
    name: 'Uran-Brennstab',
    inputs: { uranium_ore: 3, steel: 1 },
    outputs: { uranium_fuel: 1 },
    time: 12,
    madeIn: [ASSEMBLER_ID],
    requiresResearch: 'nuclear',
    category: 'nuclear',
  },
  {
    // Ziel des Spiels: Raketenteile. Viel Müll als Preis (siehe docs/GAME_DESIGN.md: Satire)
    id: 'factory:rocket_part',
    name: 'Raketenteil',
    inputs: { steel: 5, circuit: 5, concrete: 10, uranium_fuel: 1 },
    outputs: { rocket_part: 1, waste: 3 },
    time: 30,
    madeIn: [ASSEMBLER_ID],
    requiresResearch: 'rocket',
    category: 'rocket',
  },
];

export function registerRecipes(game: Game): void {
  for (const r of RECIPES) game.registries.recipes.register(r);
}
