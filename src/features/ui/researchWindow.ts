// Forschungsfenster (T): Baum aus registries.research (Spalten nach Tiefe), Kosten, Voraussetzungen, Status.
// Start über game.research.request(id); Fortschritt aus research.current/progress (setzt progression).
import type { Game, ResearchDef } from '../../core';
import { el, fmt, itemIcon, itemName } from './dom';
import type { ToastFn } from './toasts';
import { Panel } from './windows';

interface Card {
  def: ResearchDef;
  root: HTMLDivElement;
  badge: HTMLSpanElement;
  btn: HTMLButtonElement;
  bar: HTMLElement;
  barBox: HTMLElement;
  costNodes: { kind: 'item' | 'money'; id: string; need: number; node: HTMLElement }[];
}

export function createResearchWindow(game: Game, toast: ToastFn): Panel {
  let cards: Card[] = [];
  const tree = el('div', 'fe-ui-tree');

  const name = (id: string) => game.registries.research.get(id)?.name ?? id;

  /** Tiefe im Baum: ohne Voraussetzung 0, sonst 1 + höchste Tiefe der Voraussetzungen (Zyklen werden abgefangen). */
  const depthOf = (def: ResearchDef, seen = new Set<string>()): number => {
    if (seen.has(def.id)) return 0;
    seen.add(def.id);
    let d = 0;
    for (const rid of def.requires) {
      const r = game.registries.research.get(rid);
      if (r) d = Math.max(d, 1 + depthOf(r, new Set(seen)));
    }
    return d;
  };

  const rebuild = () => {
    tree.replaceChildren();
    cards = [];
    const defs = game.registries.research.all();
    const cols = new Map<number, ResearchDef[]>();
    for (const d of defs) {
      const k = depthOf(d);
      if (!cols.has(k)) cols.set(k, []);
      cols.get(k)!.push(d);
    }
    // Ohne Voraussetzungen (alles in einer Spalte) als Raster anzeigen
    const flat = cols.size === 1;
    for (const k of [...cols.keys()].sort((a, b) => a - b)) {
      const col = el('div', flat ? 'fe-ui-col flat' : 'fe-ui-col');
      col.appendChild(el('div', 'hd', k === 0 ? 'Grundlagen' : `Stufe ${k + 1}`));
      for (const d of cols.get(k)!) col.appendChild(buildCard(d));
      tree.appendChild(col);
    }
    if (defs.length === 0) tree.appendChild(el('div', 'fe-ui-empty', 'Keine Forschung registriert.'));
    update();
  };

  const buildCard = (def: ResearchDef): HTMLElement => {
    const root = el('div', 'fe-ui-rcard');
    const badge = el('span', 'badge');
    root.append(badge, el('h5', '', def.name));
    if (def.description) root.appendChild(el('p', '', def.description));
    const cost = el('div', 'cost');
    const costNodes: Card['costNodes'] = [];
    for (const [id, need] of Object.entries(def.cost)) {
      const node = el('span');
      node.style.cssText = 'display:inline-flex;align-items:center;gap:3px';
      node.append(itemIcon(id, 14), el('span', '', `${need}× ${itemName(game, id)}`));
      cost.appendChild(node);
      costNodes.push({ kind: 'item', id, need, node });
    }
    if (def.money) {
      const node = el('span', '', `${fmt(def.money)} €`);
      cost.appendChild(node);
      costNodes.push({ kind: 'money', id: 'money', need: def.money, node });
    }
    if (costNodes.length === 0) cost.appendChild(el('span', '', 'Kosten noch nicht festgelegt'));
    if (def.time) cost.appendChild(el('span', '', `${def.time} s`));
    root.appendChild(cost);
    if (def.requires.length) root.appendChild(el('div', 'req', `Voraussetzung: ${def.requires.map(name).join(', ')}`));
    const btn = el('button', 'fe-ui-btn', 'Erforschen');
    btn.addEventListener('click', () => {
      if (!game.research.request(def.id)) toast(`„${def.name}“ konnte nicht gestartet werden (Kosten oder Voraussetzungen?).`, 'warn');
      update();
    });
    const bar = el('i');
    const barBox = el('div', 'fe-ui-bar');
    barBox.appendChild(bar);
    barBox.style.display = 'none';
    root.append(btn, barBox);
    const card: Card = { def, root, badge, btn, bar, barBox, costNodes };
    cards.push(card);
    return root;
  };

  const update = () => {
    for (const c of cards) {
      const done = game.research.isUnlocked(c.def.id);
      const current = !done && game.research.current === c.def.id;
      const missing = c.def.requires.filter((r) => !game.research.isUnlocked(r));
      const locked = !done && missing.length > 0;
      c.root.classList.toggle('done', done);
      c.root.classList.toggle('current', current);
      c.root.classList.toggle('locked', locked);
      c.badge.textContent = done ? '✓ erforscht' : current ? 'läuft …' : locked ? '🔒' : '';
      c.btn.style.display = done ? 'none' : '';
      c.btn.disabled = current || locked;
      c.btn.textContent = current ? 'Forschung läuft' : locked ? 'Gesperrt' : 'Erforschen';
      c.btn.title = locked ? `Zuerst erforschen: ${missing.map(name).join(', ')}` : '';
      for (const n of c.costNodes) {
        const have = n.kind === 'money' ? game.economy.money : game.inventory.count(n.id);
        n.node.classList.toggle('lack', !done && have < n.need);
      }
      c.barBox.style.display = current ? '' : 'none';
      if (current) c.bar.style.width = `${Math.round(game.research.progress * 100)}%`;
    }
  };

  const panel: Panel = new Panel(game.uiRoot, {
    title: 'Forschung',
    keyHint: 'T',
    width: 760,
    onShow: rebuild,
  });
  panel.body.appendChild(tree);

  const updateIfOpen = () => {
    if (panel.isOpen) update();
  };
  game.events.on('researchUnlocked', updateIfOpen);
  game.events.on('inventoryChanged', updateIfOpen);
  game.events.on('moneyChanged', updateIfOpen);
  window.setInterval(updateIfOpen, 250); // Fortschrittsbalken
  game.input.onKey('KeyT', () => panel.toggle());
  return panel;
}
