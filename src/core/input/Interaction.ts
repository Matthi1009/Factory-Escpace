// Spieler-Interaktion des Core: Kamera, Auswahl, Platzieren mit Vorschau, Abriss, Pipette, Drehen, Handabbau.
// Module können mit setTool() ein eigenes Maus-Werkzeug aktivieren (z. B. Zielauswahl für eine PR-Kampagne).
import type { Game } from '../Game';
import type { View } from '../render/Renderer';
import { rotateCCW, rotateCW, type Direction } from '../direction';
import type { TilePos } from '../world/World';
import { drawDefaultBuilding } from '../buildings/drawBuilding';

/** Ticks, die Handabbau pro Erz braucht, während die Maustaste gehalten wird. */
export const HAND_MINE_TICKS = 20;

/** Ein Maus-Werkzeug, das die normale Interaktion ersetzt, solange es aktiv ist. */
export interface InteractionTool {
  name: string;
  /** Maustaste über Kachel (x, y) gedrückt (first = true) oder gedrückt darüber gezogen (first = false). */
  onTile?(x: number, y: number, button: number, first: boolean): void;
  /** Wird jeden Tick aufgerufen, solange eine Maustaste gedrückt ist. */
  whileHeld?(x: number, y: number, button: number): void;
  /** Zeichnet die Vorschau (Ebene ui-world, Welt-Einheiten). */
  drawPreview?(ctx: CanvasRenderingContext2D, view: View, hover: TilePos | null): void;
}

export class Interaction {
  /** Gebäudetyp, der gerade gebaut wird (null = keiner) */
  selected: string | null = null;
  /** Ausrichtung für neue Gebäude */
  dir: Direction = 0;
  /** Kachel unter dem Mauszeiger (null = außerhalb) */
  hover: TilePos | null = null;
  /** Aktives Modul-Werkzeug (null = normale Interaktion) */
  tool: InteractionTool | null = null;
  /** Fortschritt des Handabbaus 0..1 */
  miningProgress = 0;

  private button = -1;
  private lastTile: TilePos | null = null;
  private panLast: { x: number; y: number } | null = null;

