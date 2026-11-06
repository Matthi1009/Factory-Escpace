// Zentrale Balancing-Werte des Moduls progression. Zum Feintunen nur hier drehen.
// Bezugsgrößen: factory Ofen 0,5 · Kohlekraftwerk 3 Verschmutzung/s; environment baut ≈ 0,3 %/s ab.

export const PROGRESSION_CONFIG = {
  economy: {
    /** Grundeinkommen in €/s (auch ohne Verschmutzung) */
    baseIncome: 1,
    /** Zusätzliche €/s pro Verschmutzungs-Einheit (Summe über die ganze Karte) */
    pollutionIncome: 0.02,
    /** Multiplikator = 1 + SDG-Verfehlung(%) / multiplierDivisor → bei 100 % Verfehlung ×3 */
    multiplierDivisor: 50,
  },
  sdg: {
    /** Skalen: bei diesem Wert ist das Ziel zu ~63 % verfehlt (1 − 1/e) */
    climatePollution: 2000, // Σ Verschmutzung
    climateTemperature: 3, // mittlere Abweichung von 20 °C
    waterDeficit: 150, // Σ verlorene Bodenfeuchte gegenüber Spielstart
    radiation: 100, // Σ Strahlung
    smogTiles: 1500, // Kacheln mit Verschmutzung > smogTileMin
    smogTileMin: 0.5,
  },
  demonstrations: {
    /** Alle so viele Sekunden wird gewürfelt */
    checkSeconds: 30,
    /** Erst ab dieser SDG-Verfehlung (%) wird demonstriert */
    minSdg: 20,
    /** Chance pro Wurf bei 100 % SDG-Verfehlung (linear) */
    maxChance: 0.6,
    maxConcurrent: 3,
    /** Dauer einer Blockade in Sekunden */
    durationSeconds: 90,
    /** PR-Kampagne: Grundpreis € × (1 + SDG % / 50) */
    prBaseCost: 1000,
    /** Zweiter Klick auf das blockierte Gebäude innerhalb dieser Zeit bestätigt die PR-Kampagne */
    confirmSeconds: 4,
  },
  market: {
    /** Kurse ändern sich alle so viele Sekunden */
    tickSeconds: 10,
    /** Zufallsschwankung pro Kursänderung (Anteil) */
    volatility: 0.08,
    /** Rückzug zum Grundpreis pro Kursänderung (Anteil) */
    reversion: 0.1,
    /** Chance auf Crash/Boom pro Kursänderung */
    shockChance: 0.03,
    lotSize: 10,
    /** Grundpreise in € pro Stück */
    basePrices: {
      coal: 2,
      iron_plate: 4,
      copper_plate: 5,
      concrete: 8,
      gear: 9,
      steel: 18,
      circuit: 30,
      uranium_fuel: 250,
    } as Record<string, number>,
  },
  rocket: {
    partsNeeded: 10,
    countdownSeconds: 10,
  },
  meltdown: {
    /** Überhitzt, wenn am Reaktor die Temperatur darüber liegt … */
    hotTemperature: 45,
    /** … oder die Bodenfeuchte (Kühlwasser) darunter */
    lowWater: 0.15,
    /** Risiko-Anstieg pro Sekunde bei Überhitzung bzw. abgeschalteter Sicherheit (in %) */
    riskPerSecondHot: 1,
    riskPerSecondNoSafety: 2.5,
    /** Abbau pro Sekunde, wenn alles normal ist (in %) */
    riskCoolPerSecond: 0.5,
    /** Bonus in €, wenn man die Sicherheitssysteme abschaltet (Satire) */
    safetyOffBonus: 5000,
    radius: 14,
    radiation: 80,
    pollution: 40,
    toxicRadius: 8,
    /** Sekunden zwischen Explosion und Spielende */
    endDelaySeconds: 8,
  },
};
