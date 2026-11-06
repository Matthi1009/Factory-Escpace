// Aktionen-Menü (K): alle registrierten Aktionen (registries.actions), gruppiert nach category.
import type { ActionDef, Game } from '../../core';
import { cap, el } from './dom';
import { Panel } from './windows';

interface Row {
  def: ActionDef;
  root: HTMLDivElement;
  btn: HTMLButtonElement;
}

export function createActionsMenu(game: Game): Panel {
  let rows: Row[] = [];
  const list = el('div');

  const rebuild = () => {
    list.replaceChildren();
    rows = [];
    const all = game.registries.actions.all();
    if (all.length === 0) {
      list.appendChild(el('div', 'fe-ui-empty', 'Keine Aktionen verfügbar. (PR-Kampagnen und Börsengeschäfte kommen von progression.)'));
      return;
    }
    const groups = new Map<string, ActionDef[]>();
    for (const a of all) {
      const key = a.category ?? 'Sonstiges';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    }
    for (const [cat, defs] of groups) {
      list.appendChild(el('div', 'fe-ui-sect', cap(cat)));
      for (const def of defs) {
        const root = el('div', 'fe-ui-action');
        const tx = el('div', 'tx');
        tx.appendChild(el('b', '', def.name));
        if (def.description) tx.appendChild(el('span', '', def.description));
        const btn = el('button', 'fe-ui-btn', 'Ausführen');
        btn.addEventListener('click', () => {
          def.run(game);
          update();
        });
        root.append(tx, btn);
        list.appendChild(root);
        rows.push({ def, root, btn });
      }
    }
    update();
  };

  const update = () => {
    for (const r of rows) {
      const ok = r.def.isAvailable ? r.def.isAvailable(game) : true;
      r.btn.disabled = !ok;
      r.root.classList.toggle('off', !ok);
    }
  };

  const panel: Panel = new Panel(game.uiRoot, { title: 'Aktionen', keyHint: 'K', width: 460, onShow: rebuild });
  panel.body.appendChild(list);
  game.registries.actions.onRegister(() => {
    if (panel.isOpen) rebuild();
  });
  window.setInterval(() => {
    if (panel.isOpen) update();
  }, 250);
  game.input.onKey('KeyK', () => panel.toggle());
  return panel;
}
