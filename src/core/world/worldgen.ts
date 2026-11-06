// Prozedurale Weltgenerierung, reproduzierbar per Seed.
// Nahe dem Spawn liegt garantiert je ein Feld Eisen, Kupfer, Kohle, Stein und Granit; Uran etwas weiter weg.
import { RESOURCES, type ResourceId } from '../content/resources';
import { TERRAIN_INDEX } from '../content/terrain';
import { createRng, fbm } from '../random';
import type { World } from './World';

const SPAWN_CLEAR_RADIUS = 30; // kein Wasser in diesem Radius um den Spawn

export function generateWorld(world: World): void {
  const seed = world.seed;
  const rng = createRng(seed);
  const { width, height, spawn } = world;

  // 1) Terrain aus mehreren Noise-Schichten
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = world.index(x, y);
      const distSpawn = Math.hypot(x - spawn.x, y - spawn.y);
      const water = fbm(seed + 1, x / 28, y / 28);
      const veg = fbm(seed + 2, x / 18, y / 18);
      const rock = fbm(seed + 3, x / 22, y / 22);
      const waterLevel = distSpawn < SPAWN_CLEAR_RADIUS ? -1 : 0.32;
      let t: number = TERRAIN_INDEX.grass;
      if (water < waterLevel) t = TERRAIN_INDEX.water;
      else if (water < waterLevel + 0.03) t = TERRAIN_INDEX.sand;
      else if (rock > 0.68) t = TERRAIN_INDEX.rock;
      else if (veg > 0.62) t = TERRAIN_INDEX.forest;
      world.terrain[i] = t;
    }

  // 2) Start-Erzfelder rund um den Spawn
  const starter: ResourceId[] = ['iron_ore', 'copper_ore', 'coal', 'stone', 'granite'];
  const startAngle = rng() * Math.PI * 2;
  starter.forEach((res, k) => {
    const a = startAngle + (k / starter.length) * Math.PI * 2;
    const d = 12 + rng() * 6;
    placePatch(world, res, spawn.x + Math.cos(a) * d, spawn.y + Math.sin(a) * d, 4 + rng() * 1.2, rng);
  });
  // Uran: eines garantiert in mittlerer Entfernung
  {
    const a = rng() * Math.PI * 2;
    const d = 45 + rng() * 15;
    placePatch(world, 'uranium_ore', spawn.x + Math.cos(a) * d, spawn.y + Math.sin(a) * d, 3.5, rng);
  }

  // 3) Weitere Felder über die ganze Karte
  const counts: Record<ResourceId, number> = {
    iron_ore: 14,
    copper_ore: 12,
    coal: 12,
    stone: 10,
    granite: 8,
    uranium_ore: 5,
  };
  for (const def of RESOURCES) {
    for (let n = 0; n < counts[def.id]; n++) {
      for (let tries = 0; tries < 30; tries++) {
        const x = 6 + rng() * (width - 12);
        const y = 6 + rng() * (height - 12);
        if (Math.hypot(x - spawn.x, y - spawn.y) < 35) continue;
        placePatch(world, def.id, x, y, 3 + rng() * 5, rng);
        break;
      }
    }
  }
}

/** Ein unregelmäßiges, rundliches Erzfeld. Wasser und das Wrack-Gebiet werden ausgelassen. */
function placePatch(world: World, res: ResourceId, cx: number, cy: number, r: number, rng: () => number): void {
  const noiseSeed = Math.floor(rng() * 1e9);
  const { spawn } = world;
  world.forEachInRadius(cx, cy, r + 2, (x, y, d) => {
    const edge = r * (0.75 + 0.5 * fbm(noiseSeed, x / 4, y / 4, 2));
    if (d > edge) return;
    if (world.getTerrain(x, y) === 'water') return;
    if (Math.abs(x - spawn.x) <= 3 && Math.abs(y - spawn.y) <= 3) return;
    world.setResource(x, y, res);
  });
}