  constructor(private game: Game) {
    const canvas = game.renderer.canvas;
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mouseleave', () => (this.hover = null));
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        game.camera.zoomAt(Math.pow(1.0015, -e.deltaY), e.offsetX, e.offsetY);
        this.updateHover(e.offsetX, e.offsetY);
      },
      { passive: false },
    );

    const input = game.input;
    input.onKey('KeyQ', () => this.pipette());
    input.onKey('KeyR', (e) => this.rotate(e.shiftKey));
    input.onKey('Escape', () => {
      this.setTool(null);
      this.select(null);
    });
    input.onKey('KeyP', () => game.togglePause());

    game.renderer.addDrawHook('ui-world', (ctx, view) => this.drawPreview(ctx, view), -100);
    game.onTick(() => this.tick(), 'pre');
  }

  /** Gebäudetyp zum Bauen auswählen (null = Auswahl aufheben). Beendet ein aktives Werkzeug. */
  select(defId: string | null): void {
    if (defId !== null && !this.game.registries.buildings.has(defId)) {
      console.warn(`[interaction] Unbekannter Gebäudetyp '${defId}'`);
      return;
    }
    if (defId !== null) this.tool = null;
    if (this.selected === defId) return;
    this.selected = defId;
    this.game.events.emit('selectionChanged', { defId });
  }

  /** Modul-Werkzeug aktivieren (null = beenden). Hebt die Gebäude-Auswahl auf. */
  setTool(tool: InteractionTool | null): void {
    this.tool = tool;
    if (tool) this.select(null);
  }

  /** Linke obere Kachel, an der ein Gebäude des Typs bei Mausposition (x, y) landet (größere zentriert). */
  placementOrigin(defId: string, x: number, y: number): TilePos {
    const def = this.game.registries.buildings.get(defId);
    if (!def) return { x, y };
    return { x: x - Math.floor((def.size.w - 1) / 2), y: y - Math.floor((def.size.h - 1) / 2) };
  }

  /** @internal Pro Frame: Kamera mit WASD/Pfeilen verschieben (läuft auch in der Pause). */
  _frame(dt: number): void {
    const inp = this.game.input;
    let dx = 0;
    let dy = 0;
    if (inp.isDown('KeyA') || inp.isDown('ArrowLeft')) dx -= 1;
    if (inp.isDown('KeyD') || inp.isDown('ArrowRight')) dx += 1;
    if (inp.isDown('KeyW') || inp.isDown('ArrowUp')) dy -= 1;
    if (inp.isDown('KeyS') || inp.isDown('ArrowDown')) dy += 1;
    if (dx || dy) {
      const fast = inp.isDown('ShiftLeft') || inp.isDown('ShiftRight') ? 2.5 : 1;
      const speed = (900 / this.game.camera.zoom) * fast * dt; // ca. 900 CSS-px pro Sekunde
      const len = Math.hypot(dx, dy);
      this.game.camera.pan((dx / len) * speed, (dy / len) * speed);
      if (inp.mouseInside) this.updateHover(inp.mouseX, inp.mouseY);
    }
  }

  // ---------- Maus ----------

  private onMouseDown(e: MouseEvent): void {
    if (this.game.over) return;
    this.updateHover(e.offsetX, e.offsetY);
    if (e.button === 1) {
      e.preventDefault();
      this.panLast = { x: e.offsetX, y: e.offsetY };
      return;
    }
    this.button = e.button;
    this.miningProgress = 0;
    if (this.hover) {
      this.lastTile = this.hover;
      this.applyAt(this.hover.x, this.hover.y, true);
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.panLast) {
      const z = this.game.camera.zoom;
      this.game.camera.pan(-(e.offsetX - this.panLast.x) / z, -(e.offsetY - this.panLast.y) / z);
      this.panLast = { x: e.offsetX, y: e.offsetY };
    }
    this.updateHover(e.offsetX, e.offsetY);
    if (this.button < 0 || !this.hover || this.game.over) return;
    const from = this.lastTile ?? this.hover;
    const to = this.hover;
    if (from.x === to.x && from.y === to.y) return;
    // alle Kacheln zwischen letzter und aktueller Position (keine Lücken beim schnellen Ziehen)
    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
    for (let i = 1; i <= steps; i++) {
      const x = Math.round(from.x + ((to.x - from.x) * i) / steps);
      const y = Math.round(from.y + ((to.y - from.y) * i) / steps);
      this.applyAt(x, y, false);
    }
    this.lastTile = to;
  }

  private onMouseUp(): void {
    this.button = -1;
    this.lastTile = null;
    this.panLast = null;
    this.miningProgress = 0;
  }

  private updateHover(sx: number, sy: number): void {
    const w = this.game.camera.screenToWorld(sx, sy);
    const x = Math.floor(w.x);
    const y = Math.floor(w.y);
    this.hover = this.game.world.inBounds(x, y) ? { x, y } : null;
  }

  /** Aktion für die gedrückte Maustaste auf Kachel (x, y). */
  private applyAt(x: number, y: number, first: boolean): void {
    const game = this.game;
    if (this.tool) {
      this.tool.onTile?.(x, y, this.button, first);
      return;
    }
    if (this.button === 0) {
      if (this.selected) {
        const o = this.placementOrigin(this.selected, x, y);
        const err = game.placementError(this.selected, o.x, o.y, this.dir);
        if (err) {
          // Beim Ziehen über belegte Kacheln keine Meldungsflut
          if (first && !game.world.getBuilding(x, y)) game.notify(err, 'warn');
          return;
        }
        game.placeBuilding(this.selected, o.x, o.y, this.dir, { byPlayer: true });
      } else if (first) {
        const b = game.world.getBuilding(x, y);
        if (b) game.events.emit('buildingClicked', { building: b, button: 0 });
        else if (game.world.getResource(x, y)) this.mine(x, y);
      }
    } else if (this.button === 2) {
      const b = game.world.getBuilding(x, y);
      if (!b) return;
      if (b.def.removable === false) {
        if (first) game.notify(`${b.def.name} kann nicht abgerissen werden`, 'warn');
        return;
      }
      game.removeBuilding(b, { refund: true, byPlayer: true });
    }
  }

  private mine(x: number, y: number): void {
    const res = this.game.world.getResource(x, y);
    if (!res) return;
    this.game.inventory.add(res, 1);
    this.game.events.emit('handMined', { item: res, x, y });
  }

  /** Pro Tick: Handabbau bei gehaltener Maustaste, Werkzeug-whileHeld. */
  private tick(): void {
    if (this.button < 0 || !this.hover) return;
    const { x, y } = this.hover;
    if (this.tool) {
      this.tool.whileHeld?.(x, y, this.button);
      return;
    }
    if (this.button !== 0 || this.selected || this.game.world.getBuilding(x, y) || !this.game.world.getResource(x, y)) {
      this.miningProgress = 0;
      return;
    }
    this.miningProgress += 1 / HAND_MINE_TICKS;
    if (this.miningProgress >= 1) {
      this.miningProgress = 0;
      this.mine(x, y);
    }
  }

  // ---------- Tasten ----------

  /** Q: Gebäudetyp unter dem Mauszeiger auswählen (leere Kachel → Auswahl aufheben). */
  private pipette(): void {
    const b = this.hover ? this.game.world.getBuilding(this.hover.x, this.hover.y) : null;
    if (b && b.def.removable !== false) {
      this.select(b.def.id);
      this.dir = b.dir;
    } else {
      this.select(null);
    }
  }

  /** R: Auswahl drehen, oder ohne Auswahl das Gebäude unter dem Mauszeiger. Shift+R = gegen den Uhrzeigersinn. */
  private rotate(ccw: boolean): void {
    const turn = ccw ? rotateCCW : rotateCW;
    if (this.selected) {
      this.dir = turn(this.dir);
      return;
    }
    const b = this.hover ? this.game.world.getBuilding(this.hover.x, this.hover.y) : null;
    if (b && b.def.rotatable !== false && !this.game.over) {
      b.dir = turn(b.dir);
      this.game.events.emit('buildingRotated', { building: b });
    }
  }

  // ---------- Vorschau ----------

  private drawPreview(ctx: CanvasRenderingContext2D, view: View): void {
    const h = this.hover;
    if (this.tool) {
      this.tool.drawPreview?.(ctx, view, h);
      return;
    }
    if (!h) return;
    const line = 1.5 / view.zoom;
    if (this.selected) {
      const def = this.game.registries.buildings.get(this.selected);
      if (!def) return;
      const o = this.placementOrigin(def.id, h.x, h.y);
      const ok = this.game.placementError(def.id, o.x, o.y, this.dir) === null;
      ctx.save();
      ctx.translate(o.x + def.size.w / 2, o.y + def.size.h / 2);
      ctx.globalAlpha = 0.55;
      drawDefaultBuilding(ctx, def, def.rotatable === false ? 0 : this.dir);
      ctx.restore();
      ctx.fillStyle = ok ? 'rgba(60,220,90,0.30)' : 'rgba(230,50,50,0.38)';
      ctx.fillRect(o.x, o.y, def.size.w, def.size.h);
      ctx.strokeStyle = ok ? '#4dff7a' : '#ff4d4d';
      ctx.lineWidth = line * 1.5;
      ctx.strokeRect(o.x, o.y, def.size.w, def.size.h);
      return;
    }
    const b = this.game.world.getBuilding(h.x, h.y);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = line;
    if (b) ctx.strokeRect(b.x, b.y, b.def.size.w, b.def.size.h);
    else ctx.strokeRect(h.x, h.y, 1, 1);
    if (this.miningProgress > 0) {
      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = line * 2.5;
      ctx.beginPath();
      ctx.arc(h.x + 0.5, h.y + 0.5, 0.32, -Math.PI / 2, -Math.PI / 2 + this.miningProgress * Math.PI * 2);
      ctx.stroke();
    }
  }
}
