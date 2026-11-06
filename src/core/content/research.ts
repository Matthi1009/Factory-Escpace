// Zentrale Forschungs-IDs (nur ID, Name, Kurzbeschreibung).
// Der Core registriert sie mit leeren Kosten. progression ergänzt Kosten und Abhängigkeiten
// über game.registries.research.update(id, { cost, requires }).
// Andere Module verweisen darauf, z. B. BuildingDef.requiresResearch = 'nuclear'.

export const CORE_RESEARCH = [
  { id: 'automation', name: 'Automatisierung', description: 'Abbaumaschinen und Montagemaschinen' },
  { id: 'logistics', name: 'Logistik', description: 'Schnellere Bänder und Greifarme' },
  { id: 'steel', name: 'Stahlverarbeitung', description: 'Stahl aus Eisen' },
  { id: 'electronics', name: 'Elektronik', description: 'Schaltkreise' },
  { id: 'concrete', name: 'Betonbau', description: 'Beton aus Stein und Granit' },
  { id: 'power_coal', name: 'Kohlekraft', description: 'Kohlekraftwerke und Stromnetz' },
  { id: 'waste_management', name: 'Müllentsorgung', description: 'Teure, aber saubere Entsorgung' },
  { id: 'eco_tech', name: 'Öko-Technik', description: 'Umweltfreundliche (teure, ineffiziente) Maschinen' },
  { id: 'nuclear', name: 'Kernkraft', description: 'Uranverarbeitung und Atomkraftwerk' },
  { id: 'ai_datacenter', name: 'KI-Rechenzentrum', description: 'Verbraucht sehr viel Wasser' },
  { id: 'ai_automation', name: 'KI-Automatisierung', description: 'Fabrik optimiert sich selbst' },
  { id: 'defense_walls', name: 'Mauern', description: 'Mauern gegen Monster' },
  { id: 'turrets', name: 'Geschütztürme', description: 'Automatische Verteidigung' },
  { id: 'force_field', name: 'Kraftfeld', description: 'Schützt die Basis, heizt die Region auf' },
  { id: 'ropeway', name: 'Seilbahn', description: 'Transport über weite Strecken' },
  { id: 'rocket', name: 'Raketenbau', description: 'Raketenteile – der Weg nach Hause' },
] as const;

export type CoreResearchId = (typeof CORE_RESEARCH)[number]['id'];
