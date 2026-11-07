# Runde 2: Factorio-Look, Spielfigur, Verteidigung, Karte, Hauptmenü

Diese Datei ist der **Vertrag** zwischen vier Claude-Instanzen, die **gleichzeitig** an je einem Paket arbeiten, ohne voneinander zu wissen.
Es gibt diesmal keine gemeinsame Vorarbeit: Jedes Paket liefert seinen Teil der Grundlage selbst als kleinen ersten PR (**M0**).
Damit das ohne Konflikte geht, gelten drei Regeln, die alles Weitere bestimmen:

1. **Jede Datei gehört genau einem Paket** (Abschnitt 6). Fremde Dateien werden nicht angefasst.
2. **Alle Verträge (Abschnitt 4) sind hier als TypeScript-Signaturen festgelegt.** Jedes Paket programmiert von Anfang an dagegen und nutzt bis zur Lieferung den **Fallback** („Shim“) aus diesem Dokument.
3. **Neue Funktionen kommen in neue Dateien.** In gemeinsame Dateien kommen höchstens einzeilige Einhängepunkte, und nur vom Eigentümer der Datei.

Stand der Dinge vor Runde 2: Core und die Module `factory`, `environment`, `progression`, `ui` sind fertig. Die Grafik besteht aus einfachen Formen (Ausnahme: Ofen, Förderband und
Abbaumaschine haben aus der Grafik-Phase 1 ein erstes Industrie-Design in `src/features/factory/art/`, das **überholt** ist, siehe Abschnitt 3).
Es gibt keine Spielfigur (nur Kamera) und kein Hauptmenü.

## 1. Ziele

- **Optik:** Das Spiel soll aussehen wie eine echte Fabrik im Stil von Factorio: realistisch, ernst, dreckig-industriell, **nicht verspielt**. Keine Comic-Optik, keine runden Knubbelformen, keine knalligen Bonbonfarben, keine niedlichen Gesichter.
- **Spielfigur:** wie in Factorio, mit Reichweite, Handabbau und Handwaffe.
- **Verteidigung:** Geschütztürme mit Munition, Lasertürme mit Strom, Mauern und Tore, Reparatur.
- **Karte:** Minikarte und große Karte, auf denen man sieht, wie weit sich die Verschmutzung ausgebreitet hat.
- **Hauptmenü:** Startbildschirm, Pausemenü, Einstellungen, Steuerungshilfe, Credits.

Alle Grafiken sind **eigene Entwürfe**: keine Sprites, Logos, Namen oder Grafiken aus Factorio oder anderen Spielen. Gemeint ist nur der Stil.
Grafik wird ausschließlich selbst erzeugt (Canvas-Code, eigene SVGs, prozedurale Texturen). **Keine neuen npm-Pakete**, keine Bilder aus dem Internet, nur System-Schriften.

## 2. Die vier Pakete

| Paket | Branch | Kurzbeschreibung | Task-Datei |
|---|---|---|---|
| **ui-menu-map** | `r2/ui-menu-map` | Spielzustand, Einstellungen, Hauptmenü, Pausemenü, Game-Over/Sieg, Minikarte, große Karte, komplettes UI im Industrie-Look | [tasks/r2-ui-menu-map.md](tasks/r2-ui-menu-map.md) |
| **player-defense** | `r2/player-defense` | Spieler (Daten, Kamera, Reichweite, Kollision), Spielfigur, Handabbau, Handwaffe, Türme, Mauern, Tore, Reparatur, Monster-Verhalten | [tasks/r2-player-defense.md](tasks/r2-player-defense.md) |
| **art-world** | `r2/art-world` | Grafik-Grundlage im Core (M0a), Auslösung des Zeichencodes in `environment/` (M0b), Terrain, Erzfelder, Wasser, Bäume, sichtbare Umweltzerstörung, Monster-Optik, Kraftfeld, Effekte, Referenz-Stilprobe | [tasks/r2-art-world.md](tasks/r2-art-world.md) |
| **art-factory** | `r2/art-factory` | alle Maschinen, Förderbänder, Item-Icons, Wrack, Raketenrampe, Kernschmelze, Demonstrationen | [tasks/r2-art-factory.md](tasks/r2-art-factory.md) |

## 3. Stilvorgabe: der Factorio-Look

### Perspektive und Reihenfolge
- **Schräge Draufsicht** (3/4): Der Boden ist eine ebene Raster-Karte, aber **Gebäude haben eine sichtbare Südseite** (die Vorderkante) und **ragen nach oben über ihre Kachel hinaus**. Ein 1×1-Gebäude belegt am Boden eine Kachel; sein Körper reicht je nach Typ 0,3 bis 1,5 Kacheln nach oben (−y).
- **Zeichenreihenfolge nach y:** Gebäude, Spieler, Monster und Projektile liegen in einer gemeinsamen, nach y sortierten Ebene. Sortierschlüssel ist die **Südkante** (Füße): `b.y + b.def.size.h` bei Gebäuden, `player.y + 0.3` bei der Figur. Was weiter unten steht, liegt vorne. Technik: `renderer.addSortedDrawable` (Abschnitt 4.4).
- Klicken und Platzieren bleiben auf der **Grundfläche** (Kachelraster) – die Optik darf höher sein als die Klickfläche.

### Licht und Schatten
- Licht von **oben links**. Jede sichtbare Fläche folgt dem: Oberkanten und linke Kanten sind heller, Süd- und Ostseiten dunkler.
- **Lange, harte Schatten nach rechts unten** (Versatz etwa +0,6 / +0,4 Kacheln pro Kachel Höhe), nicht weich wie ein Heiligenschein. Schatten verschwinden bei niedrigster Detailstufe nicht ganz (dunkle Fläche genügt).
- Das Licht ist **bildschirmfest**: Es ändert sich nicht, wenn ein Gebäude gedreht wird (statische Teile im „entdrehten“ Raum zeichnen, siehe `drawBuildingSprite`).

