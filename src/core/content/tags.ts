// Erlaubte Gebäude-Tags. Damit erkennen Module Gebäude anderer Module, ohne deren IDs zu kennen.
// Beispiel: progression findet alle Atomreaktoren über game.world.buildingsWithTag('reactor').
// Neue Tags nur per core-request.

export const BUILDING_TAGS = [
  'pollutes', // verursacht Verschmutzung
  'reactor', // Atomreaktor (Kernschmelze-Finale)
  'datacenter', // KI-Rechenzentrum (Wasserverbrauch)
  'power_producer', // erzeugt Strom
  'power_consumer', // verbraucht Strom
  'defense', // Mauern, Türme, Kraftfeld
  'waste_disposal', // entsorgt Müll
  'eco', // umweltfreundliche Variante
  'storage', // Lager / Kiste
] as const;

export type BuildingTag = (typeof BUILDING_TAGS)[number];
