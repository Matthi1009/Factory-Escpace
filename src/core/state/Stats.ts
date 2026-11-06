// Allgemeine Kennzahlen, die ein Modul veröffentlicht und die UI generisch anzeigen kann,
// ohne das Modul zu kennen. Beispiel: progression setzt 'progression:sdg_score'.

export interface StatDef {
  id: string;
  label: string;
  /** Einheit für die Anzeige, z. B. '%' oder '°C' */
  unit?: string;
  /** Freie Gruppierung, z. B. 'sdg', 'environment' */
  group?: string;
}

export class Stats {
  private defs = new Map<string, StatDef>();
  private values = new Map<string, number>();

  /** Kennzahl anlegen (einmalig, Duplikate werden ignoriert). */
  define(def: StatDef): void {
    if (!this.defs.has(def.id)) this.defs.set(def.id, def);
  }

  set(id: string, value: number): void {
    this.values.set(id, value);
  }

  get(id: string): number | undefined {
    return this.values.get(id);
  }

  all(): (StatDef & { value: number | undefined })[] {
    return [...this.defs.values()].map((d) => ({ ...d, value: this.values.get(d.id) }));
  }
}
