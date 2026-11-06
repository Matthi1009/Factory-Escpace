// Gemeinsame Kleinigkeiten der factory-Zeichenfunktionen.
import type { Building, Game } from '../../../core';
import { dirAngle } from '../../../core';

/** Gebäude, wie die Zeichenfunktionen es brauchen (BaseBuilding passt). */
export interface ArtBuilding extends Building {
  readonly game: Game;
}

/** Punkt im lokalen (mit der Gebäuderichtung gedrehten) Raum → Weltkoordinaten. */
export function localToWorld(b: Building, lx: number, ly: number): { x: number; y: number } {
  const a = b.def.rotatable !== false ? dirAngle(b.dir) : 0;
  const c = b.center();
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return { x: c.x + lx * cos - ly * sin, y: c.y + lx * sin + ly * cos };
}

/** Pseudo-zufälliger, pro Gebäude fester Wert 0..1 (damit nicht alle Maschinen im Gleichtakt flackern). */
export function seedOf(b: Building): number {
  return (Math.sin(b.uid * 12.9898) * 43758.5453) % 1 > 0 ? ((Math.sin(b.uid * 12.9898) * 43758.5453) % 1) : 1 + ((Math.sin(b.uid * 12.9898) * 43758.5453) % 1);
}
