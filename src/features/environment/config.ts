// Zentrale Balancing-Werte des Moduls environment. Zum Feintunen nur hier drehen.
// Bezugsgrößen aus factory: Ofen 0,5 · Abbaumaschine 0,3 · Kohlekraftwerk 3 Verschmutzung pro Sekunde.

export const ENV_CONFIG = {
  simulation: {
    /** Alle so viele Ticks läuft ein Simulationsschritt (6× pro Sekunde) */
    stepTicks: 10,
    /** Anteil, der pro Schritt an jeden der 4 Nachbarn fließt (stabil < 0,25) */
    diffusion: 0.1,
    /** Abbau pro Schritt (0,0005 · 6/s ≈ 0,3 %/s → Halbwertszeit ca. 4 min) */
    decay: 0.0005,
    /** Zusätzlicher Abbau pro Schritt auf Wald-Kacheln (Bäume filtern) */
    forestAbsorb: 0.002,
    /** Werte darunter werden auf 0 gesetzt */
    epsilon: 1e-4,
  },
  overlay: {
    /** Verschmutzung, bei der der Smog ca. 63 % seiner maximalen Deckkraft hat */
    scale: 0.6,
    maxAlpha: 0.65,
  },
  monsters: {
    /** Unter dieser Gesamtverschmutzung spawnen keine Monster */
    spawnThreshold: 300,
    /** Monster pro Minute je Verschmutzungs-Einheit über der Schwelle */
    spawnPerMinutePerPollution: 1 / 400,
    /** Höchstens so viele Monster gleichzeitig */
    maxAlive: 150,
    /** Spawn-Kachel: Verschmutzung in diesem Bereich (= Rand der verschmutzten Zone) */
    edgeMin: 0.05,
    edgeMax: 0.6,
    /** Mindestabstand der Spawn-Kachel zum Wrack und zu Gebäuden */
    minDistWreck: 20,
    minDistBuilding: 4,
    /** Wegkosten: freie Kachel 1, Gebäude (wird angegriffen statt umgangen) */
    buildingCost: 10,
    /** Wegkosten für Verteidigungsgebäude (Mauern): Monster laufen lieber außen herum */
    defenseCost: 40,
    /** Flow-Field höchstens alle so viele Ticks neu berechnen */
    fieldRecalcTicks: 30,
    /** Sekunden ohne Spawn, nach denen ein neuer Angriff gemeldet wird */
    waveNoticeGap: 45,
  },
  climate: {
    /** Klima-Schritt einmal pro Sekunde, um diese Ticks versetzt zur Verschmutzung */
    tickOffset: 5,
    /** Erderwärmung: bis zu +globalWarming °C überall, abhängig von der Gesamtverschmutzung */
    globalWarming: 4,
    globalWarmingScale: 8000,
    /** Wärmeinsel: bis zu +heatIsland °C bei lokaler Verschmutzung */
    heatIsland: 12,
    heatIslandScale: 6,
    /** Smog-Winter: extremer Smog (über smogWinterStart) schluckt das Sonnenlicht */
    smogWinterStart: 15,
    smogWinter: 35,
    smogWinterScale: 15,
    /** Nuklearer Winter durch Strahlung */
    nuclearWinter: 20,
    nuclearWinterScale: 30,
    /** Annäherung an die Zieltemperatur pro Sekunde (Anteil) */
    temperatureRelax: 0.1,
    temperatureDiffusion: 0.1,
    /** Strahlung: Ausbreitung und (sehr langsamer) Zerfall pro Sekunde */
    radiationDiffusion: 0.05,
    radiationDecay: 0.0002,
    /** Bodenfeuchte: Erholung Richtung Ausgangswert pro Sekunde (Anteil) */
    waterRecovery: 0.003,
    /** Austrocknung pro Sekunde und °C über waterHeatStart */
    waterHeatStart: 30,
    waterHeatDry: 0.0004,
    /** Austrocknung pro Sekunde und Verschmutzungs-Einheit (max. 20) */
    waterPollutionDry: 0.0002,
  },
  terrain: {
    /** Pro Sekunde wird 1/scanParts der Karte auf Terrain-Änderungen geprüft */
    scanParts: 8,
    toxicRadiation: 5,
    iceTemperature: 0,
    wastelandPollution: 12,
    deadPollution: 6,
    deadWater: 0.1,
    dryWater: 0.3,
    dryTemperature: 35,
    dryPollution: 2,
    /** Ausgetrocknete Seen: Wasser-Kachel wird zu Sand, wenn so viele Land-Nachbarn trockener sind als lakeDryWater */
    lakeDryNeighbors: 3,
    lakeDryWater: 0.05,
  },
  defense: {
    wall: { cost: { stone: 5 }, maxHp: 1200 },
    turret: {
      cost: { iron_plate: 10, gear: 5, copper_plate: 5 },
      maxHp: 350,
      /** Reichweite in Kacheln */
      range: 8,
      damage: 12,
      /** Ticks zwischen zwei Schüssen */
      cooldownTicks: 30,
      /** Strombedarf beim Schießen / im Leerlauf (kW) */
      kw: 40,
      idleKw: 5,
      /** Munition: Schuss pro Item */
      ammoPerItem: { iron_plate: 10, steel: 25 } as Record<string, number>,
      startAmmo: 30,
      maxAmmo: 200,
    },
    forceField: {
      cost: { circuit: 20, steel: 20 },
      maxHp: 600,
      radius: 10,
      kw: 600,
      /** Schaden pro Sekunde an Monstern am Rand der Kuppel */
      zapDps: 30,
      /** Aufheizung: bis zu +heat °C Zieltemperatur im Umkreis radius × heatRange */
      heat: 18,
      heatRange: 1.6,
    },
  },
  waves: {
    /** Abstand zwischen zwei Angriffswellen in Sekunden */
    intervalSeconds: 240,
    /** Erste Welle frühestens nach so vielen Sekunden über der Spawn-Schwelle */
    firstDelaySeconds: 180,
    warningSeconds: 20,
    /** Größe: base + (Σ − Schwelle) / perPollution + perWave × Wellennummer, höchstens max */
    base: 3,
    perPollution: 150,
    perWave: 1,
    max: 40,
    /** Spawn-Entfernung zum Wrack */
    distance: 34,
  },
};
