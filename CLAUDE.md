# Factory Escape

2D-Fabrikspiel (Draufsicht, Raster) im Browser: Raumschiff abgestürzt, Ressourcen abbauen, Fabriken bauen, Raketenteile bauen und abhauen.
Satire: Je mehr man die Umwelt zerstört, desto mehr Geld gibt es; Verschmutzung lässt Tiere zu Monstern mutieren, die die Basis angreifen.
TypeScript (strict) + Vite + Canvas 2D, keine Engine. Ein Core (`src/core/`) plus 4 Feature-Module, die parallel von 4 Claude-Instanzen gebaut werden.

## Befehle
Voraussetzung: Node.js ≥ 22.12.
```
npm install        # einmalig / nach Pull mit geänderter package-lock.json
npm run dev        # Dev-Server, http://localhost:5173 (F1 = Debugpanel, window.game in der Konsole)
npm run build      # Modulgrenzen-Check + Typecheck + Produktions-Build → MUSS vor jedem Commit fehlerfrei laufen
```

## HARTE REGELN
1. Arbeite **nur in deinem Feature-Ordner** `src/features/<modul>/`. Einzige Ausnahmen: Häkchen in deiner Task-Datei `docs/tasks/<modul>.md` und neue Tasten in der Tabelle unten. **In Runde 2 gilt stattdessen die Dateien-Tabelle in `docs/ROUND2.md` (Abschnitt „Runde 2“ unten): jede Datei gehört genau einem Paket.**
2. **Nie ändern:** `src/core/`, `src/main.ts`, `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `scripts/`, `.github/`, Dateien anderer Module.
3. **Keine Imports aus anderen Feature-Ordnern.** Importiere nur aus dem eigenen Ordner und aus `'../../core'` (der Build prüft das).
4. **Neue IDs immer mit Modul-Präfix:** `factory:belt`, `environment:monster`, `progression:pr_campaign`, `ui:…`. Ohne Präfix nur die zentralen IDs aus `src/core/content/`.
5. **Vor jedem Commit muss `npm run build` fehlerfrei laufen.**
6. Keine neuen npm-Pakete. Grafik aus einfachen Formen; Sprites optional nach `public/assets/<modul>/`.
7. Code-Bezeichner Englisch, Kommentare und Spieltexte Deutsch.
8. Andere Module kennst du nur über den Core: Registries, Events, gemeinsame Zustände, Gebäude-Tags.

## Wenn du eine Core-Änderung brauchst
- Gib einen **fertigen Issue-Text** aus (Titel, Begründung, gewünschte Signatur, Label `core-request`) und mach bis dahin mit einem **Workaround im eigenen Ordner** weiter.
- Core-Änderungen setzt **nur der Account um, der das Grundgerüst gebaut hat**: eigener Branch `core/<thema>`, kleiner PR, sofort mergen.
- Bestehende Core-Signaturen werden **nur erweitert, nie umbenannt oder entfernt**, damit kein Modul kaputtgeht.
- Modul-interne Events darfst du selbst per Declaration Merging ergänzen (siehe docs/ARCHITECTURE.md), modulübergreifende nicht.

## Git-Workflow
- Branch `feature/<modul>` (von `main`), **kleine Commits** nach jedem Teilschritt.
- Täglich `git pull origin main` und mergen (bzw. `git merge origin/main`), dann `npm run build`.
- Fertige Meilensteine als **Pull Request gegen `main`** (`gh pr create`), CI muss grün sein.
- Konflikt in `package-lock.json`: Version von main nehmen (`git checkout --theirs package-lock.json` beim Merge von main) und `npm install` ausführen.
- Erledigte Punkte in `docs/tasks/<modul>.md` abhaken – das ist dein Gedächtnis bei einem Neustart.

## Core-API Kurzreferenz (Details + Beispiele: docs/ARCHITECTURE.md)
```ts
import { Game, BaseBuilding, drawItem, Dir, type BuildingDef, type Building } from '../../core';
export function register(game: Game): void            // Einstieg jedes Moduls (aus main.ts aufgerufen)

