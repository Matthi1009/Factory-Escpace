// Das Raumschiff-Wrack: Hauptbasis beim Spawn (3×3). Nicht abreißbar.
// Wird es zerstört, ist das Spiel vorbei (Game prüft das in destroyBuilding).
// Es nimmt wie eine Kiste Items an und legt sie ins Inventar.
import type { ItemId } from '../defs';
import { BaseBuilding, type BuildingDef } from './Building';

export class Wreck extends BaseBuilding {
  acceptItem(item: ItemId): boolean {
    this.game.inventory.add(item, 1);
    return true;
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    // Rumpf
    ctx.fillStyle = '#7d8590';
    ctx.beginPath();
    ctx.moveTo(0, -1.45);
    ctx.lineTo(0.9, -0.3);
    ctx.lineTo(1.3, 1.2);
    ctx.lineTo(0.4, 0.9);
    ctx.lineTo(0, 1.4);
    ctx.lineTo(-0.4, 0.9);
    ctx.lineTo(-1.3, 1.2);
    ctx.lineTo(-0.9, -0.3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3c4148';
    ctx.lineWidth = 0.06;
    ctx.stroke();
    // Cockpit
    ctx.fillStyle = '#5fb3d9';
    ctx.beginPath();
    ctx.ellipse(0, -0.55, 0.28, 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    // Brandspuren
    ctx.fillStyle = 'rgba(30,20,10,0.55)';
    ctx.beginPath();
    ctx.ellipse(0.55, 0.55, 0.35, 0.22, 0.6, 0, Math.PI * 2);
    ctx.ellipse(-0.6, 0.2, 0.25, 0.18, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // flackerndes Warnlicht
    ctx.fillStyle = Math.sin(time * 4) > 0 ? '#ff4a3a' : '#5a1a14';
    ctx.beginPath();
    ctx.arc(0, 0.35, 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const WRECK_DEF: BuildingDef = {
  id: 'core:wreck',
  name: 'Raumschiff-Wrack',
  description: 'Deine Hauptbasis. Wird sie zerstört, ist das Spiel vorbei.',
  size: { w: 3, h: 3 },
  cost: {},
  maxHp: 5000,
  color: '#7d8590',
  tags: ['storage'],
  hidden: true,
  removable: false,
  rotatable: false,
  canPlace: () => 'Das Wrack wird nur vom Core platziert',
  create: (init) => new Wreck(init),
};
