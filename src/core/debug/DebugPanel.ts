// F1-Debugpanel: damit jedes Modul allein testbar ist.
// Gebäude wählen, Items/Geld/Forschung cheaten, Umweltwerte pinseln, debug:source-Item wählen, Aktionen auslösen.
import type { Game } from '../Game';
import { DebugSource } from '../buildings/DebugSource';
import { ENV_FIELDS, type EnvField } from '../state/Env';
import type { InteractionTool } from '../input/Interaction';

const CSS = `
.fe-debug{position:absolute;top:8px;right:8px;width:310px;max-height:calc(100% - 16px);overflow:auto;
  background:rgba(18,20,26,.94);color:#e6e6e6;font:12px/1.35 system-ui,sans-serif;border:1px solid #444;
  border-radius:6px;padding:8px;pointer-events:auto;z-index:1000;box-shadow:0 4px 18px rgba(0,0,0,.5)}
.fe-debug h3{margin:8px 0 4px;font-size:12px;color:#9fd3ff;text-transform:uppercase;letter-spacing:.05em}
.fe-debug h2{margin:0 0 4px;font-size:14px}
.fe-debug button{background:#2c3442;color:#eee;border:1px solid #556;border-radius:4px;padding:3px 6px;margin:2px;cursor:pointer;font:inherit}
.fe-debug button:hover{background:#3b475c}
.fe-debug button.on{background:#7a3b1d;border-color:#d97a3a}
.fe-debug select,.fe-debug input{background:#1d222b;color:#eee;border:1px solid #556;border-radius:4px;font:inherit;padding:2px}
.fe-debug .row{display:flex;flex-wrap:wrap;align-items:center;gap:2px}
.fe-debug pre{margin:0;white-space:pre-wrap;font:11px/1.35 ui-monospace,monospace;color:#cfd8e3}
.fe-debug .sw{display:inline-block;width:9px;height:9px;margin-right:4px;border:1px solid #000;vertical-align:-1px}
`;

export class DebugPanel {
  private el: HTMLDivElement;
  private status!: HTMLPreElement;
  private brushField: EnvField = 'pollution';
  private brushAmount = 5;
  private overlay = false;
  private brushBtn!: HTMLButtonElement;
  private log: string[] = [];
  private logEl!: HTMLPreElement;
  private brushTool: InteractionTool;

  constructor(private game: Game) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.el = document.createElement('div');
    this.el.className = 'fe-debug';
    this.el.style.display = 'none';
    game.uiRoot.appendChild(this.el);

    this.brushTool = {
      name: 'debug:env_brush',
      whileHeld: (x, y, button) => {
        const sign = button === 2 ? -1 : 1;
        game.world.forEachInRadius(x + 0.5, y + 0.5, 2.5, (tx, ty, d) => {
          game.env.add(this.brushField, tx, ty, (sign * this.brushAmount * (1 - d / 3)) / 10);
        });
      },
      drawPreview: (ctx, view, hover) => {
        if (!hover) return;
        ctx.strokeStyle = '#ff9f43';
        ctx.lineWidth = 2 / view.zoom;
        ctx.beginPath();
        ctx.arc(hover.x + 0.5, hover.y + 0.5, 2.5, 0, Math.PI * 2);
        ctx.stroke();
      },
    };

