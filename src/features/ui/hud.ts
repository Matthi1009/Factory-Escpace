// HUD oben: Geld, Gesamt-Verschmutzung, Pause-Hinweis.
import type { Game } from '../../core';
import { el, fmt } from './dom';

/** Wie oft die Verschmutzung aktualisiert wird (4× pro Sekunde) */
const POLLUTION_INTERVAL_MS = 250;
const POLLUTION_HIGH = 500;
const POLLUTION_EXTREME = 5000;

function chip(cls: string, label: string): { root: HTMLDivElement; val: HTMLSpanElement } {
  const root = el('div', `fe-ui-chip ${cls}`);
  root.appendChild(el('span', 'lbl', label));
  const val = el('span', 'val', '–');
  root.appendChild(val);
  return { root, val };
}

function flash(node: HTMLElement, up: boolean): void {
  node.classList.remove('flash-up', 'flash-down');
  void node.offsetWidth; // Animation neu starten
  node.classList.add(up ? 'flash-up' : 'flash-down');
}

export function createHud(game: Game): void {
  const bar = el('div', 'fe-ui-hud');
  const money = chip('money', 'Geld');
  const pollution = chip('pollution', 'Verschmutzung');
  const pause = el('div', 'fe-ui-chip pause', 'PAUSE');
  pause.style.display = 'none';
  bar.append(money.root, pollution.root, pause);
  game.uiRoot.appendChild(bar);

  const setMoney = (m: number) => {
    money.val.textContent = `${fmt(Math.round(m))} €`;
    money.root.classList.toggle('neg', m < 0);
  };
  setMoney(game.economy.money);
  game.events.on('moneyChanged', ({ money: m, delta, reason }) => {
    setMoney(m);
    money.root.title = reason ? `${delta > 0 ? '+' : ''}${fmt(Math.round(delta))} € (${reason})` : '';
    flash(money.root, delta > 0);
  });

  const updatePollution = () => {
    const total = game.env.total('pollution');
    pollution.val.textContent = fmt(Math.round(total));
    pollution.root.classList.toggle('high', total >= POLLUTION_HIGH && total < POLLUTION_EXTREME);
    pollution.root.classList.toggle('extreme', total >= POLLUTION_EXTREME);
  };
  updatePollution();
  window.setInterval(updatePollution, POLLUTION_INTERVAL_MS);

  const setPause = (p: boolean) => (pause.style.display = p ? '' : 'none');
  setPause(game.paused);
  game.events.on('pauseChanged', ({ paused }) => setPause(paused));
}
