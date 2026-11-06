// Crafting-Menü (C): Handcrafting-Rezepte (madeIn enthält 'hand'), Warteschlange mit Fortschritt.
// Zweiter Reiter „Alle Rezepte“ zeigt zur Information auch Maschinen-Rezepte.
import type { Game, RecipeDef } from '../../core';
import { cap, el, itemIcon, itemName, rafThrottle } from './dom';
import type { ToastFn } from './toasts';
import { Panel } from './windows';

interface Row {
  recipe: RecipeDef;
  root: HTMLDivElement;
  btn: HTMLButtonElement | null;
  reason: HTMLDivElement;
  ins: { id: string; need: number; node: HTMLElement }[];
}

export function createCrafting(game: Game, toast: ToastFn): Panel {
  let mode: 'hand' | 'all' = 'hand';
  let rows: Row[] = [];
  let fills: HTMLElement[] = [];

  const tabs = el('div', 'fe-ui-tabs');
  const queueBox = el('div', 'fe-ui-queue');
  const list = el('div');
  const tabHand = el('button', 'fe-ui-tab', 'Handwerk');
  const tabAll = el('button', 'fe-ui-tab', 'Alle Rezepte');
  tabs.append(tabHand, tabAll);

  const placeName = (id: string) => (id === 'hand' ? 'Von Hand' : (game.registries.buildings.get(id)?.name ?? id));
  const researchName = (id: string) => game.registries.research.get(id)?.name ?? id;

  const rebuildRows = () => {
    const recipes = game.registries.recipes.all().filter((r) => mode === 'all' || r.madeIn.includes('hand'));
    list.replaceChildren();
    rows = [];
    // nach Kategorie gruppieren, Reihenfolge der Registrierung bleibt erhalten
    const groups = new Map<string, RecipeDef[]>();
    for (const r of recipes) {
      const key = r.category ?? 'Sonstiges';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
    if (recipes.length === 0) list.appendChild(el('div', 'fe-ui-empty', 'Keine Rezepte registriert.'));
    for (const [cat, rs] of groups) {
      list.appendChild(el('div', 'fe-ui-sect', cap(cat)));
      for (const r of rs) list.appendChild(buildRow(r));
    }
    update();
  };

  const buildRow = (r: RecipeDef): HTMLElement => {
    const root = el('div', 'fe-ui-recipe');
    const out = el('div', 'out');
    const outEntries = Object.entries(r.outputs);
    for (const [id] of outEntries) out.append(itemIcon(id, 22));
    out.appendChild(el('span', '', r.name ?? outEntries.map(([id, n]) => `${n > 1 ? n + '× ' : ''}${itemName(game, id)}`).join(', ')));
    const insBox = el('div', 'ins');
    const ins: Row['ins'] = [];
    for (const [id, need] of Object.entries(r.inputs)) {
      const node = el('span', 'in');
      node.append(itemIcon(id, 14), el('span', '', `${need}× ${itemName(game, id)}`));
      insBox.appendChild(node);
      ins.push({ id, need, node });
    }
    const meta = el('div', 'meta', `${r.time} s`);
    const reason = el('div', 'fe-ui-reason');
    let btn: HTMLButtonElement | null = null;
    const right = el('div');
    right.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:2px';
    if (r.madeIn.includes('hand')) {
      btn = el('button', 'fe-ui-btn', 'Herstellen');
      btn.addEventListener('click', () => {
        if (!game.handCraft(r.id)) toast(game.crafting.check(r.id) ?? 'Herstellen nicht möglich', 'warn');
      });
      right.append(btn, reason);
    } else {
      meta.textContent = `${r.time} s · ${r.madeIn.map(placeName).join(', ')}`;
      right.append(reason);
    }
    root.append(out, insBox, meta, right);
    rows.push({ recipe: r, root, btn, reason, ins });
    return root;
  };

  /** Zustände aktualisieren, ohne die Zeilen neu zu bauen (Klicks gehen so nie verloren). */
  const update = () => {
    for (const row of rows) {
      const r = row.recipe;
      for (const i of row.ins) i.node.classList.toggle('lack', game.inventory.count(i.id) < i.need);
      let reason = '';
      if (row.btn) {
        const check = game.crafting.check(r.id);
        row.btn.disabled = check !== null;
        reason = check ?? '';
        if (check === 'Noch nicht erforscht' && r.requiresResearch) reason = `Erst „${researchName(r.requiresResearch)}“ erforschen`;
      } else if (r.requiresResearch && !game.research.isUnlocked(r.requiresResearch)) {
        reason = `Erst „${researchName(r.requiresResearch)}“ erforschen`;
      }
      row.reason.textContent = reason;
      row.root.classList.toggle('blocked', reason !== '');
    }
    // Warteschlange
    queueBox.replaceChildren();
    fills = [];
    const q = game.crafting.queue;
    if (q.length) {
      queueBox.appendChild(el('div', 'fe-ui-sect', 'In Arbeit'));
      q.forEach((job, idx) => {
        const row = el('div', 'fe-ui-job');
        const fill = el('div', 'fill');
        fill.style.width = idx === 0 ? `${Math.round(game.crafting.progress * 100)}%` : '0';
        if (idx === 0) fills.push(fill);
        row.append(fill, el('span', '', job.recipe.name ?? job.recipe.id));
        queueBox.appendChild(row);
      });
    }
  };

  const setMode = (m: 'hand' | 'all') => {
    mode = m;
    tabHand.classList.toggle('on', m === 'hand');
    tabAll.classList.toggle('on', m === 'all');
    rebuildRows();
  };
  tabHand.addEventListener('click', () => setMode('hand'));
  tabAll.addEventListener('click', () => setMode('all'));

  const panel: Panel = new Panel(game.uiRoot, {
    title: 'Crafting',
    keyHint: 'C',
    width: 560,
    onShow: () => setMode(mode),
  });
  panel.body.append(tabs, queueBox, list);

  const updateSoon = rafThrottle(() => {
    if (panel.isOpen) update();
  });
  for (const ev of ['inventoryChanged', 'craftQueued', 'craftFinished'] as const) game.events.on(ev, updateSoon);
  game.events.on('researchUnlocked', updateSoon);
  game.registries.recipes.onRegister(() => {
    if (panel.isOpen) rebuildRows();
  });
  // Fortschrittsbalken des laufenden Auftrags
  window.setInterval(() => {
    if (panel.isOpen && fills[0]) fills[0].style.width = `${Math.round(game.crafting.progress * 100)}%`;
  }, 100);

  game.input.onKey('KeyC', () => panel.toggle());
  return panel;
}