### Palette (gedeckt, mit Verschmutzung)
Bis `art-world` M0 in `main` ist, gelten diese **vorläufigen Werte**. Danach stehen sie als benannte Slots in `src/core/art/palette.ts` (**die Slot-Namen sind fest, die Werte darf art-world feinjustieren**).

| Slot (`PALETTE.…`) | Wert | Verwendung |
|---|---|---|
| `earth` / `earthDark` / `dirt` | `#6B5A44` / `#4A3E2F` / `#3E352B` | Erdbraun, Schmutz, Ruß an Gehäusen |
| `rust` / `rustLight` / `rustDark` | `#8A4B2A` / `#B0673A` / `#5E3018` | Rost, verwitterte Kanten, Hauptakzent der Maschinen |
| `steelDark` / `steelMid` / `steelLight` / `steelWorn` | `#2A2F34` / `#555D66` / `#8E979F` / `#6C737A` | Stahlgrau: Rahmen, Platten, Rohre |
| `oil` / `soot` | `#16171A` / `#232426` | Ölschwarz: Fugen, Öffnungen, Gummi |
| `hazardFaded` / `hazardBlack` | `#C9A93A` / `#1D1E20` | ausgeblichenes Warngelb mit schwarzen Schrägstreifen |
| `concrete` | `#8C8B85` | Beton, Fundamente |
| `grass` / `grassDark` / `sand` / `rock` | `#4E6B3A` / `#3C5530` / `#B7A67A` / `#6A6862` | Gelände |
| `ember` / `emberLight` | `#FF6A1A` / `#FFD27A` | **kräftig erlaubt:** Glut, Hitze |
| `electric` | `#3FC1D0` | **kräftig erlaubt:** Strom, Bildschirme |
| `radiation` | `#9CFF3A` | **kräftig erlaubt:** Uran, Atommüll, Reaktor |
| `ledRun` / `ledWait` / `ledStop` / `ledOff` | `#4CE06A` / `#E0B030` / `#E5483B` / `#3A4047` | **kräftig erlaubt:** Status |
| `monsterPurple` / `monsterGreen` | `#6A3B86` / `#A5CC3A` | Monster: krankes Violett, Giftgrün **nur** an leuchtenden Merkmalen |

Regel: **Kräftige Farben gibt es nur für Glut, Strom, Strahlung und Status.** Alles andere ist gedeckt (Sättigung niedrig, Helligkeit mittel bis dunkel). Es gibt keine Primärfarben (reines Rot, Blau, Gelb) auf Flächen.

### Status-LEDs (für alle Maschinen gleich)
- **grün** (`ledRun`) = läuft
- **gelb** (`ledWait`) = wartet auf Input oder Output ist voll
- **rot** (`ledStop`) = blockiert (Demonstration) oder ohne Strom
- grau (`ledOff`) = aus / unbenutzt
LEDs sind klein (Durchmesser ≈ 0,1 Kachel), sitzen an der Gebäudekante und leuchten schwach nach (Glow nur ab mittlerer Detailstufe).

### Formsprache
- **Gussblöcke, Blechgehäuse, Stahlträger, Rohre, Flansche, Lüftungsgitter.** Eckig mit kleinen Fasen, nicht rund. Radius an Gehäusen höchstens 0,05 Kacheln.
- **Verschleiß:** Rost an Kanten und unten, Ruß um Schornsteine und Öffnungen, abgeplatzte Farbe, Ölflecken am Boden unter Maschinen. Als **Textur/Noise** (deterministisch, im Sprite-Cache vorgerendert), nicht als Muster.
- **Nieten und Schrauben** nur als kleine Punkte (Durchmesser ≈ 0,03 Kachel), nur bei hoher Detailstufe.
- **Dunkle, dünne Kanten** (≈ 1 Pixel) statt dicker Comic-Konturen.
- **Richtung immer lesbar:** Ausgang = Rohrstutzen/Öffnung mit Warnstreifen-Kante, Eingang = Trichter/Flansch; Förderbänder zeigen Laufrichtung durch Rillen oder Pfeile in Bewegung.
- Jedes Gebäude ist **an der Silhouette** erkennbar (Ofen = Block mit Schornstein, Kraftwerk = hoher Kamin, Rechenzentrum = flacher Block mit Rack-Reihen, …).

### Do’s und Don’ts

| Thema | Industriell (so) | Verspielt (nicht so) |
|---|---|---|
| Förderband | dunkles Gummiband mit Querrillen, abgenutzte Stahlschienen, Rostspuren | hellblaues Band mit runden Enden und Glanzpunkten |
| Ofen | schwerer Gussblock, Glut-Öffnung mit Gitter, rußiger Schornstein, Rauch | roter runder Kasten mit lächelndem „Feuer“ |
| Abbaumaschine | Stahlgehäuse mit Bohrer, Hydraulikrohre, Staub beim Arbeiten | gelber Würfel mit großem rundem Bohrer |
| Farben | Rost, Erdbraun, Stahlgrau, Ölschwarz, ausgeblichenes Gelb | Neon, reine Primärfarben, Regenbogen-Verläufe |
| Monster | asymmetrisch, Chitin, Risse, leuchtende Adern/Auswüchse, Wackeln beim Laufen | runde Kulleraugen, Zähnchen, Gesicht, Symmetrie wie ein Plüschtier |
| Spielfigur | Ingenieur im Schutzanzug mit Helm und Visier, kantiger Rucksack, Werkzeug | Strichmännchen, große Köpfe, Grinsen |
| Effekte | Rauch in Grautönen, kurze helle Funken, Staubwolken, Mündungsfeuer als Blitz | Konfetti, Sternchen, bunte Partikel |
| UI | dunkle abgenutzte Metall-Panels, Nieten, Warnstreifen an Kopfzeilen, klare Icons | runde bunte Knöpfe, Verläufe, Comic-Schriften |
| Gelände | Texturen mit Variation (Steinchen, Risse, Grasbüschel), Verschmutzung sichtbar | Einheitsfarbe, saubere Kachel-Muster |

