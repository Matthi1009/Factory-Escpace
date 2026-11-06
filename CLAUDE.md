# Factory Escape

2D-Fabrikspiel (Draufsicht, Raster) im Browser: Raumschiff abgestürzt, Ressourcen abbauen, Fabriken bauen, Raketenteile bauen und abhauen.
Satire: Je mehr man die Umwelt zerstört, desto mehr Geld gibt es; Verschmutzung lässt Tiere zu Monstern mutieren, die die Basis angreifen.
TypeScript (strict) + Vite + Canvas 2D, keine Engine. Ein Core (`src/core/`) plus 4 Feature-Module, die parallel von 4 Claude-Instanzen gebaut werden.

## Befehle
```
npm install        # einmalig / nach Pull mit geänderter package-lock.json
npm run dev        # Dev-Server, http://localhost:5173 (F1 = Debugpanel, window.game in der Konsole)
npm run build      # Modulgrenzen-Check + Typecheck + Produktions-Build → MUSS vor jedem Commit fehlerfrei laufen
```

## HARTE REGELN
1. Arbeite **nur in deinem Feature-Ordner** `src/features/<modul>/` (und in deiner Task-Datei `docs/tasks/<modul>.md` zum Abhaken).
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
Codes = `KeyboardEvent.code`. Neue Tasten **hier eintragen** (im eigenen PR) und mit `game.input.onKey` registrieren.

| Taste | Funktion | Besitzer |
|---|---|---|
| W A S D / Pfeile | Kamera bewegen (Shift = schneller) | core |
| Mausrad | Zoom zum Mauszeiger | core |
| Mittlere Maustaste ziehen | Kamera verschieben | core |
| Linksklick | Bauen (mit Auswahl, Ziehen = mehrere) / Erz abbauen / Gebäude anklicken (`buildingClicked`) | core |
| Rechtsklick | Abreißen (Kosten zurück), Ziehen = mehrere | core |
| Q | Pipette: Gebäudetyp unter der Maus wählen | core |
| R / Shift+R | Drehen (Auswahl oder Gebäude unter der Maus) | core |
| P | Pause | core |
| Esc | Auswahl/Werkzeug aufheben (UI darf zusätzlich Fenster schließen) | core |
| F1 | Debugpanel | core |
| 1–9 | Bauleiste | ui |
| E | Inventar | ui |
| T | Forschung | ui |
| Tab | (frei für ui, z. B. Übersicht) | ui |
