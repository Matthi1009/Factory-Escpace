// Ressourcen-Vorkommen auf der Karte. Die Ressourcen-ID ist gleichzeitig die Item-ID,
// die man beim Abbau bekommt. Vorkommen sind unendlich.
import type { CoreItemId } from './items';

export interface ResourceDef {
  id: CoreItemId;
  name: string;
  /** Farbe der Erz-Flecken auf dem Boden */
  color: string;
}

export const RESOURCES = [
  { id: 'iron_ore', name: 'Eisenvorkommen', color: '#9db3cf' },
  { id: 'copper_ore', name: 'Kupfervorkommen', color: '#e0803b' },
  { id: 'coal', name: 'Kohlevorkommen', color: '#161616' },
  { id: 'stone', name: 'Steinvorkommen', color: '#d8c9a5' },
  { id: 'granite', name: 'Granitvorkommen', color: '#c09aa5' },
  { id: 'uranium_ore', name: 'Uranvorkommen', color: '#72ff52' },
] as const satisfies readonly ResourceDef[];

export type ResourceId = (typeof RESOURCES)[number]['id'];
