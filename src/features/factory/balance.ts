// Zentrale Balancing-Werte des Moduls factory. Zum Feintunen nur hier drehen.
// Einheiten: Strom in kW, Zeit in Sekunden (Ticks wo genannt), Verschmutzung pro Sekunde.

export const BALANCE = {
  belt: {
    /** Fortschritt pro Tick (0..1 pro Kachel): 0,03 · 60 = 1,8 Kacheln/s */
    speed: 0.03,
    /** Mindestabstand zwischen zwei Items */
    gap: 0.25,
  },
  inserter: {
    /** Ticks pro Schwung (Quelle → Ziel) → ca. 2 Items/s */
    swingTicks: 15,
  },
  miner: {
    /** Mk1 (Kohle): Ticks pro Erz → 0,5 Erz/s */
    mk1Ticks: 120,
    /** Mk1: so viele Erze reicht 1 Kohle */
    orePerCoal: 8,
    mk1CoalCapacity: 5,
    mk1Pollution: 0.3,
    /** Mk2 (Strom): Ticks pro Erz → 1 Erz/s */
    mk2Ticks: 60,
    mk2Kw: 90,
    buffer: 3,
  },
  furnace: {
    pollution: 0.5,
    /** Öko-Ofen: langsamer, fast sauber */
    ecoSpeed: 0.6,
    ecoPollution: 0.1,
  },
  assembler: {
    kw: 75,
  },
  coalPlant: {
    kw: 900,
    /** Mindest-Auslastung im Leerlauf: das Kraftwerk liefert immer Leistung (Netz existiert), verbrennt aber nur so viel, wie gebraucht wird */
    idleLoad: 0.1,
    /** Sekunden, die 1 Kohle bei voller Auslastung brennt */
    burnSeconds: 20,
    coalCapacity: 10,
    pollution: 3,
  },
  solarPlant: {
    /** Spitzenleistung bei Mittag; nachts bleibt nur der Sockel */
    peakKw: 250,
    baseFraction: 0.25,
    /** Länge eines Tages in Sekunden */
    daySeconds: 300,
  },
  nuclearPlant: {
    kw: 4000,
    idleLoad: 0.1,
    /** Sekunden, die 1 Brennstab bei voller Auslastung brennt */
    burnSeconds: 120,
    fuelCapacity: 3,
    /** Ein voller Müllspeicher lässt den Reaktor abschalten */
    wasteCapacity: 3,
    /** kleine Dauerstrahlung der Anlage selbst */
    radiation: 0.02,
  },
  datacenter: {
    kw: 1500,
    /** Wasserentzug pro Sekunde und Kachel im Radius */
    waterPerSecond: 0.02,
    radius: 6,
    /** Mindest-Stromversorgung, damit es als „läuft“ gilt */
    minSatisfaction: 0.5,
  },
  /** KI-Automatisierung: Geschwindigkeitsbonus pro laufendem Rechenzentrum (max. maxCenters) */
  ai: {
    boostPerCenter: 0.25,
    maxCenters: 2,
  },
  ropeway: {
    /** maximale Länge zwischen zwei Stationen in Kacheln */
    range: 60,
    /** Gondelgeschwindigkeit in Kacheln pro Sekunde */
    speed: 6,
    /** Items, die gleichzeitig pro Richtung unterwegs sein dürfen */
    capacity: 20,
  },
  waste: {
    /** Müll, der in einer Maschine liegen bleiben darf, bevor sie stoppt */
    machineCap: 4,
    dumpPollution: 2,
    dumpRadiation: 5,
    disposalCost: { waste: 5, nuclear_waste: 40 } as Record<string, number>,
  },
} as const;
