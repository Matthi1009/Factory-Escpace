// Richtungen: N = oben (-y), E = rechts (+x), S = unten (+y), W = links (-x).

export type Direction = 0 | 1 | 2 | 3;

export const Dir = { N: 0, E: 1, S: 2, W: 3 } as const;

export const DIRECTIONS: readonly Direction[] = [0, 1, 2, 3];

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
const NAMES = ['N', 'E', 'S', 'W'];

/** Einheitsvektor einer Richtung. */
export function dirVec(d: Direction): { dx: number; dy: number } {
  return { dx: DX[d]!, dy: DY[d]! };
}
export function opposite(d: Direction): Direction {
  return ((d + 2) % 4) as Direction;
}
export function rotateCW(d: Direction): Direction {
  return ((d + 1) % 4) as Direction;
}
export function rotateCCW(d: Direction): Direction {
  return ((d + 3) % 4) as Direction;
}
/** Drehwinkel in Radiant für ctx.rotate (N = 0, im Uhrzeigersinn). */
export function dirAngle(d: Direction): number {
  return (d * Math.PI) / 2;
}
export function dirName(d: Direction): string {
  return NAMES[d]!;
}
