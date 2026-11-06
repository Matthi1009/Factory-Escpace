// Verteidigung: Mauern und Geschütztürme registrieren, Reichweiten-Vorschau zeichnen.
import type { Game } from '../../../core';
import { ENV_CONFIG } from '../config';
import type { Effects } from '../effects';
import type { MonsterManager } from '../monsters/MonsterManager';
import { WALL_DEF } from './Wall';
import { createTurretDef, TURRET_ID } from './Turret';

export function registerDefense(game: Game, monsters: MonsterManager, effects: Effects): void {
  game.registries.buildings.register(WALL_DEF);
  game.registries.buildings.register(createTurretDef(monsters, effects));

  // Reichweite anzeigen: beim Bauen eines Turms und beim Zeigen auf einen Turm
  game.renderer.addDrawHook('ui-world', (ctx, view) => {
    const h = game.interaction.hover;
    if (!h) return;
    const hovered = game.world.getBuilding(h.x, h.y);
    const show = game.interaction.selected === TURRET_ID || (!game.interaction.selected && hovered?.def.id === TURRET_ID);
    if (!show) return;
    const cx = hovered && !game.interaction.selected ? hovered.x + 0.5 : h.x + 0.5;
    const cy = hovered && !game.interaction.selected ? hovered.y + 0.5 : h.y + 0.5;
    ctx.strokeStyle = 'rgba(255,90,60,0.8)';
    ctx.fillStyle = 'rgba(255,90,60,0.08)';
    ctx.lineWidth = 2 / view.zoom;
    ctx.beginPath();
    ctx.arc(cx, cy, ENV_CONFIG.defense.turret.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}
