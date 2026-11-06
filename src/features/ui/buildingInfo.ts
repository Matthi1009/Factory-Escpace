// Gebäude-Info-Fenster: öffnet sich bei buildingClicked und zeigt live Name, HP, Status und info().
import type { Building, Game } from '../../core';
import { el } from './dom';
import { Panel } from './windows';

export function createBuildingInfo(game: Game): Panel {
  let current: Building | null = null;
  const content = el('div', 'fe-ui-binfo');

  const render = () => {
    const b = current;
    if (!b || b.removed) {
      if (b) panel.hide();
      return;
    }
    content.replaceChildren();
    if (b.def.description) {
      const d = el('div', 'dim', b.def.description);
      d.style.cssText = 'color:#8d99a8;font-size:12px;margin-bottom:6px';
      content.appendChild(d);
    }
    const tags = el('div', 'tags');
    for (const t of b.def.tags) tags.appendChild(el('span', 'tag', t));
    if (b.def.tags.length) content.appendChild(tags);

    const hp = el('div', 'hp');
    const fill = el('i');
    const frac = Math.max(0, Math.min(1, b.hp / b.def.maxHp));
    fill.style.width = `${Math.round(frac * 100)}%`;
    fill.style.background = frac > 0.6 ? '#6ad67a' : frac > 0.3 ? '#ffcf5a' : '#ff6a5a';
    hp.appendChild(fill);
    content.append(el('div', '', `HP ${Math.ceil(b.hp)} / ${b.def.maxHp}`), hp);

    const lines = el('div', 'lines');
    if (b.blockedTicks > 0) lines.appendChild(el('div', 'warn', `Blockiert (noch ${Math.ceil(b.blockedTicks / 60)} s)`));
    if (!b.enabled) lines.appendChild(el('div', 'warn', 'Deaktiviert'));
    for (const l of b.info?.() ?? []) lines.appendChild(el('div', '', l));
    content.appendChild(lines);
    content.appendChild(el('div', 'fe-ui-empty', `Position ${b.x} | ${b.y} · Rechtsklick reißt ab`));
  };

  const panel: Panel = new Panel(game.uiRoot, {
    title: 'Gebäude',
    width: 270,
    anchor: { left: 12, top: 70 },
    onShow: render,
    onHide: () => (current = null),
  });
  panel.body.appendChild(content);

  game.events.on('buildingClicked', ({ building, button }) => {
    if (button !== 0) return;
    current = building;
    const title = panel.el.querySelector('.ttl');
    if (title) title.textContent = building.def.name;
    if (panel.isOpen) render();
    else panel.show();
  });
  window.setInterval(() => {
    if (panel.isOpen) render();
  }, 250);
  return panel;
}
