// Info unter der Maus: Terrain, Ressource, Umweltwerte, Gebäude (Name, HP, info()).
import { TERRAINS, type Game } from '../../core';
import { el, fmt } from './dom';

const UPDATE_MS = 100;
const OFFSET = 16;

export function createTooltip(game: Game): void {
  const tip = el('div', 'fe-ui-tip');
  tip.style.display = 'none';
  game.uiRoot.appendChild(tip);
  const terrainName = new Map<string, string>(TERRAINS.map((t) => [t.id, t.name]));

  const line = (text: string, cls = '') => tip.appendChild(el('div', cls, text));

  const update = () => {
    const { input, interaction, world, env } = game;
    // Beim Bauen/mit Werkzeug gehört der Mauszeiger der Vorschau – dann keine Karte
    const hover = interaction.hover;
    if (!input.mouseInside || !hover || interaction.selected !== null || interaction.tool !== null || game.over) {
      tip.style.display = 'none';
      return;
    }
    const { x, y } = hover;
    const b = world.getBuilding(x, y);
    const terrain = world.getTerrain(x, y);
    const resource = world.getResource(x, y);
    tip.replaceChildren();

    tip.appendChild(el('h4', '', b ? b.def.name : (terrain ? (terrainName.get(terrain) ?? terrain) : '–')));
    line(`Kachel ${x} | ${y}`, 'dim');
    if (b) {
      if (terrain) line(`Boden: ${terrainName.get(terrain) ?? terrain}`, 'dim');
      line(`HP ${Math.ceil(b.hp)} / ${b.def.maxHp}`);
      if (b.blockedTicks > 0) line(`Blockiert (noch ${Math.ceil(b.blockedTicks / 60)} s)`, 'warn');
      if (!b.enabled) line('Deaktiviert', 'warn');
      for (const l of b.info?.() ?? []) line(l);
    }
    if (resource) line(`Vorkommen: ${game.registries.items.get(resource)?.name ?? resource} (unendlich)`);

    const pol = env.get('pollution', x, y);
    const temp = env.get('temperature', x, y);
    const rad = env.get('radiation', x, y);
    const wat = env.get('water', x, y);
    line(`Verschmutzung ${fmt(pol, 1)} · ${fmt(temp, 1)} °C`, pol > 5 ? 'warn' : 'dim');
    line(`Feuchtigkeit ${Math.round(wat * 100)} %${rad > 0.01 ? ` · Strahlung ${fmt(rad, 2)}` : ''}`, rad > 0.5 ? 'warn' : 'dim');

    tip.style.display = 'block';
    const root = game.uiRoot.getBoundingClientRect();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    let left = input.mouseX + OFFSET;
    let top = input.mouseY + OFFSET;
    if (left + w > root.width - 8) left = input.mouseX - w - OFFSET;
    if (top + h > root.height - 8) top = input.mouseY - h - OFFSET;
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${Math.max(8, top)}px`;
  };

  window.setInterval(update, UPDATE_MS);
}
