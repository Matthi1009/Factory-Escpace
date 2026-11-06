// Kleines Auswahlfenster für das Rezept einer Montagemaschine (HTML in game.uiRoot).
import type { Game } from '../../../core';
import type { Assembler } from '../buildings/Assembler';

let current: { close: () => void } | null = null;

export function closeRecipeDialog(): void {
  current?.close();
}

export function openRecipeDialog(game: Game, assembler: Assembler): void {
  closeRecipeDialog();
  const items = game.registries.items;
  const itemName = (id: string) => items.get(id)?.name ?? id;
  const fmt = (c: Record<string, number>) => Object.entries(c).map(([id, n]) => `${n}× ${itemName(id)}`).join(' + ');

  const box = document.createElement('div');
  box.style.cssText =
    'position:absolute;pointer-events:auto;min-width:230px;max-width:320px;background:rgba(20,24,30,.96);color:#e8edf2;' +
    'border:1px solid #4a5560;border-radius:8px;padding:10px;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.5);';
  const title = document.createElement('div');
  title.textContent = 'Montagemaschine: Rezept wählen';
  title.style.cssText = 'font-weight:600;margin-bottom:8px;';
  box.appendChild(title);

  const recipes = assembler.availableRecipes();
  const makeButton = (label: string, sub: string, active: boolean, onClick: () => void) => {
    const btn = document.createElement('button');
    btn.style.cssText =
      'display:block;width:100%;text-align:left;margin:3px 0;padding:6px 8px;border-radius:6px;cursor:pointer;color:inherit;font:inherit;' +
      `border:1px solid ${active ? '#7fd1ff' : '#3a444e'};background:${active ? 'rgba(127,209,255,.15)' : 'rgba(255,255,255,.04)'};`;
    const a = document.createElement('div');
    a.textContent = label;
    const b = document.createElement('div');
    b.textContent = sub;
    b.style.cssText = 'font-size:11px;opacity:.7;';
    btn.append(a, b);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
      closeRecipeDialog();
    });
    return btn;
  };

  if (recipes.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'Noch keine Rezepte erforscht.';
    empty.style.opacity = '.7';
    box.appendChild(empty);
  }
  for (const r of recipes) {
    box.appendChild(makeButton(r.name ?? r.id, `${fmt(r.inputs)} → ${fmt(r.outputs)} (${r.time} s)`, assembler.currentRecipe?.id === r.id, () => assembler.setRecipe(r.id)));
  }
  if (assembler.currentRecipe) box.appendChild(makeButton('Kein Rezept', 'Inhalt zurück ins Inventar', false, () => assembler.setRecipe(null)));

  // Position am Mauszeiger, im Fenster halten
  game.uiRoot.appendChild(box);
  const rect = game.uiRoot.getBoundingClientRect();
  const w = box.offsetWidth;
  const h = box.offsetHeight;
  box.style.left = `${Math.max(8, Math.min(game.input.mouseX + 12, rect.width - w - 8))}px`;
  box.style.top = `${Math.max(8, Math.min(game.input.mouseY + 12, rect.height - h - 8))}px`;

  const onDown = (e: MouseEvent) => {
    if (!box.contains(e.target as Node)) closeRecipeDialog();
  };
  const offEsc = game.input.onKey('Escape', () => closeRecipeDialog());
  // verzögert anmelden, damit der öffnende Klick nicht sofort schließt
  const timer = window.setTimeout(() => document.addEventListener('mousedown', onDown, true), 0);
  const offRemoved = game.events.on('buildingRemoved', ({ building }) => {
    if (building === assembler) closeRecipeDialog();
  });

  current = {
    close: () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onDown, true);
      offRemoved();
      if (typeof offEsc === 'function') offEsc();
      box.remove();
      current = null;
    },
  };
}
