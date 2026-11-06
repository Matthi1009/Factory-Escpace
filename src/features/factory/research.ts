// Zusätzliche Forschungs-Bedingungen. `requiresResearch` kennt nur EINE Forschung pro Gebäude/Rezept;
// wer außerdem Beton braucht, prüft die Betonbau-Forschung hier über canPlace.
import type { Game } from '../../core';

/** canPlace-Prüfung für Gebäude, die Beton als Baumaterial brauchen. */
export function needsConcreteResearch(game: Game): true | string {
  return game.research.isUnlocked('concrete') || 'Erst „Betonbau“ erforschen';
}
