// Forschungs-Zustand: was ist freigeschaltet? Kosten/Baum/Ablauf gehören progression.
// Die UI ruft request(id) auf ("Forschung starten"); progression setzt dafür setRequestHandler().
import type { EventBus } from '../EventBus';

export class ResearchState {
  private unlocked = new Set<string>();
  private handler: ((id: string) => boolean) | null = null;
  /** Aktuell laufende Forschung (setzt progression, die UI zeigt sie an). */
  current: string | null = null;
  /** Fortschritt der aktuellen Forschung 0..1 (setzt progression). */
  progress = 0;

  constructor(private events: EventBus) {}

  /** Ohne id (undefined/leer) immer true – praktisch für requiresResearch. */
  isUnlocked(id: string | undefined): boolean {
    return !id || this.unlocked.has(id);
  }

  unlock(id: string): void {
    if (this.unlocked.has(id)) return;
    this.unlocked.add(id);
    this.events.emit('researchUnlocked', { id });
  }

  unlockedIds(): string[] {
    return [...this.unlocked];
  }

  /** Spieler möchte id erforschen. Rückgabe des Handlers (false, wenn keiner gesetzt ist). */
  request(id: string): boolean {
    if (!this.handler) {
      console.warn(`[research] Kein Handler für request('${id}') – progression setzt ihn mit setRequestHandler()`);
      return false;
    }
    return this.handler(id);
  }

  /** progression: Legt fest, was bei request(id) passiert (Kosten prüfen, Forschung starten …). */
  setRequestHandler(fn: ((id: string) => boolean) | null): void {
    this.handler = fn;
  }
}
