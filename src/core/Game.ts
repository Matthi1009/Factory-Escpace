// Zentrale Klasse: hält Welt, Renderer, Registries, Zustände und den Game-Loop.
// Module bekommen in register(game) diese Instanz und kommunizieren nur darüber.
import { EventBus, type GameEvents, type NotifyLevel } from './EventBus';
import { GameLoop, TICKS_PER_SECOND } from './GameLoop';
import { Registry } from './Registry';
import type { ActionDef, ItemDef, RecipeDef, ResearchDef } from './defs';
import { CORE_ITEMS } from './content/items';
import { CORE_RESEARCH } from './content/research';
import { World } from './world/World';
import { generateWorld } from './world/worldgen';
import { Renderer, type View } from './render/Renderer';
import { Assets } from './render/Assets';
import { _bindDrawItem } from './render/drawItem';
import { Input } from './input/Input';
import { Interaction } from './input/Interaction';
import { EnvState } from './state/Env';
import { Economy } from './state/Economy';
import { PowerGrid } from './state/Power';
import { Inventory } from './state/Inventory';
import { ResearchState } from './state/Research';
import { Stats } from './state/Stats';
import { HandCrafting } from './state/Crafting';
import type { Building, BuildingDef } from './buildings/Building';
import { drawDefaultBuilding } from './buildings/drawBuilding';
import { CHEST_DEF } from './buildings/Chest';
import { DEBUG_SOURCE_DEF } from './buildings/DebugSource';
import { WRECK_DEF } from './buildings/Wreck';
import { DebugPanel } from './debug/DebugPanel';
import { dirAngle, type Direction } from './direction';

export interface GameOptions {
  /** Element, in das Canvas und UI-Ebene eingehängt werden */
  container: HTMLElement;
  /** Seed der Weltgenerierung (Standard: ?seed=… aus der URL oder 1337) */
  seed?: number;
}

export type TickPhase = 'pre' | 'post';

export interface PlaceOptions {
  /** Vom Spieler gebaut (geht so ins Event) */
  byPlayer?: boolean;
  /** Keine Kosten abziehen und nicht prüfen */
  free?: boolean;
}

export interface RemoveOptions {
  /** Baukosten ins Inventar zurück */
  refund?: boolean;
  byPlayer?: boolean;
}

export class Game {
  static readonly TICKS_PER_SECOND = TICKS_PER_SECOND;

  readonly events = new EventBus<GameEvents>();
  readonly registries = {
    items: new Registry<ItemDef>('items'),
    buildings: new Registry<BuildingDef>('buildings'),
    recipes: new Registry<RecipeDef>('recipes'),
    research: new Registry<ResearchDef>('research'),
    actions: new Registry<ActionDef>('actions'),
  };

  readonly seed: number;
  readonly world: World;
  readonly renderer: Renderer;
  readonly assets = new Assets();
  readonly input: Input;
  readonly interaction: Interaction;
  /**
   * DOM-Ebene über dem Canvas für HTML-Oberflächen (gehört dem ui-Modul).
   * pointer-events: none – eigene Elemente brauchen pointer-events: auto.
   */
  readonly uiRoot: HTMLDivElement;

  readonly env: EnvState;
  readonly economy: Economy;
  readonly power = new PowerGrid();
  readonly inventory: Inventory;
  readonly research: ResearchState;
  readonly stats = new Stats();
  readonly crafting: HandCrafting;
  readonly debug: DebugPanel;

  /** Anzahl bisher ausgeführter Ticks */
  tickCount = 0;
  paused = false;
  /** Spiel vorbei (Sieg oder Niederlage) */
  over = false;
  /** Das Raumschiff-Wrack (ab start() gesetzt) */
  wreck: Building | null = null;

  private loop: GameLoop;
  private systems: Record<TickPhase, ((game: Game) => void)[]> = { pre: [], post: [] };
  private alpha = 0;