// Registries (Duplikat → Error)
game.registries.items | buildings | recipes | research | actions
  .register(def) .get(id) .require(id) .has(id) .all() .update(id, patch) .onRegister(fn)

// Loop & Events
game.onTick(fn: (game) => void, phase?: 'pre' | 'post'): () => void   // 60 Ticks/s
game.events.on(name, fn): () => void   .emit(name, payload)   // Namen: siehe GameEvents
game.tickCount  game.time  game.paused  game.setPaused(b)  game.togglePause()  game.over
game.endGame(won: boolean, reason: string)  game.notify(text, level?)

// Welt (256×256, x→rechts, y→unten)
game.world.inBounds(x,y) getTerrain/setTerrain(x,y,t) getResource(x,y) getBuilding(x,y)
  neighbor(x,y,dir) neighbors4(x,y) neighbors8(x,y) forEachInRadius(cx,cy,r,fn)
  allBuildings() buildingsWithTag(tag) buildingsOfType(id) buildingsInRadius(cx,cy,r) spawn index(x,y)
game.wreck

// Gebäude
game.placeBuilding(defId,x,y,dir?,{byPlayer?,free?}) placementError(...) canPlace(...)
game.removeBuilding(b,{refund?,byPlayer?}) damageBuilding(b,n) repairBuilding(b,n) destroyBuilding(b)
game.blockBuilding(b,ticks,reason?) unblockBuilding(b) isBlocked(b) isActive(b)
class X extends BaseBuilding { tick() draw(ctx,time) acceptItem(item,from) info() onPlace() onRemove() }
  // Helfer: pushForward(item) pushTo(dir,item) buildingInFront() neighborBuilding(dir) frontTile() resourceUnder() active

// Zustände
game.inventory.count/has/hasAll/add/remove/addAll/removeAll/entries
game.economy.money add(n,reason?) spend(n,reason?):boolean canAfford(n)
game.power.produce(kw) consume(kw):satisfaction production demand satisfaction
game.env.get/set/add(field,x,y,v) field(f):Float32Array total(f) average(f) max(f)   // pollution|temperature|radiation|water
game.research.isUnlocked(id) unlock(id) unlockedIds() request(id) setRequestHandler(fn) current progress
game.stats.define({id,label,unit?,group?}) set(id,v) get(id) all()
game.handCraft(recipeId)  game.crafting.queue/progress/check(id)

// Rendering & Eingabe
game.renderer.addDrawHook(layer,(ctx,view)=>…,order?)  invalidateGround(x?,y?,w?,h?) setGroundPainter(fn)
  // layer: ground|overlay|buildings|items|entities|effects|ui-world|screen
