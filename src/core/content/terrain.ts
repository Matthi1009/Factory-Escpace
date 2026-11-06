// Terrain-Typen. Die Reihenfolge ist der Index im World.terrain-Array – nur hinten anhängen!
// environment verändert Terrain zur Laufzeit (world.setTerrain) und ruft danach renderer.invalidateGround().

export interface TerrainDef {
  id: string;
  name: string;
  /** Grundfarbe im Boden-Rendering */
  color: string;
  /** Darf man hier bauen? */
  buildable: boolean;
}

export const TERRAINS = [
  { id: 'grass', name: 'Gras', color: '#4f7d3a', buildable: true },
  { id: 'forest', name: 'Wald', color: '#2f5d2a', buildable: true },
  { id: 'sand', name: 'Sand', color: '#c8b27a', buildable: true },
  { id: 'rock', name: 'Fels', color: '#6f6a62', buildable: true },
  { id: 'water', name: 'Wasser', color: '#2e5f8a', buildable: false },
  { id: 'dry', name: 'Ausgetrocknet', color: '#a39361', buildable: true },
  { id: 'dead', name: 'Abgestorben', color: '#6b5d45', buildable: true },
  { id: 'wasteland', name: 'Ödland', color: '#5a4e48', buildable: true },
  { id: 'ice', name: 'Eis', color: '#cfe3ec', buildable: true },
  { id: 'toxic', name: 'Verseucht', color: '#6f8a2a', buildable: true },
] as const satisfies readonly TerrainDef[];

export type TerrainId = (typeof TERRAINS)[number]['id'];

export const TERRAIN_INDEX: Record<TerrainId, number> = Object.fromEntries(
  TERRAINS.map((t, i) => [t.id, i]),
) as Record<TerrainId, number>;
