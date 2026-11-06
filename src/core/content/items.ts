// Zentrale Item-IDs. Diese IDs haben KEIN Modul-Präfix und dürfen von allen Modulen benutzt werden.
// Der Core registriert sie beim Start. Neue zentrale Items nur per core-request.
import type { ItemDef } from '../defs';

export const CORE_ITEMS = [
  // Rohstoffe
  { id: 'iron_ore', name: 'Eisenerz', color: '#7f93ab', shape: 'circle' },
  { id: 'copper_ore', name: 'Kupfererz', color: '#d0773a', shape: 'circle' },
  { id: 'coal', name: 'Kohle', color: '#2b2b2b', shape: 'circle' },
  { id: 'stone', name: 'Stein', color: '#b9a888', shape: 'circle' },
  { id: 'granite', name: 'Granit', color: '#a3868e', shape: 'circle' },
  { id: 'uranium_ore', name: 'Uranerz', color: '#5fe04a', shape: 'diamond' },
  // Zwischenprodukte
  { id: 'iron_plate', name: 'Eisenplatte', color: '#c4ccd6', shape: 'square' },
  { id: 'copper_plate', name: 'Kupferplatte', color: '#e8955a', shape: 'square' },
  { id: 'steel', name: 'Stahl', color: '#8d98a6', shape: 'square' },
  { id: 'gear', name: 'Zahnrad', color: '#9aa3ad', shape: 'circle' },
  { id: 'circuit', name: 'Schaltkreis', color: '#3fae4f', shape: 'square' },
  { id: 'concrete', name: 'Beton', color: '#9e9e98', shape: 'square' },
  { id: 'uranium_fuel', name: 'Uran-Brennstab', color: '#b6ff3d', shape: 'triangle' },
  // Abfall
  { id: 'nuclear_waste', name: 'Atommüll', color: '#e7e125', shape: 'diamond' },
  { id: 'waste', name: 'Müll', color: '#6b5a3e', shape: 'triangle' },
  // Ziel
  { id: 'rocket_part', name: 'Raketenteil', color: '#f2f2f2', shape: 'triangle' },
] as const satisfies readonly ItemDef[];

export type CoreItemId = (typeof CORE_ITEMS)[number]['id'];
