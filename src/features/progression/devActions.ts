// Test-Aktionen für das F1-Debugpanel (nur im Dev-Modus), damit progression ohne ui-Modul testbar ist.
// Je Forschung ein Knopf „Forschen: …“ plus ein Status-Knopf. Kategorie 'debug' – die ui kann sie ausblenden.
import type { Game } from '../../core';
import { STAT_INCOME, STAT_SDG_TOTAL } from './economy';
import { formatMoney, researchError } from './research';

export function registerDevActions(game: Game): void {
  game.events.on('ready', () => {
    game.registries.actions.register({
      id: 'progression:debug_status',
      name: 'Progression-Status melden',
      category: 'debug',
      run: (g) => {
        const cur = g.research.current;
        const curName = cur ? `${g.registries.research.get(cur)?.name ?? cur} (${Math.round(g.research.progress * 100)} %)` : 'keine';
        g.notify(
          `Forschung: ${curName} · erforscht: ${g.research.unlockedIds().length}/${g.registries.research.size} · ` +
            `Geld: ${formatMoney(g.economy.money)} · Einnahmen: ${g.stats.get(STAT_INCOME)} €/s · SDG-Verfehlung: ${g.stats.get(STAT_SDG_TOTAL)} %`,
          'info',
        );
      },
    });
    for (const def of game.registries.research.all()) {
      game.registries.actions.register({
        id: `progression:research_${def.id.replace(':', '_')}`,
        name: `Forschen: ${def.name}`,
        category: 'debug',
        run: (g) => g.research.request(def.id),
        isAvailable: (g) => researchError(g, def.id) === null,
      });
    }
  });
}
