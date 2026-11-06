# Architektur & Core-API

Der Core (`src/core/`) ist der **einzige Vertrag** zwischen den vier Feature-Modulen. Alles, was zwei Module voneinander wissen müssen, steht hier oder in `src/core/content/`.
Feature-Module importieren ausschließlich `from '../../core'` (Barrel-Datei `src/core/index.ts`).

```
src/
  main.ts                  erstellt Game, ruft register(game) aller Module auf, startet (fix, nie ändern)
  core/
    Game.ts                zentrale Klasse: Loop, Gebäude-Verwaltung, Schaden, Blockaden, Spielende
    GameLoop.ts            60 Ticks/s + requestAnimationFrame
    EventBus.ts            typisierte Events (GameEvents)
    Registry.ts            Registries mit Duplikat-Prüfung
    defs.ts                ItemDef, RecipeDef, ResearchDef, ActionDef, ItemCounts
    direction.ts           Dir, Direction, dirVec, opposite, rotateCW …
    random.ts              createRng, hash2, valueNoise, fbm
    content/               ZENTRALE IDs: items.ts, research.ts, tags.ts, terrain.ts, resources.ts
    world/                 World (Raster), worldgen (Seed-Generierung)
    render/                Renderer, Camera, Assets, drawItem
    buildings/             Building/BuildingDef/BaseBuilding, Chest (Referenz), DebugSource, Wreck
    state/                 Env, Economy, Power, Inventory, Research, Stats, Crafting
    input/                 Input (Tasten/Maus), Interaction (Bauen, Abriss, Pipette …)
    debug/                 F1-Debugpanel
  features/<modul>/index.ts   export function register(game: Game): void
```

---

## 1. Lebenszyklus

```ts
// src/main.ts (vereinfacht)
const game = new Game({ container });   // Welt generieren, Core-Inhalte registrieren
registerFactory(game);                   // Module: Defs registrieren, Events/Systeme anmelden
registerEnvironment(game);
registerProgression(game);
registerUi(game);
game.start();                            // Wrack platzieren → Event 'ready' → Loop starten
```

In `register(game)` nur **registrieren und anmelden**. Alles, was Inhalte anderer Module braucht (z. B. die Bauleiste alle Gebäude), erst im Event `ready` erledigen – dann sind alle Module registriert:

```ts
export function register(game: Game): void {
  game.registries.buildings.register(BELT_DEF);
  game.onTick(() => simulateBelts(game));
  game.events.on('ready', () => buildToolbar(game));
}
```

## 2. Koordinaten und Richtungen

- Welt: **256 × 256** Kacheln (`WORLD_SIZE`). `x` nach rechts, `y` nach unten. **1 Kachel = 1 Welteinheit.**
- Kachel `(x, y)` belegt die Fläche `[x, x+1) × [y, y+1)`, ihr Mittelpunkt ist `(x + 0.5, y + 0.5)`.
- Gebäude: `b.x, b.y` = **linke obere Kachel**; `b.center()` = Mittelpunkt in Weltkoordinaten.
- Spawn = `game.world.spawn` = (128, 128). Das Wrack (3×3) liegt auf (127..129, 127..129).
- Richtungen: `Dir.N = 0` (oben, −y), `Dir.E = 1` (rechts), `Dir.S = 2` (unten), `Dir.W = 3` (links).

```ts
import { Dir, dirVec, opposite, rotateCW, type Direction } from '../../core';
const { dx, dy } = dirVec(Dir.E);        // { dx: 1, dy: 0 }
opposite(Dir.N);                         // Dir.S
const n = game.world.neighbor(x, y, Dir.S);  // { x, y: y + 1 }
```

## 3. Ablauf eines Ticks (60× pro Sekunde, nicht in der Pause)

1. `tickCount++`
2. Systeme mit `game.onTick(fn, 'pre')` (u. a. Core-Handabbau)
3. **Alle Gebäude** in Platzierungs-Reihenfolge: blockierte zählen ihre Blockade herunter (kein `tick()`); sonst `tick()`, wenn `enabled`
4. Systeme mit `game.onTick(fn, 'post')` (Standard) – z. B. Verschmutzungs-Ausbreitung, Monster, Geld
5. Handcrafting-Warteschlange
6. Stromnetz-Abrechnung: `power.satisfaction` = Produktion / Bedarf dieses Ticks → gilt im nächsten Tick

