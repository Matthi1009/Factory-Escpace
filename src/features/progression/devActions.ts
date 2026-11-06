// Test-Aktionen für das F1-Debugpanel (nur im Dev-Modus), damit progression ohne ui-Modul testbar ist.
// Je Forschung ein Knopf „Forschen: …“ plus ein Status-Knopf. Kategorie 'debug' – die ui kann sie ausblenden.
import type { Game } from '../../core';
import type { Demonstrations } from './demonstrations';
import { STAT_INCOME } from './economy';
import { STAT_SDG_TOTAL } from './sdg';
import { formatMoney, researchError } from './research';

/** Teile des Moduls, die die Test-Aktionen steuern */
export interface DevContext {
  demos: Demonstrations;
}

export function registerDevActions(game: Game, dev: DevContext): void {
  game.events.on('ready', () => {
    game.registries.actions.register({
      id: 'progression:debug_demo',
      name: 'Demonstration starten',
      description: 'Vor einem zufälligen verschmutzenden Gebäude (sonst vor irgendeinem)',
      category: 'debug',
      run: (g) => {
        const all = g.world.allBuildings().filter((b) => b !== g.wreck && !dev.demos.demos.has(b));
        const polluting = all.filter((b) => b.def.tags.includes('pollutes'));
        const pool = polluting.length ? polluting : all;
        if (!pool.length) return g.notify('Kein Gebäude für eine Demonstration da – erst etwas bauen.', 'warn');
        dev.demos.start(pool[Math.floor(Math.random() * pool.length)]!);
      },
    });
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
