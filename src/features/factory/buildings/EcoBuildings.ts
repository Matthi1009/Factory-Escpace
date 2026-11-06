// Öko-Varianten (Tag `eco`): teuer und ineffizient, dafür (fast) sauber.
import { BaseBuilding, type BuildingDef, type BuildingInit } from '../../../core';
import { BALANCE } from '../balance';
import { needsConcreteResearch } from '../research';
import { Furnace } from './Furnace';

export class EcoFurnace extends Furnace {
  protected override pollutionPerSecond: number = BALANCE.furnace.ecoPollution;
  protected override speed: number = BALANCE.furnace.ecoSpeed;

  constructor(init: BuildingInit) {
    super(init);
  }

  override draw(ctx: CanvasRenderingContext2D, time: number): void {
    super.draw(ctx, time);
    // grüner Rand und Blatt als Erkennungszeichen
    ctx.strokeStyle = '#4fc36a';
    ctx.lineWidth = 0.07;
    ctx.strokeRect(-0.45, -0.45, 0.9, 0.9);
    ctx.fillStyle = '#4fc36a';
    ctx.beginPath();
    ctx.ellipse(0.28, 0.3, 0.12, 0.07, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const ECO_FURNACE_DEF: BuildingDef = {
  id: 'factory:eco_furnace',
  name: 'Öko-Ofen',
  description: `Wie der Ofen, aber ${Math.round((1 - BALANCE.furnace.ecoSpeed) * 100)} % langsamer und fast ohne Verschmutzung. Teuer.`,
  size: { w: 1, h: 1 },
  cost: { iron_plate: 10, steel: 5, circuit: 5, concrete: 10 },
  requiresResearch: 'eco_tech',
  maxHp: 120,
  color: '#3f7a52',
  tags: ['eco'],
  rotatable: true,
  canPlace: needsConcreteResearch,
  create: (init) => new EcoFurnace(init),
};

/** Solarpark: schwankende Leistung (Tag/Nacht), keine Verschmutzung, liefert immer, auch ohne Bedarf. */
export class SolarPlant extends BaseBuilding {
  private output = 0;

  constructor(init: BuildingInit) {
    super(init);
  }

  /** 0..1 Sonnenstand über den Tag */
  private daylight(): number {
    const s = BALANCE.solarPlant;
    return Math.max(0, Math.sin((2 * Math.PI * this.game.time) / s.daySeconds));
  }

  tick(): void {
    const s = BALANCE.solarPlant;
    this.output = s.peakKw * (s.baseFraction + (1 - s.baseFraction) * this.daylight());
    this.game.power.produce(this.output);
  }

  info(): string[] {
    return [`Leistung: ${Math.round(this.output)} kW (max. ${BALANCE.solarPlant.peakKw} kW)`, this.daylight() > 0.05 ? 'Die Sonne scheint' : 'Nacht – nur Restleistung', 'Keine Verschmutzung'];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#26364d';
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.strokeStyle = '#8fb4e0';
    ctx.lineWidth = 0.03;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-0.45, i * 0.3);
      ctx.lineTo(0.45, i * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * 0.3, -0.45);
      ctx.lineTo(i * 0.3, 0.45);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(255,230,120,${0.15 + 0.45 * this.daylight()})`;
    ctx.fillRect(-0.45, -0.45, 0.9, 0.9);
    ctx.strokeStyle = '#4fc36a';
    ctx.lineWidth = 0.07;
    ctx.strokeRect(-0.45, -0.45, 0.9, 0.9);
  }
}

export const SOLAR_PLANT_DEF: BuildingDef = {
  id: 'factory:solar_plant',
  name: 'Solarpark',
  description: `Saubere Energie, aber nur bis ${BALANCE.solarPlant.peakKw} kW und tagsüber stärker als nachts. Teuer.`,
  size: { w: 1, h: 1 },
  cost: { iron_plate: 20, circuit: 10, concrete: 10 },
  requiresResearch: 'eco_tech',
  maxHp: 80,
  color: '#26364d',
  tags: ['power_producer', 'eco'],
  rotatable: false,
  canPlace: needsConcreteResearch,
  create: (init) => new SolarPlant(init),
};