```ts
game.onTick((g) => {
  if (g.tickCount % 60 === 0) g.economy.add(1, 'Grundeinkommen'); // 1× pro Sekunde
});
```

## 4. Ablauf eines Frames (requestAnimationFrame, läuft auch in der Pause)

1. Kamera-Bewegung (WASD/Pfeile)
2. Boden: ggf. neu rendern (nur nach `invalidateGround`), dann sichtbaren Ausschnitt aus dem Offscreen-Canvas kopieren
3. Ebenen in fester Reihenfolge, jeweils alle Draw-Hooks (nach `order` sortiert):

| # | Ebene | Inhalt (Beispiele) | Core zeichnet selbst |
|---|---|---|---|
| 1 | `ground` | Boden-Details über dem Terrain | Terrain + Erz (vorgerendert) |
| 2 | `overlay` | Verschmutzung, Strahlung (environment) | Debug-Heatmap (F1) |
| 3 | `buildings` | Zusätze zu Gebäuden | **alle Gebäude** (+ HP-Balken, Blockade-Markierung) |
| 4 | `items` | Items auf Bändern (factory) | – |
| 5 | `entities` | Monster, Demonstranten | – |
| 6 | `effects` | Schüsse, Explosionen, Rauch | – |
| 7 | `ui-world` | Reichweiten, Markierungen | Bau-Vorschau, Hover-Rahmen, Abbau-Fortschritt |
| 8 | `screen` | Bildschirm-Raum (CSS-Pixel), z. B. Minimap | – |

Bei Ebene 1–7 ist `ctx` in **Welt-Einheiten** (1 = 1 Kachel). Jeder Hook läuft in `ctx.save()/restore()`.

---

## 5. Core-API im Detail

### Game
```ts
game.tickCount; game.time;            // Ticks seit Start / Sekunden
game.paused; game.setPaused(true); game.togglePause();
game.over;                            // true nach endGame
game.endGame(true, 'Die Rakete ist gestartet!');   // Sieg/Niederlage → Event gameOver
game.notify('Demonstration vor dem Kohlekraftwerk!', 'warn');  // Meldung → UI
game.wreck;                           // Building des Raumschiff-Wracks
game.seed;                            // Welt-Seed (URL ?seed=123)
game.fps;
```

### Registries
Alle fünf Registries haben dieselbe API. Doppelte ID → `Error`. IDs: `a-z 0-9 _` und genau ein `:` (Präfix).
```ts
game.registries.items.register({ id: 'factory:belt_item', name: 'Band', color: '#888', shape: 'square' });
game.registries.recipes.register({
  id: 'factory:iron_plate', inputs: { iron_ore: 1 }, outputs: { iron_plate: 1 },
  time: 1.6, madeIn: ['hand', 'factory:furnace'],
});
game.registries.research.update('nuclear', { cost: { circuit: 50, steel: 50 }, requires: ['power_coal'] });
game.registries.actions.register({
  id: 'progression:pr_campaign', name: 'PR-Kampagne (5.000 €)', category: 'economy',
  run: (g) => endDemonstration(g), isAvailable: (g) => g.economy.canAfford(5000),
});
const def = game.registries.buildings.get('core:chest');   // oder require(id) → wirft, wenn unbekannt
game.registries.buildings.all().filter((d) => !d.hidden);
game.registries.buildings.onRegister((d) => console.log('neu', d.id));
```
- **items** (`ItemDef`): `id, name, color, shape?: 'circle'|'square'|'diamond'|'triangle', sprite?, description?`
- **recipes** (`RecipeDef`): `id, name?, inputs, outputs, time (Sekunden), madeIn: ('hand' | Gebäude-ID)[], requiresResearch?, category?`
- **research** (`ResearchDef`): `id, name, description?, cost, money?, time?, requires`. Die zentralen IDs sind schon registriert (leere Kosten) – progression ergänzt sie per `update`.
- **buildings** (`BuildingDef`): siehe Abschnitt 6.
- **actions** (`ActionDef`): Knöpfe, die die UI/das Debugpanel anzeigt, ohne das Modul zu kennen.

