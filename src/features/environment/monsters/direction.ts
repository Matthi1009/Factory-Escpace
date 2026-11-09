// Himmelsrichtung eines Winkels für Meldungen (x nach rechts, y nach unten).
const DIRECTIONS = ['Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten', 'Norden', 'Nordosten'];

export function directionName(angle: number): string {
  const k = Math.round(((angle % (Math.PI * 2)) + Math.PI * 2) / (Math.PI / 4)) % 8;
  return DIRECTIONS[k]!;
}
