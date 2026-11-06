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
    scale: 1.5,
    maxAlpha: 0.6,
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
    /** Flow-Field höchstens alle so viele Ticks neu berechnen */
    fieldRecalcTicks: 30,
    /** Sekunden ohne Spawn, nach denen ein neuer Angriff gemeldet wird */
    waveNoticeGap: 45,
  },
};
