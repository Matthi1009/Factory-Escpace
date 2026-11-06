// Mauer: robust, blockiert Monster. Die Wegfindung macht lieber einen Umweg (defenseCost),
// ist alles zu, beißen sich Monster durch. Mauerteile verbinden sich optisch mit Nachbar-Mauern.
import { BaseBuilding, type BuildingDef } from '../../../core';
import { ENV_CONFIG } from '../config';

export const WALL_ID = 'environment:wall';

export class Wall extends BaseBuilding {
  draw(ctx: CanvasRenderingContext2D): void {
    const w = this.game.world;
    const isWall = (x: number, y: number) => w.getBuilding(x, y)?.def.id === WALL_ID;
    ctx.fillStyle = '#8a8580';
    ctx.fillRect(-0.3, -0.3, 0.6, 0.6);
    // Verbindungen zu Nachbarmauern
    if (isWall(this.x, this.y - 1)) ctx.fillRect(-0.3, -0.5, 0.6, 0.2);
    if (isWall(this.x, this.y + 1)) ctx.fillRect(-0.3, 0.3, 0.6, 0.2);
    if (isWall(this.x - 1, this.y)) ctx.fillRect(-0.5, -0.3, 0.2, 0.6);
    if (isWall(this.x + 1, this.y)) ctx.fillRect(0.3, -0.3, 0.2, 0.6);
    // Steinfugen
    ctx.strokeStyle = '#5e5955';
    ctx.lineWidth = 0.04;
    ctx.strokeRect(-0.3, -0.3, 0.6, 0.6);
    ctx.beginPath();
    ctx.moveTo(-0.3, 0);
    ctx.lineTo(0.3, 0);
    ctx.moveTo(0, -0.3);
    ctx.lineTo(0, 0);
    ctx.stroke();
  }
}

export const WALL_DEF: BuildingDef = {
  id: WALL_ID,
  name: 'Mauer',
  description: 'Hält Monster auf. Sie laufen lieber außen herum, als sich durchzubeißen.',
  size: { w: 1, h: 1 },
  cost: ENV_CONFIG.defense.wall.cost,
  maxHp: ENV_CONFIG.defense.wall.maxHp,
  color: '#8a8580',
  tags: ['defense'],
  requiresResearch: 'defense_walls',
  rotatable: false,
  create: (init) => new Wall(init),
};