    game.input.onKey('F1', () => this.toggle());
    game.events.on('notify', ({ text, level }) => {
      this.log.unshift(`[${level}] ${text}`);
      this.log.length = Math.min(this.log.length, 8);
      if (this.logEl) this.logEl.textContent = this.log.join('\n');
    });
    game.events.on('selectionChanged', () => this.syncBrushButton());
    game.renderer.addDrawHook('overlay', (ctx, view) => this.drawOverlay(ctx, view), 100);
    setInterval(() => this.updateStatus(), 250);
  }

  get visible(): boolean {
    return this.el.style.display !== 'none';
  }

  toggle(): void {
    if (this.visible) {
      this.el.style.display = 'none';
    } else {
      this.el.style.display = '';
      this.build();
    }
  }

  /** Baut den Inhalt neu auf (beim Öffnen, damit neu registrierte Gebäude/Aktionen erscheinen). */
  private build(): void {
    const g = this.game;
    this.el.innerHTML = '';
    const h = (tag: string, text = '') => {
      const e = document.createElement(tag);
      e.textContent = text;
      return e;
    };
    const row = () => {
      const r = document.createElement('div');
      r.className = 'row';
      return r;
    };
    const btn = (label: string, fn: () => void, parent: HTMLElement) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.onclick = fn;
      parent.appendChild(b);
      return b;
    };

    this.el.appendChild(h('h2', 'Debug (F1)'));
    this.status = h('pre') as HTMLPreElement;
    this.el.appendChild(this.status);

    this.el.appendChild(h('h3', 'Cheats'));
    const r1 = row();
    btn('+100 jedes Item', () => {
      for (const it of g.registries.items.all()) g.inventory.add(it.id, 100);
    }, r1);
    btn('+10.000 Geld', () => g.economy.add(10000, 'debug'), r1);
    btn('Alles erforschen', () => {
      for (const r of g.registries.research.all()) g.research.unlock(r.id);
    }, r1);
    btn('Pause', () => g.togglePause(), r1);
    this.el.appendChild(r1);

    this.el.appendChild(h('h3', 'Umwelt-Pinsel'));
    const r2 = row();
    const sel = document.createElement('select');
    for (const f of ENV_FIELDS) sel.add(new Option(f, f, false, f === this.brushField));
    sel.onchange = () => (this.brushField = sel.value as EnvField);
    r2.appendChild(sel);
    const amt = document.createElement('input');
    amt.type = 'number';
    amt.value = String(this.brushAmount);
    amt.style.width = '52px';
    amt.title = 'Stärke pro Tick (×0,1)';
    amt.onchange = () => (this.brushAmount = Number(amt.value) || 0);
    r2.appendChild(amt);
    this.brushBtn = btn('Am Mauszeiger erhöhen', () => {
      g.interaction.setTool(g.interaction.tool === this.brushTool ? null : this.brushTool);
      this.syncBrushButton();
    }, r2);
    this.brushBtn.title = 'Aktiv: Linke Maustaste gedrückt halten = erhöhen, rechte = senken. Esc beendet.';
    const ov = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = this.overlay;
    cb.onchange = () => (this.overlay = cb.checked);
    ov.append(cb, ' Feld anzeigen');
    r2.appendChild(ov);
    this.el.appendChild(r2);
    this.syncBrushButton();

    this.el.appendChild(h('h3', 'debug:source gibt aus'));
    const r3 = row();
    const isel = document.createElement('select');
    for (const it of g.registries.items.all()) isel.add(new Option(it.name + ' (' + it.id + ')', it.id, false, it.id === DebugSource.defaultItem));
    isel.onchange = () => (DebugSource.defaultItem = isel.value);
    r3.appendChild(isel);
    btn('Auf alle anwenden', () => {
      for (const b of g.world.buildingsOfType('debug:source')) (b as DebugSource).item = DebugSource.defaultItem;
    }, r3);
    this.el.appendChild(r3);

    this.el.appendChild(h('h3', 'Gebäude bauen (alle registrierten)'));
    const r4 = row();
    for (const def of g.registries.buildings.all()) {
      if (def.id === 'core:wreck') continue;
      const b = btn('', () => g.interaction.select(def.id), r4);
      const sw = document.createElement('span');
      sw.className = 'sw';
      sw.style.background = def.color;
      b.append(sw, def.name);
      b.title = def.id;
    }
    btn('Keins', () => g.interaction.select(null), r4);
    this.el.appendChild(r4);

    const actions = g.registries.actions.all();
    if (actions.length) {
      this.el.appendChild(h('h3', 'Aktionen'));
      const r5 = row();
      for (const a of actions) {
        const b = btn(a.name, () => a.run(g), r5);
        b.title = a.id;
        b.disabled = a.isAvailable ? !a.isAvailable(g) : false;
      }
      this.el.appendChild(r5);
    }

    this.el.appendChild(h('h3', 'Meldungen'));
    this.logEl = h('pre', this.log.join('\n')) as HTMLPreElement;
    this.el.appendChild(this.logEl);
    this.updateStatus();
  }

  private syncBrushButton(): void {
    this.brushBtn?.classList.toggle('on', this.game.interaction.tool === this.brushTool);
  }

  private updateStatus(): void {
    if (!this.visible || !this.status) return;
    const g = this.game;
    const hv = g.interaction.hover;
    let tile = '–';
    if (hv) {
      const b = g.world.getBuilding(hv.x, hv.y);
      tile =
        `(${hv.x}, ${hv.y}) ${g.world.getTerrain(hv.x, hv.y)} ${g.world.getResource(hv.x, hv.y) ?? ''}\n` +
        ENV_FIELDS.map((f) => `${f}=${g.env.get(f, hv.x, hv.y).toFixed(2)}`).join(' ') +
        (b ? `\n${b.def.id} #${b.uid} dir=${'NESW'[b.dir]} hp=${Math.ceil(b.hp)}/${b.def.maxHp}` : '');
    }
    const inv = g.inventory
      .entries()
      .map(([id, n]) => `${id}:${n}`)
      .join(' ');
    this.status.textContent =
      `FPS ${g.fps.toFixed(0)}  Tick ${g.tickCount}${g.paused ? '  [PAUSE]' : ''}${g.over ? '  [ENDE]' : ''}\n` +
      `Zoom ${g.camera.zoom.toFixed(1)}  Gebäude ${g.world.allBuildings().length}  Auswahl ${g.interaction.selected ?? '–'}\n` +
      `Geld ${g.economy.money.toFixed(0)}  Verschmutzung Σ ${g.env.total('pollution').toFixed(1)}\n` +
      `Strom ${g.power.production.toFixed(0)}/${g.power.demand.toFixed(0)} kW (${(g.power.satisfaction * 100).toFixed(0)} %)\n` +
      `Kachel ${tile}\nInventar: ${inv || 'leer'}`;
  }

  /** Einfache Heatmap des gewählten Umweltfelds (nur wenn „Feld anzeigen“ aktiv). */
  private drawOverlay(ctx: CanvasRenderingContext2D, view: { minX: number; minY: number; maxX: number; maxY: number }): void {
    if (!this.overlay) return;
    const g = this.game;
    const f = this.brushField;
    const arr = g.env.field(f);
    const maxP = Math.max(1, g.env.max(f));
    const color = { pollution: '120,60,20', temperature: '255,60,30', radiation: '90,255,40', water: '200,170,60' }[f];
    for (let y = view.minY; y <= view.maxY; y++)
      for (let x = view.minX; x <= view.maxX; x++) {
        const v = arr[g.world.index(x, y)]!;
        const a =
          f === 'temperature' ? Math.abs(v - 20) / 30 : f === 'water' ? 1 - v : v / maxP; // Wasser: Trockenheit
        if (a <= 0.01) continue;
        ctx.fillStyle = `rgba(${color},${Math.min(0.75, a * 0.75)})`;
        ctx.fillRect(x, y, 1, 1);
      }
  }
}
