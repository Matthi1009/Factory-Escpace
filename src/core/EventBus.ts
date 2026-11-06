// Typisierter EventBus. Alle modulübergreifenden Events stehen in GameEvents.
// Modul-interne Events kann ein Modul per Declaration Merging in seinem eigenen Ordner ergänzen:
//   declare module '../../core/EventBus' { interface GameEvents { 'factory:beltJam': { x: number } } }
import type { Building } from './buildings/Building';
import type { ItemId } from './defs';

export type NotifyLevel = 'info' | 'warn' | 'error' | 'success';

export interface GameEvents {
  /** Alle Module registriert, Welt + Wrack existieren, Loop startet gleich. */
  ready: {};
  buildingPlaced: { building: Building; byPlayer: boolean };
  /** Abgerissen (Spieler oder Code), nicht zerstört. */
  buildingRemoved: { building: Building; byPlayer: boolean };
  /** Durch Schaden zerstört (hp ≤ 0). */
  buildingDestroyed: { building: Building };
  buildingDamaged: { building: Building; amount: number };
  buildingRotated: { building: Building };
  buildingBlocked: { building: Building; ticks: number; reason?: string };
  buildingUnblocked: { building: Building };
  /** Linksklick ohne Auswahl auf ein Gebäude (z. B. für Gebäude-Fenster oder Demonstrationen). */
  buildingClicked: { building: Building; button: number };
  inventoryChanged: { item: ItemId; count: number; delta: number };
  moneyChanged: { money: number; delta: number; reason?: string };
  researchUnlocked: { id: string };
  /** Ausgewählter Gebäudetyp zum Bauen (null = nichts). */
  selectionChanged: { defId: string | null };
  craftQueued: { recipeId: string };
  craftFinished: { recipeId: string };
  handMined: { item: ItemId; x: number; y: number };
  pauseChanged: { paused: boolean };
  /** Meldung an den Spieler; die UI zeigt sie an. */
  notify: { text: string; level: NotifyLevel };
  gameOver: { won: boolean; reason: string };
}

type Handler<P> = (payload: P) => void;

export class EventBus<E extends object = GameEvents> {
  private handlers = new Map<keyof E, Set<Handler<any>>>();

  /** Registriert einen Handler. Rückgabe: Funktion zum Abmelden. */
  on<K extends keyof E>(name: K, fn: Handler<E[K]>): () => void {
    let set = this.handlers.get(name);
    if (!set) this.handlers.set(name, (set = new Set()));
    set.add(fn);
    return () => this.off(name, fn);
  }

  once<K extends keyof E>(name: K, fn: Handler<E[K]>): () => void {
    const off = this.on(name, (p) => {
      off();
      fn(p);
    });
    return off;
  }

  off<K extends keyof E>(name: K, fn: Handler<E[K]>): void {
    this.handlers.get(name)?.delete(fn);
  }

  /** Feuert ein Event. Ein Fehler in einem Handler bricht die anderen nicht ab. */
  emit<K extends keyof E>(name: K, payload: E[K]): void {
    const set = this.handlers.get(name);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[EventBus] Fehler im Handler für '${String(name)}':`, err);
      }
    }
  }
}