  constructor(opts: GameOptions) {
    const urlSeed = Number(new URLSearchParams(location.search).get('seed'));
    this.seed = opts.seed ?? (Number.isFinite(urlSeed) && urlSeed !== 0 ? urlSeed : 1337);

    this.world = new World(this.seed);
    generateWorld(this.world);

    opts.container.style.position = opts.container.style.position || 'fixed';
    this.renderer = new Renderer(opts.container, this.world);
    this.uiRoot = document.createElement('div');
    this.uiRoot.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;font-family:system-ui,sans-serif;';
    opts.container.appendChild(this.uiRoot);

    this.env = new EnvState(this.world);
    this.economy = new Economy(this.events);
    this.inventory = new Inventory(this.events);
    this.research = new ResearchState(this.events);
    this.crafting = new HandCrafting(this);

    this.input = new Input(this.renderer.canvas);
    this.interaction = new Interaction(this);
    _bindDrawItem(this.registries.items, this.assets);

    // Zentrale Inhalte
    for (const item of CORE_ITEMS) this.registries.items.register({ ...item }, { central: true });
    for (const r of CORE_RESEARCH) this.registries.research.register({ ...r, cost: {}, requires: [] }, { central: true });
    this.registries.buildings.register(CHEST_DEF);
    this.registries.buildings.register(DEBUG_SOURCE_DEF);
    this.registries.buildings.register(WRECK_DEF);

    this.renderer.addDrawHook('buildings', (ctx, view) => this.drawBuildings(ctx, view), -100);
    this.debug = new DebugPanel(this);

    this.loop = new GameLoop(
      () => this.tick(),
      (alpha, dt) => this.frame(alpha, dt),
      () => this.paused,
    );

    this.events.on('notify', ({ text, level }) => {
      if (import.meta.env.DEV) console.info(`[notify:${level}] ${text}`);
    });
  }

  /** Spielzeit in Sekunden */
  get time(): number {
    return this.tickCount / TICKS_PER_SECOND;
  }

  /** Bilder pro Sekunde */
  get fps(): number {
    return this.loop.fps;
  }

  get camera() {
    return this.renderer.camera;
  }

  /** Kurzform für world.getBuilding */
  getBuildingAt(x: number, y: number): Building | null {
    return this.world.getBuilding(x, y);
  }

  /**
   * Eigene Logik pro Tick. 'pre' läuft vor den Gebäude-Ticks, 'post' danach.
   * Rückgabe: Funktion zum Abmelden.
   */
  onTick(fn: (game: Game) => void, phase: TickPhase = 'post'): () => void {
    const list = this.systems[phase];
    list.push(fn);
    return () => {
      const i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    };
  }

  /** Startet das Spiel: Wrack platzieren, 'ready' feuern, Loop starten. Nur main.ts ruft das auf. */
  start(): void {
    const s = this.world.spawn;
    this.wreck = this.spawnBuilding(WRECK_DEF, s.x - 1, s.y - 1, 0, false);
    this.camera.centerOn(s.x, s.y);
    this.events.emit('ready', {});
    this.loop.start();
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    this.events.emit('pauseChanged', { paused });
  }

  togglePause(): void {
    if (!this.over) this.setPaused(!this.paused);
  }

  // ---------- Gebäude ----------

  /** Warum kann hier nicht gebaut werden? null = Bauen möglich. */
  placementError(defId: string, x: number, y: number, dir: Direction, opts: PlaceOptions = {}): string | null {
    const def = this.registries.buildings.get(defId);
    if (!def) return `Unbekanntes Gebäude '${defId}'`;
    if (this.over) return 'Das Spiel ist vorbei';
    if (!this.world.isAreaFree(x, y, def.size.w, def.size.h)) return 'Platz ist belegt oder nicht bebaubar';
    if (!opts.free) {
      if (!this.research.isUnlocked(def.requiresResearch)) return 'Noch nicht erforscht';
      if (!this.inventory.hasAll(def.cost)) return 'Nicht genug Material';
    }
    if (def.canPlace) {
      const r = def.canPlace(this, x, y, dir);
      if (r !== true) return typeof r === 'string' ? r : 'Kann hier nicht gebaut werden';
    }
    return null;
  }

