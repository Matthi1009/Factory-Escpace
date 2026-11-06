// Gemeinsamer Laufzeit-Zustand des Moduls (pro Spielinstanz).
import type { Game } from '../../core';
import type { Belt } from './buildings/Belt';
import type { Datacenter } from './buildings/Datacenter';
import type { RopewayStation } from './buildings/RopewayStation';
import { BALANCE } from './balance';

interface FactoryState {
  fuelWarnTick: number;
  fuelWarnPending: number;
  fuelWarnLast: { x: number; y: number; name: string };
  belts: Set<Belt>;
  datacenters: Set<Datacenter>;
  stations: Set<RopewayStation>;
  aiTick: number;
  aiValue: number;
}

const states = new WeakMap<Game, FactoryState>();

function state(game: Game): FactoryState {
  let s = states.get(game);
  if (!s) states.set(game, (s = { belts: new Set(), datacenters: new Set(), stations: new Set(), aiTick: -1, aiValue: 1, fuelWarnTick: -Infinity, fuelWarnPending: 0, fuelWarnLast: { x: 0, y: 0, name: '' } }));
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

/** Cooldown zwischen zwei Brennstoff-Meldungen (Ticks): 30 s */
const FUEL_WARN_COOLDOWN = 30 * 60;

/** Eine kohlebetriebene Maschine steht ohne Brennstoff still. Die Meldung wird gesammelt (siehe flushFuelWarnings). */
export function reportNoFuel(game: Game, x: number, y: number, name: string): void {
  const s = state(game);
  s.fuelWarnPending++;
  s.fuelWarnLast = { x, y, name };
}

/**
 * Gibt gesammelte „Maschine ohne Kohle“-Meldungen aus, höchstens alle 30 s und zusammengefasst, damit der Spieler
 * nicht stumm Produktion verliert, aber auch nicht mit Meldungen überschüttet wird. Läuft einmal pro Sekunde.
 */
export function flushFuelWarnings(game: Game): void {
  const s = state(game);
  if (s.fuelWarnPending === 0 || game.tickCount - s.fuelWarnTick < FUEL_WARN_COOLDOWN) return;
  const n = s.fuelWarnPending;
  const { x, y, name } = s.fuelWarnLast;
  s.fuelWarnPending = 0;
  s.fuelWarnTick = game.tickCount;
  game.notify(
    n === 1 ? `${name} (${x}|${y}) hat keine Kohle – Linksklick mit Kohle im Inventar füllt nach.` : `${n} Abbaumaschinen ohne Kohle (zuletzt ${x}|${y}) – Linksklick mit Kohle im Inventar füllt nach.`,
    'warn',
  );
}