Zentrale IDs (ohne Präfix) in `src/core/content/`:
- Items: `iron_ore copper_ore coal stone granite uranium_ore iron_plate copper_plate steel gear circuit concrete uranium_fuel nuclear_waste waste rocket_part`
- Forschung: `automation logistics steel electronics concrete power_coal waste_management eco_tech nuclear ai_datacenter ai_automation defense_walls turrets force_field ropeway rocket`
- Tags: `pollutes reactor datacenter power_producer power_consumer defense waste_disposal eco storage`
- Terrain: `grass forest sand rock water dry dead wasteland ice toxic` (nur `water` ist nicht bebaubar)
- Ressourcen = Item-ID des Erzes: `iron_ore copper_ore coal stone granite uranium_ore` (unendlich)

### EventBus
```ts
const off = game.events.on('buildingPlaced', ({ building, byPlayer }) => { … });
off();                                  // abmelden
game.events.once('ready', () => { … });
game.events.emit('notify', { text: 'Hallo', level: 'info' });
```
| Event | Payload | Wer feuert |
|---|---|---|
| `ready` | `{}` | Core, nach start() |
| `buildingPlaced` | `{ building, byPlayer }` | Core |
| `buildingRemoved` | `{ building, byPlayer }` | Core (Abriss) |
| `buildingDestroyed` | `{ building }` | Core (hp ≤ 0) |
| `buildingDamaged` | `{ building, amount }` | Core |
| `buildingRotated` | `{ building }` | Core (R) |
| `buildingBlocked` / `buildingUnblocked` | `{ building, ticks, reason? }` / `{ building }` | Core |
| `buildingClicked` | `{ building, button }` | Core (Linksklick ohne Auswahl) |
| `inventoryChanged` | `{ item, count, delta }` | Core |
| `moneyChanged` | `{ money, delta, reason? }` | Core |
| `researchUnlocked` | `{ id }` | Core (research.unlock) |
| `selectionChanged` | `{ defId }` | Core |
| `craftQueued` / `craftFinished` | `{ recipeId }` | Core |
| `handMined` | `{ item, x, y }` | Core |
| `pauseChanged` | `{ paused }` | Core |
| `notify` | `{ text, level: 'info'|'warn'|'error'|'success' }` | alle → UI zeigt an |
| `gameOver` | `{ won, reason }` | Core (endGame) |

Modul-**interne** Events per Declaration Merging (im eigenen Ordner):
```ts
declare module '../../core/EventBus' {
  interface GameEvents { 'environment:monsterSpawned': { x: number; y: number } }
}
```
Modulübergreifende Events → `core-request`.

### World
```ts
const w = game.world;
w.inBounds(x, y);                 // false außerhalb oder bei nicht-ganzzahligen Koordinaten
w.getTerrain(x, y);               // 'grass' | 'water' | … | null
w.setTerrain(x, y, 'dead'); game.renderer.invalidateGround(x, y);   // danach neu zeichnen lassen!
w.isBuildable(x, y);
w.getResource(x, y);              // 'iron_ore' | … | null
w.getBuilding(x, y);              // Building | null (auch für jede Kachel großer Gebäude)
w.neighbor(x, y, Dir.N); w.neighbors4(x, y); w.neighbors8(x, y);
w.forEachInRadius(cx, cy, 5, (x, y, dist) => { … });
w.allBuildings(); w.buildingsWithTag('reactor'); w.buildingsOfType('factory:belt'); w.buildingsInRadius(cx, cy, r);
w.isAreaFree(x, y, w, h);
w.index(x, y);                    // Index für env-Arrays und w.terrain / w.resource
```