### Detailstufen (LOD) und Leistung
- LOD 0 (weit herausgezoomt): vereinfachte Formen, kein Rost-Noise, keine Schrauben, keine Partikel, keine kleinen Animationen. LOD 1 (mittel): Rillen, LEDs, Rauch. LOD 2 (nah): Schrauben, Funken, Glow.
- Die Schwellen hängen von `settings.quality` ab (`low` früher weniger Detail, `high` später).
- **Sprite-Cache:** Statische Teile jedes Gebäudetyps je Richtung und Zoomstufe **einmal** in ein Offscreen-Canvas rendern; pro Frame nur das Bild plus die animierten Teile (Lüfter, LEDs, Glut, Partikel).
- **Ziel: 60 FPS mit 500 Gebäuden auf dem Bildschirm, ganz herausgezoomt.** Referenzwert auf `main`: 5,6 ms pro Frame im Headless-Benchmark (Abschnitt 8). Jedes Paket misst vorher und nachher; **keine Änderung darf den Wert über 10 ms bringen.**
- Partikel haben eine feste Obergrenze und werden nur im sichtbaren Bereich erzeugt.

## 4. API-Verträge

Alle Verträge sind als Signaturen festgelegt. Der **Eigentümer** liefert sie in seinem M0 (bzw. genannten Meilenstein). Bestehende Core-Signaturen werden **nur erweitert, nie umbenannt oder entfernt**.

### 4.0 Wie man gegen einen Vertrag programmiert, der noch nicht geliefert ist (Shim-Muster)
Importiert nichts, was es noch nicht gibt, und verlasst euch nicht auf Typen, die erst der Eigentümer in `main` bringt. Jedes Paket legt bei Bedarf **in seinem eigenen Ordner** eine Datei `contracts.ts` an (Name frei) und liest alles **lazy** (beim Zeichnen/Ticken, **nie** in `register()`: `ui` registriert als Letztes, `game.settings` und `game.state` existieren zu dem Zeitpunkt noch nicht).

```ts
// contracts.ts (eigene Kopie im eigenen Paket, z. B. src/features/<modul>/contracts.ts)
import type { Game, EventBus } from '../../core';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';
export interface SettingsLike { quality: 'low' | 'medium' | 'high'; screenShake: boolean; particles: boolean; minimap: boolean }
const DEFAULT_SETTINGS: SettingsLike = { quality: 'medium', screenShake: true, particles: true, minimap: true };

/** Einstellungen; Standardwerte, solange ui-menu-map M0 nicht gemerged ist. */
export function settingsOf(game: Game): SettingsLike {
  return (game as unknown as { settings?: SettingsLike }).settings ?? DEFAULT_SETTINGS;
}
/** Spielzustand; leitet ihn aus den bekannten Feldern ab, solange game.state fehlt. */
export function stateOf(game: Game): GameState {
  const s = (game as unknown as { state?: GameState }).state;
  return s ?? (game.over ? 'gameover' : game.paused ? 'paused' : 'playing');
}
/** Event abonnieren, auch wenn der Event-Name noch nicht in GameEvents steht. */
export function onEvent(game: Game, name: string, fn: (payload: any) => void): () => void {
  return (game.events as unknown as EventBus<Record<string, any>>).on(name, fn);
}
/** Spieler; null, solange player-defense M0 nicht gemerged ist. */
export function playerOf(game: Game): { x: number; y: number; facing: number; hp: number; maxHp: number; alive: boolean } | null {
  return (game as unknown as { player?: { x: number; y: number; facing: number; hp: number; maxHp: number; alive: boolean } }).player ?? null;
}
/** Reichweite; ohne Spieler-Vertrag immer erreichbar. */
export function inReach(game: Game, x: number, y: number): boolean {
  const f = (game as unknown as { inReach?: (x: number, y: number) => boolean }).inReach;
  return f ? f.call(game, x, y) : true;
}
/** In die nach y sortierte Ebene zeichnen; Fallback: Ebene 'entities' (ohne Sortierung). */
export function addSorted(game: Game, obj: { readonly y: number; readonly x?: number; draw(ctx: CanvasRenderingContext2D, view: any): void }): () => void {
  const r = game.renderer as unknown as { addSortedDrawable?: (o: typeof obj) => () => void };
  return r.addSortedDrawable ? r.addSortedDrawable(obj) : game.renderer.addDrawHook('entities', (ctx, view) => obj.draw(ctx, view));
}
```

Sobald der Eigentümer geliefert hat, **bleibt der Shim stehen** (er ist harmlos); man darf ihn später auf die echten Typen umstellen.

### 4.1 Spielzustand (Eigentümer: ui-menu-map, M0)
Datei: `src/core/state/GameState.ts` (neu). **`Game.ts` wird dafür nicht geändert**: Die Zustandsmaschine wird von `installGameState(game)` nachgerüstet (aufgerufen aus `register()` des ui-Moduls), per Interface-Merging typisiert.

