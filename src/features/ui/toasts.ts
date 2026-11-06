// Meldungen (notify) als kurz sichtbare Toasts.
import type { Game, NotifyLevel } from '../../core';
import { el } from './dom';

const MAX_VISIBLE = 5;
const LIFETIME_MS = 5000;

export type ToastFn = (text: string, level?: NotifyLevel) => void;

export function createToasts(game: Game): ToastFn {
  const box = el('div', 'fe-ui-toasts');
  game.uiRoot.appendChild(box);

  const show: ToastFn = (text, level = 'info') => {
    const t = el('div', `fe-ui-toast ${level}`, text);
    box.appendChild(t);
    while (box.children.length > MAX_VISIBLE) box.firstElementChild?.remove();
    window.setTimeout(() => {
      t.classList.add('out');
      window.setTimeout(() => t.remove(), 450);
    }, LIFETIME_MS);
  };

  game.events.on('notify', ({ text, level }) => show(text, level));
  return show;
}