### Gemeinsame Zustände
```ts
// Inventar (Spieler)
game.inventory.add('iron_plate', 5); game.inventory.remove('iron_plate', 2);   // false wenn zu wenig
game.inventory.hasAll({ iron_plate: 2, gear: 1 }); game.inventory.removeAll({ … }); game.inventory.entries();

// Geld
game.economy.add(500, 'Umweltsünden-Bonus'); game.economy.spend(100, 'Entsorgung'); // false wenn zu wenig
game.economy.money; game.economy.canAfford(100);

// Strom (global, ohne Leitungen)
game.power.produce(1000);                     // Kraftwerk, jeden Tick
const f = game.power.consume(200);            // Verbraucher, jeden Tick → 0..1 (Versorgung letzter Tick)
progress += speed * f;
game.power.production; game.power.demand; game.power.satisfaction;

// Umwelt pro Kachel: pollution (≥0), temperature (°C, Start 20), radiation (≥0), water (0..1, Start 0.6, Wasser 1)
game.env.add('pollution', b.x, b.y, 0.05);
game.env.get('temperature', x, y); game.env.set('water', x, y, 0.2);
const arr = game.env.field('pollution');      // Float32Array, Index = world.index(x, y) – direkt schreiben erlaubt
game.env.total('pollution'); game.env.average('water'); game.env.max('radiation');  // gecacht pro Tick

// Forschung
game.research.isUnlocked('nuclear'); game.research.unlock('nuclear'); game.research.unlockedIds();
game.research.setRequestHandler((id) => startResearch(id));   // progression
game.research.request('nuclear');                              // UI: „Forschen“-Knopf
game.research.current; game.research.progress;                 // setzt progression, liest UI

// Kennzahlen für die UI
game.stats.define({ id: 'progression:sdg_score', label: 'SDG-Verfehlung', unit: '%', group: 'sdg' });
game.stats.set('progression:sdg_score', 73); game.stats.all();

// Handcrafting
game.handCraft('factory:gear');               // zieht Zutaten ab, Produkt nach recipe.time
game.crafting.check('factory:gear');          // null = ok, sonst Grund
game.crafting.queue; game.crafting.progress;
```

### Gebäude-Verwaltung, Schaden, Blockaden
```ts
const b = game.placeBuilding('core:chest', 130, 120, Dir.N);              // zieht Kosten ab; null wenn nicht möglich
game.placeBuilding('debug:source', 129, 120, Dir.E, { free: true });     // ohne Kosten/Forschung
game.placementError('core:chest', x, y, dir);                            // null oder Grund (Deutsch)
game.removeBuilding(b, { refund: true });                                // Wrack: false
game.damageBuilding(b, 25);   // hp ≤ 0 → zerstört → buildingDestroyed; beim Wrack → gameOver
game.repairBuilding(b, 10);
game.blockBuilding(b, 60 * 30, 'Demonstration');   // 30 s kein tick(), nimmt keine Items an
game.unblockBuilding(b);                            // PR-Kampagne
game.isActive(b);                                   // enabled && nicht blockiert && nicht entfernt
b.enabled = false;                                  // z. B. Stromausfall-Logik eines Moduls
```

### Rendering
```ts
const off = game.renderer.addDrawHook('entities', (ctx, view) => { … }, 0);
game.renderer.invalidateGround();                 // ganzer Boden (teuer, ~100 ms)
game.renderer.invalidateGround(x, y, w, h);       // nur ein Bereich (billig)
game.renderer.setGroundPainter((ctx, x, y, px, py, size, world) => {
  defaultGroundPainter(ctx, x, y, px, py, size, world);          // Standard + eigene Effekte
  if (game.env.get('pollution', x, y) > 5) { ctx.fillStyle = 'rgba(60,40,20,.4)'; ctx.fillRect(px, py, size, size); }
});
game.camera.x; game.camera.y; game.camera.zoom;    // Zoom 8..64 Pixel pro Kachel
game.camera.centerOn(x, y); game.renderer.screenToWorld(sx, sy); game.renderer.worldToScreen(wx, wy);
drawItem(ctx, 'iron_plate', x, y, 0.4);            // überall gleiche Optik (Farbe/Form aus ItemDef)
const img = game.assets.image('environment/monster.png');   // null → Formen zeichnen
game.uiRoot;                                        // <div> über dem Canvas für HTML-UI (pointer-events: none!)
```