```ts
export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';

declare module '../Game' {
  interface Game {
    /** Aktueller Zustand. Ohne ?start=1 beginnt das Spiel im Zustand 'menu'. */
    readonly state: GameState;
    setState(state: GameState): void;
    /** menu → playing (Start-Knopf) */
    startPlaying(): void;
    /** Neues Spiel: lädt die Seite mit ?seed=<seed>&start=1 neu (kein Modul muss etwas zurücksetzen). */
    newGame(seed?: number): void;
    /** Zurück ins Hauptmenü: lädt die Seite mit ?seed=<aktueller seed> (ohne start=1) neu. */
    backToMenu(): void;
  }
}
declare module '../EventBus' {
  interface GameEvents { stateChanged: { state: GameState; prev: GameState } }
}
```
Verhalten:
- **Die Logik tickt nur bei `playing`.** Umsetzung ohne `Game.ts`-Änderung: Der Zustand steuert `game.setPaused(state !== 'playing')`. Weil auch `P` (`game.togglePause()`) das Feld `paused` umschaltet, synchronisiert die Maschine über das bestehende Event `pauseChanged`: `playing ⇄ paused` folgt `paused`; schaltet jemand in `menu`, `gameover` oder `victory` die Pause **aus**, wird sofort wieder pausiert.
- `gameOver`-Event des Core (`endGame`) → Zustand `victory` (won) bzw. `gameover`.
- `game.paused` und `game.over` bleiben unverändert bestehen: `paused` ist `true` in allen Zuständen außer `playing`.
- `?start=1` in der URL → Start in `playing`, sonst `menu`. Im Zustand `menu` wird die Welt gezeichnet; eine langsame Kamerafahrt läuft (macht ui-menu-map).
- **Esc:** Ist etwas ausgewählt (`game.interaction.selected` oder `.tool`), hebt Esc nur die Auswahl auf (macht weiter `Interaction.ts`). Sonst: offene Fenster schließen, sonst `playing ⇄ paused` (Pausemenü). Umsetzung im ui-Modul **ohne Änderung an `Interaction.ts`**: ein Listener in der Capture-Phase merkt sich vor dem Core-Handler, ob etwas ausgewählt war.

```ts
let hadSelection = false;
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') hadSelection = game.interaction.selected !== null || game.interaction.tool !== null;
}, true); // Capture: läuft vor den Handlern des Core
game.input.onKey('Escape', () => {
  if (hadSelection) return;                 // Core hat nur die Auswahl aufgehoben
  if (closeOpenWindows()) return;           // erst Fenster schließen
  if (game.state === 'playing') game.setState('paused');
  else if (game.state === 'paused') game.setState('playing');
});
```
- **Fallback** für alle anderen Pakete: `stateOf(game)` aus Abschnitt 4.0.

### 4.2 Einstellungen (Eigentümer: ui-menu-map, M0)
Datei: `src/core/state/Settings.ts` (neu), nachgerüstet durch `installSettings(game)`.

```ts
export type Quality = 'low' | 'medium' | 'high';
export interface SettingsData {
  quality: Quality;      // Grafikqualität: verschiebt LOD-Schwellen und Partikel-Obergrenze (Standard 'medium')
  screenShake: boolean;  // Bildschirm-Wackeln, z. B. Kernschmelze (Standard true)
  particles: boolean;    // Partikel (Rauch, Funken, Brocken …) (Standard true)
  minimap: boolean;      // Minikarte anzeigen (Standard true)
}
export class Settings implements SettingsData {
  set<K extends keyof SettingsData>(key: K, value: SettingsData[K]): void; // speichert und meldet 'settingsChanged'
  values(): SettingsData;
}
declare module '../Game' { interface Game { readonly settings: Settings } }
declare module '../EventBus' { interface GameEvents { settingsChanged: { key: keyof SettingsData; value: unknown } } }
```
- Gespeichert in `localStorage` unter dem Schlüssel `factory-escape:settings` (JSON), **jeder Zugriff in try/catch** (privater Modus, gesperrter Speicher).
- **Wer es nutzt (alle lazy lesen!):** `art-world` (LOD-Schwellen, Partikel-Obergrenze), `art-factory` (Kernschmelze-Wackeln: nur wenn `screenShake`), `ui-menu-map` (Einstellungen-Menü, Minikarte), `player-defense` (Partikel).
- **Fallback:** `settingsOf(game)` aus Abschnitt 4.0.

### 4.3 Spieler (Eigentümer: player-defense, M0)
Dateien: `src/core/player/` (neu: `PlayerState.ts`, `installPlayer.ts`, `cameraFollow.ts`), eingehängt aus `register()` von `src/features/player/index.ts`. **`Game.ts` wird nicht geändert** (Interface-Merging + Installation).

