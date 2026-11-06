// Farbpalette und Licht-Konstanten des Industrie-Looks (siehe docs/ART_STYLE.md). Alle Werte sind eigene Entwürfe.

export const PALETTE = {
  // Hauptakzent
  orange: '#F28C28',
  orangeLight: '#F8B462',
  orangeDark: '#B8620F',
  // Stahl
  steelDeep: '#1B1F23',
  steelDark: '#2B3036',
  steelMid: '#5A6470',
  steelLight: '#A9B2BA',
  // Warnung
  hazard: '#F2C230',
  hazardBlack: '#15171A',
  // Strom / KI
  cyan: '#3FC1D0',
  cyanLight: '#9BE8F0',
  // Hitze
  ember: '#FF6A1A',
  emberLight: '#FFD27A',
  // Umwelt
  eco: '#6BBF59',
  ecoDark: '#3F7F34',
  radiation: '#9CFF3A',
  // Monster
  monsterPurple: '#7A3FA0',
  monsterGreen: '#B4E33D',
  // Gummi (Förderband)
  rubber: '#23272C',
  rubberLight: '#343A41',
  // Status-LEDs
  ledRun: '#4CE06A',
  ledWait: '#F2C230',
  ledStop: '#FF4B3E',
  ledOff: '#3A4047',
  // Umriss
  outline: '#12151A',
} as const;

/** Lichtrichtung: von oben links. Der Schatten fällt nach unten rechts (Welt-Einheiten = Kacheln). */
export const LIGHT = { x: -0.6, y: -0.8 } as const;
export const SHADOW_OFFSET = { x: 0.07, y: 0.09 } as const;

function parse(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Hellt eine Hex-Farbe auf (amount > 0, Richtung Weiß) oder dunkelt sie ab (amount < 0, Richtung Schwarz). */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = parse(hex);
  const t = amount < 0 ? 0 : 255;
  const a = Math.abs(amount);
  const f = (c: number) => Math.round(c + (t - c) * a);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/** Mischt zwei Hex-Farben (t = 0 → a, t = 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const f = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${f(r1, r2)},${f(g1, g2)},${f(b1, b2)})`;
}

/** Hex-Farbe mit Alpha als rgba()-String. */
export function alpha(hex: string, a: number): string {
  const [r, g, b] = parse(hex);
  return `rgba(${r},${g},${b},${a})`;
}
