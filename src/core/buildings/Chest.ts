// ============================================================================
// REFERENZ-IMPLEMENTIERUNG für Gebäude: core:chest
// Nimmt jedes Item an, das hineingeschoben wird, und legt es ins Spieler-Inventar.
// So baut man ein eigenes Gebäude:
//   1. Klasse von BaseBuilding ableiten
//   2. Nur die Methoden ergänzen, die man braucht (tick, draw, acceptItem, onPlace, onRemove)
//   3. Eine BuildingDef mit create: (init) => new MeineKlasse(init) anlegen
//   4. In register(game) aufrufen: game.registries.buildings.register(MEINE_DEF)
// ============================================================================
import type { ItemId } from '../defs';
import type { Direction } from '../direction';
import { BaseBuilding, type BuildingDef } from './Building';

export class Chest extends BaseBuilding {
  /** Für die Optik: kurz aufleuchten, wenn etwas ankommt. */
  private flash = 0;

  /**
   * Item-Transfer-Vertrag: Wird von anderen Gebäuden (z. B. einem Band davor) aufgerufen.
   * Die Kiste nimmt alles an → true. Der Absender gibt das Item damit ab.
   * Inaktive Gebäude (deaktiviert/blockiert) bekommen über pushTo gar keine Items angeboten.
   */
  acceptItem(item: ItemId, _from: Direction): boolean {
    this.game.inventory.add(item, 1);
    this.flash = 1;
    return true;
  }

  /** Spiellogik pro Tick: hier nur das Aufleuchten abklingen lassen. */
  tick(): void {
    if (this.flash > 0) this.flash = Math.max(0, this.flash - 0.1);
  }

  /**
   * Zeichnen: (0,0) ist die Kachelmitte, die Kachel reicht von -0.5 bis +0.5, vorne = oben.
   * Ohne draw() würde der Core ein Quadrat in def.color mit Richtungspfeil zeichnen.
   */
  draw(ctx: CanvasRenderingContext2D, _time: number): void {
    ctx.fillStyle = this.def.color;
    ctx.fillRect(-0.42, -0.36, 0.84, 0.72);
    ctx.fillStyle = '#5a3b1c';
    ctx.fillRect(-0.42, -0.06, 0.84, 0.1); // Deckelkante
    ctx.fillStyle = this.flash > 0 ? `rgba(255,240,150,${this.flash})` : '#d8b25a';
    ctx.fillRect(-0.07, -0.1, 0.14, 0.16); // Schloss
    ctx.strokeStyle = '#3d2710';
    ctx.lineWidth = 0.05;
    ctx.strokeRect(-0.42, -0.36, 0.84, 0.72);
  }
}

export const CHEST_DEF: BuildingDef = {
  id: 'core:chest',
  name: 'Kiste',
  description: 'Nimmt alle Items an und legt sie ins Inventar.',
  size: { w: 1, h: 1 },
  cost: { iron_plate: 2 },
  maxHp: 100,
  color: '#8b5a2b',
  tags: ['storage'],
  rotatable: false,
  create: (init) => new Chest(init),
};