```ts
/** Reichweite in Kacheln für Bauen, Abreißen, Handabbau, Bedienen. */
export const REACH = 10;

export class PlayerState {
  x: number; y: number;          // Kacheln (Kommazahlen); (x, y) = Position der Füße
  facing: number;                // Blickrichtung in Radiant: 0 = Osten, π/2 = Süden
  hp: number; maxHp: number;     // Standard 100
  alive: boolean;
  get dir8(): number;            // 0 = N, 1 = NO, 2 = O, 3 = SO, 4 = S, 5 = SW, 6 = W, 7 = NW
}

declare module '../Game' {
  interface Game {
    readonly player: PlayerState;
    /** Schaden; nur im Zustand 'playing'. Bei 0 HP: alive = false und Event 'playerDied'. */
    damagePlayer(amount: number): void;
    /** Neben dem Wrack wiederbeleben, volle HP, Event 'playerRespawned'. (Die 10-s-Wartezeit macht das Modul player.) */
    respawnPlayer(): void;
    /** Bewegt mit Kollision (Achsen getrennt, Radius 0,3). Gibt zurück, ob er sich bewegt hat. Event 'playerMoved'. */
    movePlayer(dx: number, dy: number, face?: boolean): boolean;
    /** Liegt (x, y) in Kacheln innerhalb von REACH Kacheln um den Spieler? Immer true, wenn reachEnabled === false. */
    inReach(x: number, y: number): boolean;
    /** Darf der Spieler auf diesem Punkt stehen? Gebäude, Mauern und Wasser blockieren; Gebäude mit Tag 'gate' nicht. */
    isWalkable(x: number, y: number): boolean;
    /** Reichweite aktiv? Im F1-Debugpanel abschaltbar. */
    reachEnabled: boolean;
    /** 'follow': Kamera folgt dem Spieler (Standard, nicht im Menü). 'free': freie Kamera mit Pfeiltasten (F1-Debugpanel). */
    cameraMode: 'follow' | 'free';
    /** Mausposition in Welt-Koordinaten (Kacheln). */
    mouseWorld(): { x: number; y: number };
  }
}
declare module '../EventBus' {
  interface GameEvents {
    playerMoved: { x: number; y: number };
    playerDamaged: { amount: number; hp: number };
    playerDied: {};
    playerRespawned: {};
  }
}
```
- Die Kamera folgt dem Spieler **nicht im Zustand `menu`** (dort läuft die Kamerafahrt des Menüs). Bis `game.state` existiert, gilt: immer folgen.
- Außerhalb der Reichweite zeigt die Platzier-Vorschau rot mit dem Hinweis „Außer Reichweite“; Bauen, Abreißen, Handabbau, Drehen und Anklicken (`buildingClicked`) sind dann blockiert (Meldung „Zu weit weg“).
- **Fallback** (für ui, art, …): `playerOf(game)` (kann `null` sein), `inReach(game, x, y)` aus Abschnitt 4.0.
- **Monster-Positionen für die Karten** (Eigentümer: player-defense, M3): `game.getMonsters?(): Iterable<{ x: number; y: number; kind?: string }>` ist optional; fehlt es, zeichnet die Karte keine Monster.

### 4.4 Grafik-Grundlage (Eigentümer: art-world, M0a)
Dateien: `src/core/render/Renderer.ts`, `src/core/Game.ts` (**nur** die Gebäude-Zeichnung), `src/core/art/**`.

```ts
export interface SortedDrawable {
  /** Sortierschlüssel in Kacheln: Position der Füße bzw. Südkante. Darf ein Getter sein (bewegte Objekte). */
  readonly y: number;
  /** Optional fürs Culling: Mitte (x, cy) und Radius in Kacheln (Standard 3). Ohne x wird immer gezeichnet. */
  readonly x?: number; readonly cy?: number; readonly radius?: number;
  draw(ctx: CanvasRenderingContext2D, view: View): void; // ctx in Welt-Einheiten (1 = 1 Kachel); läuft in save()/restore()
}
class Renderer {
  /** Gemeinsame, nach y sortierte Ebene für Gebäude, Spieler, Monster, Projektile. Rückgabe: Abmelden. */
  addSortedDrawable(obj: SortedDrawable): () => void;
  removeSortedDrawable(obj: SortedDrawable): void;
}
```
- Neue Ebene `'sorted'` zwischen `'overlay'` und `'buildings'`. Die Gebäude des Core werden darüber gezeichnet (nicht mehr in der Ebene `'buildings'`), die bestehenden Hooks der anderen Ebenen bleiben.
- **Bereits vorhanden (aus Phase 1, in `main`) und stabil**: `src/core/art/` mit `PALETTE`, `shade/mix/alpha`, `lodOf`, `pxPerTile`, `drawMetalPanel`, `drawHazardStripes`, `drawBolts`, `drawPipeStub`, `drawFan`, `drawStatusLed`, `drawShadow`, `drawGlow`, `roundRectPath`, `withDir`, `drawSprite`, `drawBuildingSprite`, `clearSpriteCache`, `ParticleSystem`, `particlesOf(game)`. Diese Namen und Signaturen bleiben (nur Erweiterung).
- art-world M0a ergänzt: Palette-Slots aus Abschnitt 3 (zusätzlich zu den vorhandenen), `setLodQuality(q)` (LOD-Schwellen nach `settings.quality`), Partikel-Arten `'chunk'` (Brocken) und `'shell'` (Hülsen), Partikel respektieren `settings.particles` und eine Obergrenze je Qualität.
- **Fallback:** `addSorted(game, obj)` aus Abschnitt 4.0. Partikel-Arten `chunk`/`shell` gibt es erst nach art-world M0a; bis dahin `'dust'` bzw. `'spark'` verwenden.

### 4.5 Neue zentrale IDs (Eigentümer: player-defense, M0)
- Tag `gate` in `src/core/content/tags.ts` (Tor: der Spieler darf hindurch, Monster nicht).
- Items in `src/core/content/items.ts`: `ammo` (Munition), `ammo_piercing` (panzerbrechende Munition), `repair_pack` (Reparaturpaket).
- Rezepte in `src/features/factory/recipes.ts` (nur diese drei, keine anderen Änderungen dort):
  - `factory:ammo`: 2 `iron_plate` → 4 `ammo`, 1 s, `madeIn: ['hand', 'factory:assembler']`
  - `factory:ammo_piercing`: 1 `steel` + 2 `copper_plate` → 3 `ammo_piercing`, 2 s, `requiresResearch: 'turrets'`
  - `factory:repair_pack`: 3 `iron_plate` + 2 `gear` → 1 `repair_pack`, 3 s
