// Game-Over-/Sieg-Screen (gameOver) mit kleiner Bilanz und Neustart.
import type { Game } from '../../core';
import { el, fmt } from './dom';
import { closeAllPanels } from './windows';

export function createGameOver(game: Game): void {
  game.events.on('gameOver', ({ won, reason }) => {
    closeAllPanels();
    const overlay = el('div', `fe-ui-overlay ${won ? 'win' : 'lose'}`);
    const box = el('div', 'box');
    box.appendChild(el('h1', '', won ? 'Geschafft – Sie sind raus!' : 'Das war\'s.'));
    box.appendChild(el('p', 'sub', reason));
    box.appendChild(
      el(
        'p',
        'sub',
        won ? 'Der Planet bleibt zurück – ein wenig ärmer, aber Ihr Kontostand dankt es Ihnen.' : 'Immerhin: Die Umwelt hat sich nicht beschwert. Zumindest nicht lange.',
      ),
    );
    const sum = el('div', 'sum');
    const stat = (label: string, value: string) => {
      const d = el('div');
      d.append(el('b', '', value), document.createTextNode(label));
      return d;
    };
    const minutes = Math.floor(game.time / 60);
    sum.append(stat('Spielzeit', `${minutes} min ${Math.floor(game.time % 60)} s`), stat('Geld', `${fmt(Math.round(game.economy.money))} €`), stat('Verschmutzung', fmt(Math.round(game.env.total('pollution')))));
    box.appendChild(sum);
    const btn = el('button', 'fe-ui-btn', 'Neustart');
    btn.addEventListener('click', () => location.reload());
    box.appendChild(btn);
    overlay.appendChild(box);
    game.uiRoot.appendChild(overlay);
  });
}
