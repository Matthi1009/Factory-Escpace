// Bauleiste unten: alle nicht-versteckten Gebäude in Registrierungs-Reihenfolge.
//  - ok:     erforscht und Kosten im Inventar → normal
//  - poor:   erforscht, aber Kosten fehlen   → ausgegraut, wählbar (der Core zeigt dann die rote Vorschau)
//  - locked: Forschung fehlt                 → stark ausgegraut mit Hinweis, nicht wählbar
// Tasten 1–9 wählen die ersten neun erforschten Gebäude.
import type { BuildingDef, Game, ItemCounts } from '../../core';
import { HoverCard } from './card';
import { costText, el, itemName, rafThrottle } from './dom';
import type { ToastFn } from './toasts';

type SlotState = 'ok' | 'poor' | 'locked';

interface Slot {
  def: BuildingDef;
  root: HTMLDivElement;
  key: HTMLSpanElement;
  num: number | null;
  state: SlotState;
}

export function createToolbar(game: Game, toast: ToastFn): void {
  const bar = el('div', 'fe-ui-toolbar');
  bar.style.display = 'none'; // bis ready
  game.uiRoot.appendChild(bar);
  const card = new HoverCard(game);
  let slots: Slot[] = [];

  const researchName = (id: string) => game.registries.research.get(id)?.name ?? id;

  const missing = (cost: ItemCounts): ItemCounts => {
    const out: ItemCounts = {};
    for (const [id, n] of Object.entries(cost)) {
      const lack = n - game.inventory.count(id);
      if (lack > 0) out[id] = lack;
    }
    return out;
  };

  const stateOf = (def: BuildingDef): SlotState => {
    if (!game.research.isUnlocked(def.requiresResearch)) return 'locked';
    return Object.keys(missing(def.cost)).length > 0 ? 'poor' : 'ok';
  };

  /** Hover-Karte: Name, Beschreibung, Kosten (rot = fehlt), Hinweis bei gesperrt/zu wenig Material */
  const buildCard = (s: Slot): HTMLElement => {
    const c = el('div');
    c.appendChild(el('h4', '', s.def.name));
    if (s.def.description) c.appendChild(el('p', '', s.def.description));
    const costs = el('div', 'costs');
    const entries = Object.entries(s.def.cost);
    if (entries.length === 0) costs.appendChild(el('div', 'ok', 'Kostenlos'));
    for (const [id, n] of entries) {
      const have = game.inventory.count(id);
      costs.appendChild(el('div', have >= n ? 'ok' : 'miss', `${n}× ${itemName(game, id)} (${have} vorhanden)`));
    }
    c.appendChild(costs);
    if (s.state === 'locked') c.appendChild(el('div', 'hint', `Gesperrt: erst „${researchName(s.def.requiresResearch!)}“ erforschen (T)`));
    else if (s.state === 'poor') c.appendChild(el('div', 'hint', `Es fehlt: ${costText(game, missing(s.def.cost))}`));
    return c;
  };

  const select = (s: Slot) => {
    if (s.state === 'locked') {
      toast(`„${s.def.name}“ ist gesperrt: erst „${researchName(s.def.requiresResearch!)}“ erforschen.`, 'warn');
      return;
    }
    game.interaction.select(game.interaction.selected === s.def.id ? null : s.def.id);
  };

  /** Nur Klassen, Nummern und Auswahl aktualisieren (günstig, bei jeder Inventaränderung). */
  const refresh = () => {
    let n = 0;
    for (const s of slots) {
      s.state = stateOf(s.def);
      s.num = s.state !== 'locked' && n < 9 ? ++n : null;
      s.root.classList.toggle('poor', s.state === 'poor');
      s.root.classList.toggle('locked', s.state === 'locked');
      s.root.classList.toggle('sel', game.interaction.selected === s.def.id);
      s.key.textContent = s.num ? String(s.num) : '';
    }
  };
  const refreshSoon = rafThrottle(refresh);

  /** Slots neu aufbauen (neue Gebäude oder neue Forschung). */
  const rebuild = () => {
    card.hide();
    bar.replaceChildren();
    slots = game.registries.buildings.all().filter((d) => !d.hidden).map((def) => {
      const root = el('div', 'fe-ui-slot');
      const sw = el('div', 'sw');
      sw.style.background = def.color;
      const key = el('span', 'key');
      root.append(key, sw, el('span', 'nm', def.name));
      const s: Slot = { def, root, key, num: null, state: 'ok' };
      root.addEventListener('click', () => select(s));
      root.addEventListener('mouseenter', () => card.show(root, buildCard(s)));
      root.addEventListener('mouseleave', () => card.hide());
      bar.appendChild(root);
      return s;
    });
    bar.style.display = slots.length ? 'flex' : 'none';
    refresh();
    for (const s of slots) {
      if (s.state === 'locked') {
        const lock = el('span', 'lock', '🔒');
        s.root.appendChild(lock);
      }
    }
  };
  const rebuildSoon = rafThrottle(rebuild);

  game.events.on('ready', rebuild);
  game.events.on('researchUnlocked', rebuildSoon);
  game.registries.buildings.onRegister(() => rebuildSoon());
  game.events.on('inventoryChanged', refreshSoon);
  game.events.on('selectionChanged', refreshSoon);

  // Tasten 1–9
  for (let i = 1; i <= 9; i++) {
    game.input.onKey(`Digit${i}`, () => {
      const s = slots.find((x) => x.num === i);
      if (s) select(s);
    });
  }
}