- **Fallback:** Wer die IDs vorher braucht, prüft zur Laufzeit `game.registries.items.has('ammo')`; die Optik behandelt unbekannte Item-IDs mit der Standardform von `drawItem`.

### 4.6 Neue Gebäude-IDs der Verteidigung (Eigentümer: player-defense)
Bestehende IDs bleiben, damit Forschung und Registrierung stabil sind: `environment:turret` (Geschützturm), `environment:wall` (Mauer), `environment:force_field` (Kraftfeld; Logik player-defense, Optik art-world). Neu: `environment:laser_turret` (Laserturm, Strom, Forschung `turrets`), `environment:gate` (Tor, Tag `gate`, Forschung `defense_walls`).

## 5. Tasten

Codes sind `KeyboardEvent.code`. **Die Tastentabelle in `CLAUDE.md` ist bereits vollständig geschrieben, niemand ändert sie.**

| Taste | Funktion | Paket |
|---|---|---|
| W A S D | Spielfigur bewegen | player-defense |
| Pfeiltasten | Kamera bewegen, **nur im freien Kameramodus** (F1-Debugpanel); Shift = schneller | player-defense |
| Leertaste | schießen (Richtung Maus, verbraucht `ammo`; gedrückt halten = Dauerfeuer) | player-defense |
| M | große Karte ein-/ausblenden | ui-menu-map |
| Esc | Auswahl aufheben; sonst Fenster schließen; sonst Pausemenü | ui-menu-map |
| 1–9, E, C, T, Tab, K, N, H | wie bisher (Bauleiste, Inventar, Crafting, Forschung, Übersicht, Aktionen, Minikarte ein/aus, Steuerung/Hilfe) | ui-menu-map |
| P, Q, R, F1, Mausrad, Linksklick, Rechtsklick | wie bisher | core |
| Mittlere Maustaste ziehen | Kamera verschieben, **nur im freien Kameramodus** | player-defense |

Die Taste **M** war bisher das alte ui-Menü; ab Runde 2 öffnet das Menü **Esc** (oder der ☰-Knopf), M gehört der großen Karte.

## 6. Eigentum an Dateien

**Jede Datei gehört genau einem Paket.** Wer eine Datei braucht, die ihm nicht gehört, gibt einen Issue-Text mit Label `core-request` aus und arbeitet mit dem Fallback weiter (siehe Start-Prompts). Das gilt auch für **jede** gemeinsame Core-Datei.

### 6.1 Gemeinsame Core-Dateien (je genau ein Eigentümer)

| Datei | Eigentümer | Was |
|---|---|---|
| `src/core/Game.ts` | **art-world** | nur die Gebäude-Zeichnung (Gebäude als sortierte Objekte anmelden/abmelden, `drawBuildings` entfernen). **ui-menu-map und player-defense ändern `Game.ts` nicht**, sie rüsten per Interface-Merging nach. |
| `src/core/render/Renderer.ts` | **art-world** | sortierte Ebene; Boden-Painter wandert nach `src/core/art/terrain.ts` (`Renderer` re-exportiert ihn, damit die API bleibt) |
| `src/core/render/Camera.ts` | **player-defense** | Folgen/Frei-Modus (nur ergänzen) |
| `src/core/input/Interaction.ts`, `src/core/input/Input.ts` | **player-defense** | Reichweite, WASD, Kamera-Tasten (der **Esc**-Handler dort bleibt unverändert) |
| `src/core/debug/DebugPanel.ts` | **player-defense** | Schalter „Freie Kamera“ und „Reichweite“ |
| `src/main.ts` | **player-defense** | genau eine Zeile: `registerPlayer(game)` (vor `registerUi`) |
| `src/core/content/items.ts`, `src/core/content/tags.ts` | **player-defense** | `ammo`, `ammo_piercing`, `repair_pack`, Tag `gate` |
| `src/core/index.ts` (Barrel) | **niemand** | Neue Core-Dateien werden per **Tiefenpfad** importiert (`'../../core/state/Settings'`; der Grenz-Check erlaubt Importe aus `src/core`). Nicht ins Barrel eintragen. |
| `src/core/EventBus.ts`, `src/core/defs.ts` und alle übrigen Core-Dateien | **niemand** | neue Events per Interface-Merging in der **eigenen** neuen Datei (siehe 4.1–4.3) |
| `package.json`, `package-lock.json`, Configs, `scripts/`, `.github/` | **niemand** | keine neuen npm-Pakete |
| `CLAUDE.md`, `README.md`, `docs/ROUND2.md`, `docs/TEAM.md`, `docs/ARCHITECTURE.md` | **niemand** (nur der Verfasser dieser Anleitung) | Änderungswünsche als Issue |

### 6.2 Eigentum je Paket (alles andere darf das Paket nicht ändern)