drawItem(ctx,itemId,x,y,size)  game.assets.image(path)  game.camera  game.uiRoot (DOM-Ebene)
game.input.onKey(code,fn) isDown(code)  game.interaction.select(defId) selected dir hover setTool(tool)
```

## Tastenbelegung
Codes = `KeyboardEvent.code`. Neue Tasten **hier eintragen** (im eigenen PR) und mit `game.input.onKey` registrieren. **Runde 2: Die Tabelle ist schon vollständig (Spielfigur, Waffe, Karte, Pause); niemand ändert sie, siehe `docs/ROUND2.md` Abschnitt 5.**

| Taste | Funktion | Besitzer |
|---|---|---|
| W A S D | Spielfigur bewegen (ab Runde 2) | player |
| Pfeiltasten | Kamera bewegen, **nur im freien Kameramodus** (F1-Debugpanel); Shift = schneller | core |
| Mausrad | Zoom zum Mauszeiger | core |
| Mittlere Maustaste ziehen | Kamera verschieben, nur im freien Kameramodus | core |
| Linksklick | Bauen (mit Auswahl, Ziehen = mehrere) / Erz abbauen / Gebäude anklicken (`buildingClicked`); ab Runde 2 nur **in Reichweite** (10 Kacheln) | core |
| Rechtsklick | Abreißen (Kosten zurück), Ziehen = mehrere; ab Runde 2 nur in Reichweite | core |
| Q | Pipette: Gebäudetyp unter der Maus wählen | core |
| R / Shift+R | Drehen (Auswahl oder Gebäude unter der Maus) | core |
| P | Pause | core |
| Leertaste | Schießen (Richtung Maus, verbraucht Munition; gedrückt halten = Dauerfeuer) | player |
| Esc | Auswahl/Werkzeug aufheben; sonst Fenster schließen; sonst Pausemenü | core / ui |
| F1 | Debugpanel | core |
| 1–9 | Bauleiste | ui |
| E | Inventar | ui |
| C | Crafting-Menü | ui |
| K | Aktionen-Menü | ui |
| N | Minimap ein-/ausblenden | ui |
| M | Große Karte (Menü: Esc oder ☰) | ui |
| H | Steuerung / Hilfe | ui |
| T | Forschung | ui |
| Tab | Umwelt- und SDG-Übersicht | ui |

## Runde 2: Factorio-Look, Spielfigur, Verteidigung, Karte, Hauptmenü
Alles Wichtige steht in **[docs/ROUND2.md](docs/ROUND2.md)**: Ziele, Stilvorgabe, API-Verträge mit Fallbacks, Tasten, **welche Datei welchem Paket gehört**, Ablauf und Testen. Vier Pakete arbeiten gleichzeitig, jedes in eigenen Dateien:

| Paket | Branch | Aufgabendatei |
|---|---|---|
| ui-menu-map | `r2/ui-menu-map` | [docs/tasks/r2-ui-menu-map.md](docs/tasks/r2-ui-menu-map.md) |
| player-defense | `r2/player-defense` | [docs/tasks/r2-player-defense.md](docs/tasks/r2-player-defense.md) |
| art-world | `r2/art-world` | [docs/tasks/r2-art-world.md](docs/tasks/r2-art-world.md) |
| art-factory | `r2/art-factory` | [docs/tasks/r2-art-factory.md](docs/tasks/r2-art-factory.md) |

Regeln für Runde 2 (Kurzfassung):
- **Nur eigene Dateien ändern.** Auch jede gemeinsame Core-Datei hat genau einen Eigentümer (ROUND2.md 6.1). Brauchst du eine fremde Datei: Issue-Text mit Label `core-request`, mit dem **Fallback** (ROUND2.md 4.0) weitermachen.
- **Grafik nur in `art/`-Dateien** und nur in den Ordnern, die deinem Paket gehören. Die `draw()`-Methode eines Gebäudes ruft nur eine Funktion aus `art/` auf. **Logik bleibt unverändert.** Logikfehler: GitHub-Issue statt selbst reparieren.
- Neue Funktionen kommen in **neue Dateien**; neue Core-Dateien per **Tiefenpfad** importieren (`'../../core/state/Settings'`), `src/core/index.ts` ändert niemand.
- Vor jedem PR `git pull origin main`, `npm run build` grün, Merge mit `gh pr merge --merge`. **Zuerst M0** (klein, schnell mergen), **STOPP nach M1**, dann M2 und M3.
- Stil: schräge Draufsicht, Licht oben links, gedeckte Farben (Erdbraun, Rost, Stahlgrau, Ölschwarz, ausgeblichenes Warngelb), kräftig nur Glut/Strom/Strahlung/Status, **nicht verspielt**. Tasten: siehe Tabelle oben.
- Ziel: 60 FPS mit 500 Gebäuden (Headless-Benchmark in ROUND2.md Abschnitt 8, Referenz 5,6 ms/Frame).
