// Generische Registry mit Duplikat-Prüfung.
// Regel: Alles, was ein Modul registriert, bekommt das Präfix '<modul>:' (z. B. 'factory:belt').
// Nur zentrale Einträge aus src/core/content/ haben kein Präfix.

const ID_RE = /^[a-z0-9_]+(:[a-z0-9_]+)?$/;

export class Registry<T extends { id: string }> {
  private map = new Map<string, T>();
  private listeners = new Set<(def: T) => void>();

  constructor(readonly kind: string) {}

  /** Registriert einen Eintrag. Wirft einen Fehler, wenn die ID schon existiert. */
  register(def: T, opts: { central?: boolean } = {}): T {
    if (!ID_RE.test(def.id)) {
      throw new Error(`[${this.kind}] Ungültige ID '${def.id}' (erlaubt: a-z, 0-9, _ und ein ':')`);
    }
    if (this.map.has(def.id)) {
      throw new Error(`[${this.kind}] ID '${def.id}' ist bereits registriert`);
    }
    if (!opts.central && !def.id.includes(':')) {
      console.warn(`[${this.kind}] ID '${def.id}' hat kein Modul-Präfix (erwartet z. B. 'factory:${def.id}')`);
    }
    this.map.set(def.id, def);
    for (const fn of this.listeners) fn(def);
    return def;
  }

  get(id: string): T | undefined {
    return this.map.get(id);
  }

  /** Wie get, wirft aber einen Fehler, wenn die ID fehlt. */
  require(id: string): T {
    const def = this.map.get(id);
    if (!def) throw new Error(`[${this.kind}] Unbekannte ID '${id}'`);
    return def;
  }

  has(id: string): boolean {
    return this.map.has(id);
  }

  /** Alle Einträge in Registrierungs-Reihenfolge. */
  all(): T[] {
    return [...this.map.values()];
  }

  get size(): number {
    return this.map.size;
  }

  /**
   * Ergänzt Felder eines vorhandenen Eintrags. Gedacht für zentrale Einträge,
   * z. B. progression setzt Kosten der zentralen Forschung.
   */
  update(id: string, patch: Partial<Omit<T, 'id'>>): T {
    const def = this.require(id);
    Object.assign(def, patch);
    return def;
  }

  /** Wird bei jeder neuen Registrierung aufgerufen. Rückgabe: Abmelde-Funktion. */
  onRegister(fn: (def: T) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