  canPlace(defId: string, x: number, y: number, dir: Direction, opts: PlaceOptions = {}): boolean {
    return this.placementError(defId, x, y, dir, opts) === null;
  }

  /** Baut ein Gebäude (linke obere Kachel x, y). Zieht die Kosten ab, außer bei free. null = nicht möglich. */
  placeBuilding(defId: string, x: number, y: number, dir: Direction = 0, opts: PlaceOptions = {}): Building | null {
    if (this.placementError(defId, x, y, dir, opts) !== null) return null;
    const def = this.registries.buildings.require(defId);
    if (!opts.free) this.inventory.removeAll(def.cost);
    return this.spawnBuilding(def, x, y, dir, !!opts.byPlayer);
  }

  private spawnBuilding(def: BuildingDef, x: number, y: number, dir: Direction, byPlayer: boolean): Building {
    const b = def.create({ game: this, def, x, y, dir });
    this.world._occupy(b);
    b.onPlace?.();
    this.events.emit('buildingPlaced', { building: b, byPlayer });
    return b;
  }

  /** Reißt ein Gebäude ab (nicht abreißbare werden abgelehnt). refund: Kosten zurück ins Inventar. */
  removeBuilding(b: Building, opts: RemoveOptions = {}): boolean {
    if (b.removed || b.def.removable === false) return false;
    b.onRemove?.();
    this.world._release(b);
    b.removed = true;
    if (opts.refund) this.inventory.addAll(b.def.cost);
    this.events.emit('buildingRemoved', { building: b, byPlayer: !!opts.byPlayer });
    return true;
  }

  /** Fügt Schaden zu. Bei hp ≤ 0 wird das Gebäude zerstört (buildingDestroyed, beim Wrack gameOver). */
  damageBuilding(b: Building, amount: number): void {
    if (b.removed || amount <= 0 || this.over) return;
    b.hp -= amount;
    this.events.emit('buildingDamaged', { building: b, amount });
    if (b.hp <= 0) this.destroyBuilding(b);
  }

  /** Repariert um amount (höchstens bis maxHp). */
  repairBuilding(b: Building, amount: number): void {
    if (!b.removed) b.hp = Math.min(b.def.maxHp, b.hp + amount);
  }

  /** Zerstört ein Gebäude sofort (ohne Erstattung). Gilt auch für das Wrack. */
  destroyBuilding(b: Building): void {
    if (b.removed) return;
    b.hp = 0;
    b.onRemove?.();
    this.world._release(b);
    b.removed = true;
    this.events.emit('buildingDestroyed', { building: b });
    if (b === this.wreck) this.endGame(false, 'Das Raumschiff-Wrack wurde zerstört.');
  }

  /** Blockiert ein Gebäude für ticks Ticks (kein tick(), nimmt keine Items an). Verlängert nur, verkürzt nie. */
  blockBuilding(b: Building, ticks: number, reason?: string): void {
    if (b.removed || ticks <= 0) return;
    const was = b.blockedTicks > 0;
    b.blockedTicks = Math.max(b.blockedTicks, Math.round(ticks));
    if (!was) this.events.emit('buildingBlocked', { building: b, ticks: b.blockedTicks, reason });
  }

  /** Hebt eine Blockade sofort auf (z. B. PR-Kampagne). */
  unblockBuilding(b: Building): void {
    if (b.blockedTicks <= 0) return;
    b.blockedTicks = 0;
    this.events.emit('buildingUnblocked', { building: b });
  }

  isBlocked(b: Building): boolean {
    return b.blockedTicks > 0;
  }

  /** enabled, nicht blockiert, nicht entfernt */
  isActive(b: Building): boolean {
    return b.enabled && b.blockedTicks === 0 && !b.removed;
  }

  // ---------- Sonstiges ----------