| Paket | Exklusive Dateien und Ordner |
|---|---|
| **ui-menu-map** | `src/features/ui/**`; `src/features/factory/dialogs/**` (Rezept-Dialog: Optik und `data-esc-closable`); neue Core-Dateien `src/core/state/GameState.ts`, `src/core/state/Settings.ts`; `docs/screenshots/r2-ui-menu-map/**`; `docs/tasks/r2-ui-menu-map.md` |
| **player-defense** | `src/features/player/**`; neue Core-Dateien `src/core/player/**`; die Core-Dateien aus 6.1 (Camera, Interaction, Input, DebugPanel, main.ts, items.ts, tags.ts); `src/features/factory/recipes.ts` (nur die drei Rezepte); in `src/features/environment/`: `defense/**` (Logik), `monsters/**` (Logik: Zielwahl, Wegfindung, Angriffe), `art/defense-*.ts` (Optik der Verteidigung und der Spielfigur-Effekte); `docs/screenshots/r2-player-defense/**`; `docs/tasks/r2-player-defense.md` |
| **art-world** | `src/core/art/**` **außer** `items*`, `wreck*`, `buildings*`; `src/core/render/Renderer.ts`; `src/core/Game.ts` (nur Zeichnung); in `src/features/environment/`: `art/**` **außer** `defense-*`, `terrain.ts`, `overlay.ts`, `effects.ts`, `index.ts` (nur die Zeile `registerArt(game)`); `docs/ART_STYLE.md`, `docs/ART_STATUS.md`, `docs/screenshots/reference/**`, `docs/screenshots/r2-art-world/**`; `docs/tasks/r2-art-world.md` |
| **art-factory** | `src/features/factory/art/**`; `src/features/progression/art/**`; `src/core/art/items*`, `src/core/art/wreck*`, `src/core/art/buildings*`; **nur Zeichencode** (`draw()`, Zeichen-Hooks) in `src/features/factory/buildings/*.ts`, `src/features/factory/index.ts` (Hook-Zeilen), `src/features/progression/{demonstrations,meltdown,rocket,index}.ts`, `src/core/render/drawItem.ts`, `src/core/buildings/{Chest,DebugSource,Wreck,drawBuilding}.ts`; `docs/screenshots/r2-art-factory/**`; `docs/tasks/r2-art-factory.md` |

Regeln dazu:
- **Logik bleibt unberührt.** `tick()`, `acceptItem()`, Balancing-Werte, Rezepte, Registrierungen und IDs ändert in Runde 2 niemand – **Ausnahmen**: die drei Rezepte (player-defense) und die Verteidigungs-/Monster-Logik (player-defense, ab M2). Fällt jemandem ein Logikfehler auf: **GitHub-Issue** (`gh issue create`, Label nach Modul), nicht selbst reparieren.
- **Datenstrukturen, die Art-Dateien lesen** (z. B. `Monster` in `environment/monsters/types.ts`, Gebäudezustände), dürfen **nur erweitert** werden, nie umbenannt oder entfernt.
- **Die Zeichen-Dateien greifen auf Logik nur lesend zu.** Die `draw()`-Methode eines Gebäudes ruft nur noch eine Funktion aus `art/` auf und reicht den nötigen Zustand als Parameter durch (siehe `src/features/factory/buildings/Furnace.ts` → `art/furnaceArt.ts`).
- **Screenshots** und Notizen jedes Pakets liegen in dessen eigenem Ordner `docs/screenshots/r2-<paket>/`, nie in fremden.
- **Einhängepunkte** in einer gemeinsamen Datei sind einzeilig (z. B. in `environment/index.ts`: `registerArt(game);`) und nur vom Eigentümer der Datei.

### 6.3 Übergabe in `src/features/environment/` (drei Pakete, eine Reihenfolge)
Im Ordner `environment` arbeiten art-world und player-defense. Damit sie nie dieselbe Datei gleichzeitig ändern:
1. **art-world M0b** löst **zuerst** den gesamten Zeichencode aus `environment/` in `environment/art/` heraus (`effects.ts`, `overlay.ts`, Boden-Painter in `terrain.ts`, Zeichnen in `monsters/MonsterManager.ts` und `monsters/waves.ts`, `defense/Wall.ts`, `defense/Turret.ts`, `defense/ForceField.ts`). In diesem Schritt (und nur dort) darf art-world die Logik-Dateien berühren, rein mechanisch (Zeichencode verschieben, optisch **unverändert**).
2. **player-defense arbeitet in `environment/` erst ab M2** und erst, nachdem art-world **M0b** in `main` ist. M0 und M1 von player-defense berühren `environment/` nicht.
3. Nach art-world M0b gehören `environment/defense/**` und `environment/monsters/**` player-defense; `environment/art/forcefield.ts` bleibt bei art-world, `environment/art/defense-wall.ts` und `defense-turret.ts` gehen an player-defense (sie ersetzt sie durch die neue Verteidigungs-Optik).

## 7. Ablauf

### Meilensteine
- **M0 – Grundlage, klein halten, schnell mergen** (Ziel: in etwa 30 Minuten gemerged). Jedes Paket liefert seinen Teil der Verträge aus Abschnitt 4. M0 enthält kein Feature und kein Design. **art-world** hat die größte Grundlage und liefert sie in **zwei PRs**: **M0a** (sortierte Ebene, Palette, LOD, Partikel, Referenz-Stilprobe) und **M0b** (Zeichencode aus `environment/` herauslösen).
- **M1 – erstes sichtbares Ergebnis** (1–2 Sessions). **STOPP nach M1**: Screenshot-Pfade, 5 Zeilen Beschreibung, auf OK warten.
- **M2, M3** ohne Rückfragen.

### Abhängigkeiten
- **M0 hängt von keinem anderen M0 ab.** Alle M0 (art-world M0a und M0b, art-factory M0, player-defense M0, ui-menu-map M0) können sofort und gleichzeitig starten.
- **art-factory M1 wartet auf art-world M0a** (neue Palette, Referenz-Stilprobe, sortierte Ebene).
- **player-defense M2 wartet auf art-world M0b** (Übergabe in `environment/`, Abschnitt 6.3).
- Sonst keine harten Abhängigkeiten; alles andere läuft über Fallbacks (4.0).

### Empfohlene Merge-Reihenfolge der M0-PRs
1. art-world M0a, danach M0b (größter Umbau; art-factory M1 und player-defense M2 hängen daran)
2. art-factory M0 (mechanisch, nur `art/`-Auslagerung)
3. player-defense M0 (Spieler im Core, Interaction, main.ts)
4. ui-menu-map M0 (Zustand, Einstellungen, Esc)
Reihenfolge ist nur eine Empfehlung: Jeder M0 ist unabhängig lauffähig. Danach M1–M3 in beliebiger Reihenfolge, ein PR pro Meilenstein.

