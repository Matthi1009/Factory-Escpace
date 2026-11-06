// Gemeinsamer Laufzeit-Zustand des Moduls (pro Spielinstanz).
import type { Game } from '../../core';
import type { Belt } from './buildings/Belt';

const belts = new WeakMap<Game, Set<Belt>>();

/** Alle platzierten Bänder (für den Zeichen-Hook, ohne jedes Frame die Weltliste zu filtern). */
export function beltSet(game: Game): Set<Belt> {
  let s = belts.get(game);
  if (!s) belts.set(game, (s = new Set()));
  return s;
}