### Eingabe
```ts
game.input.onKey('KeyE', (e) => toggleInventory());   // KeyboardEvent.code, kein Auto-Repeat, preventDefault
game.input.isDown('ShiftLeft'); game.input.mouseX; game.input.mouseY;
game.interaction.select('factory:belt');  game.interaction.select(null);
game.interaction.selected; game.interaction.dir; game.interaction.hover;   // { x, y } | null
game.interaction.setTool({                // eigenes Maus-Werkzeug (z. B. Ziel wählen)
  name: 'progression:pick_target',
  onTile: (x, y, button, first) => { … },
  whileHeld: (x, y, button) => { … },
  drawPreview: (ctx, view, hover) => { … },
});
game.interaction.setTool(null);          // Esc beendet Werkzeuge ebenfalls
```

### Entwickler-Hilfen
- **F1-Debugpanel:** alle registrierten Gebäude wählbar, „+100 jedes Item“, „+10.000 Geld“, „Alles erforschen“, Pause, **Umwelt-Pinsel** (Feld wählen, „Am Mauszeiger erhöhen“ aktivieren → linke Maustaste halten erhöht, rechte senkt; „Feld anzeigen“ = Heatmap), Item für `debug:source`, alle registrierten Aktionen, letzte Meldungen, Status (FPS, Strom, Kachel-Info inkl. `info()`).
- **`debug:source`**: gibt alle 10 Ticks das im Panel gewählte Item nach vorne aus (hält es, bis es angenommen wird).
- **`core:chest`**: nimmt alles an → Inventar. Das Wrack verhält sich genauso.
- **`window.game`** im Dev-Modus, z. B. `game.research.request('automation')` oder `game.env.add('pollution', 128, 128, 100)`.
- **URL `?seed=42`** für eine andere Karte.

---

## 6. Wie baue ich ein Gebäude? (am Beispiel `core:chest`)

Datei `src/core/buildings/Chest.ts` – so sieht jedes Gebäude aus:

```ts
import { BaseBuilding, type BuildingDef, type Direction, type ItemId } from '../../core';

export class Chest extends BaseBuilding {
  private flash = 0;

  // Item-Transfer-Vertrag: ein Nachbar bietet ein Item an. true = angenommen.
  acceptItem(item: ItemId, _from: Direction): boolean {
    this.game.inventory.add(item, 1);
    this.flash = 1;
    return true;
  }

  // Logik, 60× pro Sekunde (nur wenn enabled und nicht blockiert)
  tick(): void {
    if (this.flash > 0) this.flash = Math.max(0, this.flash - 0.1);
  }

  // (0,0) = Kachelmitte, Kachel = -0.5..+0.5, vorne = oben. Ohne draw(): Quadrat in def.color + Pfeil.
  draw(ctx: CanvasRenderingContext2D, _time: number): void {
    ctx.fillStyle = this.def.color;
    ctx.fillRect(-0.42, -0.36, 0.84, 0.72);
  }
}

export const CHEST_DEF: BuildingDef = {
  id: 'core:chest',             // im Modul: 'factory:furnace' usw.
  name: 'Kiste',
  size: { w: 1, h: 1 },          // vorerst 1×1
  cost: { iron_plate: 2 },       // wird beim Bauen abgezogen, beim Abriss erstattet
  maxHp: 100,
  color: '#8b5a2b',
  tags: ['storage'],             // damit andere Module das Gebäude erkennen
  rotatable: false,
  // requiresResearch: 'automation',
  // canPlace: (game, x, y) => game.world.getResource(x, y) !== null || 'Nur auf Erz',
  create: (init) => new Chest(init),
};

// in register(game):
game.registries.buildings.register(CHEST_DEF);
```

Der **Item-Transfer-Vertrag**: `acceptItem(item, from)` – `from` ist die Seite **des Empfängers**, an der das Item ankommt.
Steht eine Quelle westlich der Kiste und zeigt nach Osten, ruft sie `pushForward(item)` auf → die Kiste bekommt `from = Dir.W`.
Rückgabe `true` = Item gehört jetzt dem Empfänger. `false` = Absender behält es und versucht es später erneut.
Inaktive Gebäude (deaktiviert/blockiert) bekommen über `pushTo/pushForward` nichts angeboten.