### Git-Regeln (für alle)
- Branch `r2/<paket>` von `main`. **Commit nach jedem Teilschritt.** Erledigte Punkte in der eigenen Task-Datei abhaken: Das ist das Gedächtnis bei einem Neustart.
- **Vor jedem PR:** `git pull origin main` (mergen), `npm run build` muss grün sein, dann PR, grünen CI abwarten, Merge mit `gh pr merge --merge` (kein Squash), danach `main` zurückholen.
- Konflikt in `package-lock.json`: Version von `main` nehmen, `npm install` ausführen (sollte nicht vorkommen: niemand ändert Pakete).
- Konflikt in einer **fremden** Datei: **STOPP und nachfragen.** Konflikt in der eigenen Datei: lösen, bauen, testen.
- Je kleiner der PR, desto weniger Konflikte: lieber mehrere kleine PRs als ein großer.

### Wo Konflikte trotzdem möglich bleiben
- `environment/` (drei Beteiligte): nur über die Reihenfolge in 6.3 geregelt.
- `src/core/art/` wird von art-factory **gelesen** (Palette, Helfer); art-world darf dort nichts umbenennen oder entfernen.
- Die Datenstrukturen in `environment/monsters/types.ts` und `MonsterManager` (art-world liest, player-defense schreibt): nur erweitern.
- `docs/TEAM.md`: Jeder Mensch trägt seinen Account in **seiner** Zeile ein (Einzeiler); bei Konflikt beide Zeilen behalten.

## 8. Testen

### Debugpanel (F1) und URL
- `http://localhost:5173/?seed=7&start=1` startet direkt im Spiel (ohne `start=1` zeigt das Spiel, sobald ui-menu-map M0 gemerged ist, das Menü). `?seed=…` wählt die Karte.
- F1: „+100 jedes Item“, „+10.000 Geld“, „Alles erforschen“, Umwelt-Pinsel (Verschmutzung malen), Gebäude wählen, Aktionen (z. B. Angriffswelle, Monster spawnen). Nach player-defense M0: Schalter „Freie Kamera“ und „Reichweite“.
- `window.game` in der Konsole (nur im Dev-Server).

### Screenshots im Headless-Browser (ohne eigenen Netzwerk-Port)
Chromium startet mit einem lokalen Debug-Port, ein Node-Skript steuert ihn über die in Node ≥ 22 eingebaute WebSocket-Klasse. **Kein HTTP-Server, kein neues npm-Paket.** Skript nur im Scratchpad/`/tmp` ablegen, **nicht** ins Repo.

```js
// shot.mjs – Aufruf: node shot.mjs <url> <skript.js> <ziel.png> [breite hoehe]
// Startet Chromium, lädt die URL, führt skript.js im Seitenkontext aus (async, mit `return`), speichert einen Screenshot.
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const [url, script, out, w = '1280', h = '720'] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn('chromium', ['--headless=new', '--no-sandbox', '--remote-debugging-port=9333', '--user-data-dir=/tmp/shot-profile', 'about:blank'], { stdio: 'ignore' });
let page; for (let i = 0; i < 40 && !page; i++) { try { page = (await (await fetch('http://localhost:9333/json')).json()).find((t) => t.type === 'page'); } catch {} await sleep(500); }
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); pending.get(d.id)?.(d); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url }); await sleep(3000);
const r = await send('Runtime.evaluate', { expression: `(async()=>{${readFileSync(script, 'utf8')}})()`, awaitPromise: true, returnByValue: true, timeout: 600000 });
console.log(JSON.stringify(r.result.result?.value ?? r.result.exceptionDetails?.exception?.description));
writeFileSync(out, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
chrome.kill(); process.exit(0);
```
Beispiel-Szene (`szene.js`): Gebäude per `game.placeBuilding('factory:furnace', x, y, dir, { free: true })` setzen, dann `game.camera.zoom = 56; game.camera.centerOn(x, y);` und ein paar Frames laufen lassen (`game.tick()` mehrfach, dann `game.renderer._render(game.time, 0.5)`). Aufnahmen **nah (Zoom 48–64), mittel (≈ 24–32) und weit (≈ 10–14)**. **Ansehen** (Bild lesen) und prüfen: Wirkt es ernst und industriell? Stimmen Richtung, Überlappung, Lesbarkeit der Items?

### FPS-Messung (Ziel 60 FPS mit 500 Gebäuden)
Mit dem gleichen Skript (`szene.js` = Benchmark): 500 Gebäude setzen (z. B. 60 `factory:miner` auf Erzkacheln, 264 `factory:belt`, 88 `factory:furnace`, 88 `core:chest`), ganz herauszoomen und die Renderzeit messen:

```js
const g = window.game; g.camera.zoom = 8; g.camera.centerOn(130, 150);
for (let k = 0; k < 20; k++) g.renderer._render(k / 60, 0.5);          // Aufwärmen (füllt Sprite-Caches)
const t0 = performance.now(); const N = 200;
for (let k = 0; k < N; k++) g.renderer._render(k / 60, 0.5);
const ms = (performance.now() - t0) / N;
return `${ms.toFixed(2)} ms/Frame (≙ ${(1000 / ms).toFixed(0)} FPS max)`;
```
**Referenz auf `main` vor Runde 2: 5,6 ms/Frame bei Zoom 8.** Jedes Paket schreibt **Wert vorher und nachher** in seine Task-Datei und in den PR. Über **10 ms** ist zu langsam: Sprite-Cache und LOD nachbessern, sonst STOPP und nachfragen.