  /** Startet ein Handcrafting-Rezept (Zutaten werden sofort abgezogen). false = nicht möglich. */
  handCraft(recipeId: string): boolean {
    return this.crafting.craft(recipeId);
  }

  /** Meldung an den Spieler (die UI zeigt sie an). */
  notify(text: string, level: NotifyLevel = 'info'): void {
    this.events.emit('notify', { text, level });
  }

  /** Beendet das Spiel (Sieg oder Niederlage). Danach laufen keine Ticks mehr. */
  endGame(won: boolean, reason: string): void {
    if (this.over) return;
    this.over = true;
    this.setPaused(true);
    this.interaction.select(null);
    this.events.emit('gameOver', { won, reason });
  }

  // ---------- Loop ----------

  private tick(): void {
    this.tickCount++;
    this.env._tick = this.tickCount;
    for (const fn of this.systems.pre) this.runSafe(fn);
    const list = this.world.allBuildings();
    for (let i = 0; i < list.length; i++) {
      const b = list[i]!;
      if (b.removed) continue;
      if (b.blockedTicks > 0) {
        if (--b.blockedTicks === 0) this.events.emit('buildingUnblocked', { building: b });
        continue;
      }
      if (b.enabled && b.tick) {
        try {
          b.tick();
        } catch (err) {
          console.error(`[Game] Fehler in tick() von ${b.def.id}:`, err);
        }
      }
    }
    for (const fn of this.systems.post) this.runSafe(fn);
    this.crafting._tick();
    this.power._endTick();
  }

  private runSafe(fn: (game: Game) => void): void {
    try {
      fn(this);
    } catch (err) {
      console.error('[Game] Fehler in onTick-System:', err);
    }
  }

  private frame(alpha: number, dt: number): void {
    this.alpha = alpha;
    this.interaction._frame(dt);
    this.renderer._render(this.time + (this.paused ? 0 : alpha / TICKS_PER_SECOND), this.alpha);
  }

  /** Core-Zeichnen der Gebäude (Ebene 'buildings', vor den Modul-Hooks). */
  private drawBuildings(ctx: CanvasRenderingContext2D, view: View): void {
    for (const b of this.world.allBuildings()) {
      const { w, h } = b.def.size;
      if (b.x + w < view.minX || b.y + h < view.minY || b.x > view.maxX + 1 || b.y > view.maxY + 1) continue;
      const c = b.center();
      ctx.save();
      ctx.translate(c.x, c.y);
      if (b.draw) {
        if (b.def.rotatable !== false) ctx.rotate(dirAngle(b.dir));
        try {
          b.draw(ctx, view.time);
        } catch (err) {
          console.error(`[Game] Fehler in draw() von ${b.def.id}:`, err);
        }
      } else {
        drawDefaultBuilding(ctx, b.def, b.dir);
      }
      ctx.restore();

      if (!b.enabled) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(b.x, b.y, w, h);
      }
      if (b.blockedTicks > 0) {
        // Markierung „blockiert“: gelb-rote Umrandung + Ausrufezeichen
        ctx.strokeStyle = Math.floor(view.time * 3) % 2 ? '#ffcc00' : '#ff3b30';
        ctx.lineWidth = 0.08;
        ctx.strokeRect(b.x + 0.04, b.y + 0.04, w - 0.08, h - 0.08);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(c.x - 0.05, b.y + 0.12, 0.1, 0.32);
        ctx.fillRect(c.x - 0.05, b.y + 0.5, 0.1, 0.1);
      }
      if (b.hp < b.def.maxHp) {
        const f = Math.max(0, b.hp / b.def.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(b.x + 0.05, b.y - 0.18, w - 0.1, 0.12);
        ctx.fillStyle = f > 0.5 ? '#4cd964' : f > 0.25 ? '#ffcc00' : '#ff3b30';
        ctx.fillRect(b.x + 0.07, b.y - 0.16, (w - 0.14) * f, 0.08);
      }
    }
  }
}