```ts
// Band → Ofen → Band, ohne dass sich die Gebäude kennen:
class Furnace extends BaseBuilding {
  private input: ItemId | null = null;
  private output: ItemId | null = null;
  acceptItem(item: ItemId): boolean {
    if (this.input || !this.game.registries.recipes.has('factory:smelt_' + item)) return false;
    this.input = item; return true;
  }
  tick(): void {
    if (this.output && this.pushForward(this.output)) this.output = null;
    // … input verarbeiten → this.output setzen
  }
}
```

`BaseBuilding`-Helfer: `pushForward(item)`, `pushTo(dir, item)`, `buildingInFront()`, `neighborBuilding(dir)`, `frontTile()`, `sideTile(dir)`, `resourceUnder()`, `center()`, `active`, `game`, `def`.
Optionale Methoden: `tick()`, `draw(ctx, time)`, `acceptItem(item, from)`, `info(): string[]` (Zeilen für UI-Tooltips), `onPlace()`, `onRemove()`.

## 7. Wie zeichne ich eigene Dinge? (Draw-Hooks)

Alles, was kein Gebäude ist, zeichnet ein Modul über einen Hook auf der passenden Ebene. Nur Sichtbares zeichnen (`view`)!

**Items auf Bändern (factory, Ebene `items`)** – Bänder speichern ihre Items, ein Hook zeichnet alle:
```ts
game.renderer.addDrawHook('items', (ctx, view) => {
  for (const belt of belts) {
    if (belt.x < view.minX - 1 || belt.x > view.maxX + 1 || belt.y < view.minY - 1 || belt.y > view.maxY + 1) continue;
    for (const it of belt.items) {
      const { dx, dy } = dirVec(belt.dir);
      const p = it.progress - 0.5;                    // -0.5..0.5 entlang des Bands
      drawItem(ctx, it.item, belt.x + 0.5 + dx * p, belt.y + 0.5 + dy * p, 0.35);
    }
  }
});
```
(Alternativ in `draw()` des Bands – dann aber mit Rücksicht auf die Drehung des ctx.)

**Monster (environment, Ebene `entities`)** – weiche Bewegung über `view.alpha`:
```ts
game.renderer.addDrawHook('entities', (ctx, view) => {
  for (const m of monsters) {
    const x = m.prevX + (m.x - m.prevX) * view.alpha;   // zwischen letztem und aktuellem Tick
    const y = m.prevY + (m.y - m.prevY) * view.alpha;
    if (x < view.minX - 1 || x > view.maxX + 2 || y < view.minY - 1 || y > view.maxY + 2) continue;
    const img = game.assets.image('environment/monster.png');
    if (img) ctx.drawImage(img, x - 0.4, y - 0.4, 0.8, 0.8);
    else { ctx.fillStyle = '#b0306a'; ctx.beginPath(); ctx.arc(x, y, 0.35, 0, Math.PI * 2); ctx.fill(); }
  }
});
```

**Verschmutzungs-Overlay (environment, Ebene `overlay`):**
```ts
game.renderer.addDrawHook('overlay', (ctx, view) => {
  const p = game.env.field('pollution');
  for (let y = view.minY; y <= view.maxY; y++)
    for (let x = view.minX; x <= view.maxX; x++) {
      const v = p[game.world.index(x, y)]!;
      if (v < 0.5) continue;
      ctx.fillStyle = `rgba(70,50,20,${Math.min(0.6, v / 50)})`;
      ctx.fillRect(x, y, 1, 1);
    }
});
```

**Bildschirm-Raum (Ebene `screen`)**: `ctx` in CSS-Pixeln, z. B. für eine Minimap. Für Fenster/Knöpfe lieber HTML in `game.uiRoot` (Elemente brauchen `pointer-events: auto`).

Tipps: Linienbreiten in Welt-Einheiten → `ctx.lineWidth = 2 / view.zoom` ergibt 2 Pixel. Text: `ctx.font = '0.4px sans-serif'`.
