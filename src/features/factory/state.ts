// Gemeinsamer Laufzeit-Zustand des Moduls (pro Spielinstanz).
import type { Game } from '../../core';
import type { Belt } from './buildings/Belt';
import type { Datacenter } from './buildings/Datacenter';
import type { RopewayStation } from './buildings/RopewayStation';
import { BALANCE } from './balance';

interface FactoryState {
  belts: Set<Belt>;
  datacenters: Set<Datacenter>;
  stations: Set<RopewayStation>;
  aiTick: number;
  aiValue: number;
}

const states = new WeakMap<Game, FactoryState>();

function state(game: Game): FactoryState {
  let s = states.get(game);
  if (!s) states.set(game, (s = { belts: new Set(), datacenters: new Set(), stations: new Set(), aiTick: -1, aiValue: 1 }));
  return s;
}

/** Alle platzierten Bänder (für den Zeichen-Hook, ohne jedes Frame die Weltliste zu filtern). */
export function beltSet(game: Game): Set<Belt> {
  return state(game).belts;
}

export function datacenterSet(game: Game): Set<Datacenter> {
  return state(game).datacenters;
}

export function stationSet(game: Game): Set<RopewayStation> {
  return state(game).stations;
}

/**
 * KI-Automatisierung: Geschwindigkeitsfaktor aller Maschinen (≥ 1).
 * Gilt nur, wenn `ai_automation` erforscht ist; jedes laufende Rechenzentrum gibt einen Bonus.
 */
export function aiFactor(game: Game): number {
  const s = state(game);
  if (s.aiTick === game.tickCount) return s.aiValue;
  let value = 1;
  if (game.research.isUnlocked('ai_automation')) {
    let running = 0;
    for (const d of s.datacenters) if (d.running) running++;
    value = 1 + BALANCE.ai.boostPerCenter * Math.min(BALANCE.ai.maxCenters, running);
  }
  s.aiTick = game.tickCount;
  s.aiValue = value;
  return value;
}
