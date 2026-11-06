// Hauptmenü (Startbildschirm), Pausemenü (M) und Hilfe/Tastenübersicht (H).
import type { Game } from '../../core';
import { el } from './dom';
import { Panel } from './windows';

const KEYS: [string, string][] = [
  ['W A S D / Pfeile', 'Kamera bewegen (Shift = schneller)'],
  ['Mausrad', 'Zoom zum Mauszeiger'],
  ['Mittlere Maustaste ziehen', 'Kamera verschieben'],
  ['Linksklick', 'Bauen (Ziehen = mehrere) · Erz von Hand abbauen · Gebäude anklicken für Infos'],
  ['Rechtsklick', 'Abreißen (Kosten zurück), Ziehen = mehrere'],
  ['1 – 9', 'Gebäude der Bauleiste wählen'],
  ['Q', 'Pipette: Gebäudetyp unter der Maus wählen'],
  ['R / Shift+R', 'Drehen (Auswahl oder Gebäude unter der Maus)'],
  ['E', 'Inventar'],
  ['C', 'Crafting-Menü'],
  ['T', 'Forschung'],
  ['Tab', 'Umwelt- und SDG-Übersicht'],
  ['K', 'Aktionen (PR-Kampagne, Börse …)'],
  ['N', 'Minimap ein-/ausblenden'],
  ['M', 'Menü'],
  ['H', 'Diese Hilfe'],
  ['P', 'Pause'],
  ['Esc', 'Auswahl aufheben, Fenster schließen'],
  ['F1', 'Debugpanel (Entwicklung)'],
];

export interface MenuApi {
  menu: Panel;
  help: Panel;
}

export function createMenus(game: Game): MenuApi {
  // ----- Hilfe
  const help: Panel = new Panel(game.uiRoot, { title: 'Hilfe', keyHint: 'H', width: 560 });
  const intro = el('div', 'fe-ui-help');
  intro.appendChild(el('p', '', 'Ihr Raumschiff ist abgestürzt. Bauen Sie Abbaumaschinen, Förderbänder und Fabriken, erforschen Sie neue Technik und bauen Sie Raketenteile, um den Planeten zu verlassen.'));
  intro.appendChild(el('p', '', 'Je mehr Sie die Umwelt zerstören, desto mehr Geld gibt es – aber die Verschmutzung lässt Tiere zu Monstern mutieren. Wird das Wrack zerstört, ist das Spiel vorbei.'));
  const table = el('table', 'fe-ui-keys');
  for (const [k, d] of KEYS) {
    const tr = el('tr');
    const td1 = el('td');
    td1.appendChild(el('kbd', '', k));
    tr.append(td1, el('td', '', d));
    table.appendChild(tr);
  }
  help.body.append(intro, table);

  // ----- Pausemenü: pausiert das Spiel, solange es offen ist
  let pausedByMenu = false;
  const menu: Panel = new Panel(game.uiRoot, {
    title: 'Menü',
    keyHint: 'M',
    width: 290,
    onShow: () => {
      if (!game.paused && !game.over) {
        game.setPaused(true);
        pausedByMenu = true;
      }
    },
    onHide: () => {
      if (pausedByMenu && !game.over) game.setPaused(false);
      pausedByMenu = false;
    },
  });
  const box = el('div', 'fe-ui-menu');
  const button = (label: string, onClick: () => void, secondary = false) => {
    const b = el('button', `fe-ui-btn${secondary ? ' sec' : ''}`, label);
    b.addEventListener('click', onClick);
    box.appendChild(b);
    return b;
  };
  button('Weiterspielen', () => menu.hide());
  button('Hilfe & Tasten', () => help.show(), true);
  button('Neue Karte', () => {
    const url = new URL(location.href);
    url.searchParams.set('seed', String(Math.floor(Math.random() * 1_000_000)));
    location.href = url.toString();
  }, true);
  button('Neustart (gleiche Karte)', () => location.reload(), true);
  menu.body.appendChild(box);

  game.input.onKey('KeyM', () => menu.toggle());
  game.input.onKey('KeyH', () => help.toggle());
  return { menu, help };
}

/** Startbildschirm: pausiert, bis der Spieler „Los geht's“ drückt. */
export function showStartScreen(game: Game, help: Panel): void {
  game.setPaused(true);
  const overlay = el('div', 'fe-ui-overlay');
  const box = el('div', 'box');
  box.appendChild(el('h1', '', 'Factory Escape'));
  box.appendChild(el('p', 'sub', 'Abgestürzt auf einem fremden Planeten. Bauen Sie Fabriken, zerstören Sie die Umwelt (die Bilanz dankt) und hauen Sie ab.'));
  const start = el('button', 'fe-ui-btn', 'Los geht\'s');
  start.addEventListener('click', () => {
    overlay.remove();
    game.setPaused(false);
  });
  const h = el('button', 'fe-ui-btn', 'Hilfe & Tasten');
  h.style.cssText = 'margin-left:8px;background:#2a3444;border-color:#46566e';
  h.addEventListener('click', () => {
    help.show();
    help.el.style.zIndex = '980'; // über dem Startbildschirm
  });
  box.append(start, h);
  overlay.appendChild(box);
  game.uiRoot.appendChild(overlay);
}
