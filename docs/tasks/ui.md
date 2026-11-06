# Modul `ui`: Benutzeroberfläche

Ordner: `src/features/ui/` · Branch: `feature/ui` · ID-Präfix: `ui:`

## Ziel und Zuständigkeit
Alles, was der Spieler an Oberfläche sieht und anklickt – **generisch**, also ohne die anderen Module zu kennen. Die ui liest nur Registries, Zustände, Stats, Aktionen und Events des Core.

**Dazu gehört:**
- HUD: Geld, Verschmutzung, Strom, Pause-Anzeige, Meldungen (`notify`)
- Bauleiste: nur freigeschaltete, nicht-`hidden` Gebäude, Tasten 1–9, Hervorhebung der Auswahl
- Inventar (E), Crafting-Menü (Handcrafting-Rezepte, Warteschlange)
- Umwelt- und SDG-Anzeige (`env.total/average`, `stats` mit `group: 'sdg'`), Tooltip für die Kachel/das Gebäude unter der Maus (`info()`)
- Forschungsfenster (T): Baum/Liste aus `registries.research`, Start über `research.request(id)`, Fortschritt
- Aktionen-Menü (`registries.actions`, z. B. PR-Kampagne, Börse)
- Game-Over-/Sieg-Screen, Pause-/Hauptmenü, Hilfe/Tastenübersicht

**Ausdrücklich NICHT:**
- Spiellogik: keine Kosten berechnen, nichts freischalten, kein Geld vergeben (→ progression); keine Gebäude/Rezepte (→ factory)
- Weltzeichnungen wie Overlays oder Monster (→ environment); die ui zeichnet in der Welt höchstens Markierungen (Ebene `ui-world`)

## Core-APIs, Events, Zustände
- Nutzt: `game.uiRoot` (HTML-Ebene, `pointer-events: none` → eigene Elemente `pointer-events: auto`), `game.input.onKey`, `interaction.select/selected/dir/hover`, `registries.buildings/items/recipes/research/actions`, `drawItem` (Item-Icons auf kleinen Canvas-Elementen), `handCraft`, `crafting.queue/progress/check`, `research.request/current/progress/isUnlocked`, `stats.all()`, `world.getBuilding/getTerrain/getResource`, `env.get/total/average`, `power`
- **Schreibt:** nur Auswahl (`interaction.select`), Pause (`setPaused`), Aufrufe von `handCraft`, `research.request`, `action.run(game)`
- **Liest:** alles Übrige
- Events: `ready` (Bauleiste aufbauen), `inventoryChanged`, `moneyChanged`, `selectionChanged`, `researchUnlocked` (Bauleiste aktualisieren), `craftQueued/craftFinished`, `notify`, `pauseChanged`, `gameOver`, `buildingClicked` (Gebäude-Info öffnen)

## Konventionen (Vertrag mit den anderen Modulen)
- Tasten: **1–9** Bauleiste, **E** Inventar, **T** Forschung, **Tab** frei für ui. Esc darf zusätzlich offene Fenster schließen (der Core hebt dabei die Auswahl auf).
- Bauleiste = `registries.buildings.all().filter(d => !d.hidden && game.research.isUnlocked(d.requiresResearch))` in Registrierungs-Reihenfolge; neu prüfen bei `researchUnlocked` und `ready`.
- Gebäude, deren Kosten nicht im Inventar sind, ausgegraut, aber wählbar (Core zeigt dann die rote Vorschau).
- Item-Namen/Farben immer aus `registries.items` und `drawItem` – nie eigene Farbtabellen.
- Unbekannte `stats`/`actions` generisch anzeigen (Label, Wert, Einheit; Knopf mit `isAvailable`).
- Kein Framework (nur DOM-API/TS); Styles als CSS-String im eigenen Ordner, Klassen mit Präfix `fe-ui-`.
- Das Debugpanel (F1) gehört dem Core und liegt oben rechts – nicht verdecken bzw. darunter liegen (z-index < 1000).

## Meilensteine

### M1 – Bauleiste, Inventar, HUD (1–2 Sessions)
- [ ] Ordnerstruktur (`hud.ts`, `toolbar.ts`, `inventory.ts`, `styles.ts`, `index.ts`)
- [ ] HUD oben: Geld (`moneyChanged`), Gesamt-Verschmutzung (`env.total('pollution')`, ca. 4× pro Sekunde aktualisieren), Pause-Hinweis
- [ ] Bauleiste unten: Gebäude-Slots mit Farbe/Name, Tasten 1–9, Klick wählt aus, Auswahl hervorgehoben (`selectionChanged`), Aktualisierung bei `ready`/`researchUnlocked`/`registries.buildings.onRegister`
- [ ] Inventaranzeige (E): alle Items mit Icon (`drawItem`) und Anzahl, live per `inventoryChanged`
- [ ] Meldungen (`notify`) als kurz sichtbare Toasts
- [ ] `npm run build` grün, Commit, Bericht

### M2 – Crafting, Forschung, Tooltips
- [ ] Crafting-Menü: alle Rezepte mit `madeIn` inkl. `'hand'`, ausgegraut wenn `crafting.check(id)` ≠ null, Warteschlange mit Fortschritt
- [ ] Forschungsfenster (T): Liste/Baum aus `registries.research` mit Kosten, Voraussetzungen, Status; Knopf → `research.request(id)`; Fortschrittsbalken
- [ ] Tooltip unter der Maus: Terrain, Ressource, Umweltwerte, Gebäude-Name, HP, `info()`
- [ ] Strom-Anzeige (Produktion/Bedarf/Versorgung)
- [ ] Gebäude-Info-Fenster bei `buildingClicked`

### M3 – Umwelt, SDG, Menüs
- [ ] Umwelt-Panel (Verschmutzung, Temperatur, Strahlung, Wasser – Durchschnitt/Max) und SDG-Panel (`stats` Gruppe `sdg`) im Satire-Stil
- [ ] Aktionen-Menü (`registries.actions`, gruppiert nach `category`)
- [ ] Game-Over-/Sieg-Screen (`gameOver`) mit Neustart (`location.reload()`)
- [ ] Hauptmenü/Pausemenü, Hilfe mit Tastenübersicht
- [ ] Optional: Minimap auf Ebene `screen`

## Allein testen
1. `npm run dev`. Ohne factory gibt es nur `core:chest` (sichtbar) – reicht für die Bauleiste. Weitere Test-Gebäude/Rezepte/Forschung/Aktionen/Stats im **eigenen Ordner** unter einer Dev-Bedingung registrieren (`if (import.meta.env.DEV) registerTestContent(game)` mit IDs `ui:test_*`) – vor dem PR wieder entfernen oder deaktiviert lassen.
2. F1 → „+100 jedes Item“ (Inventar füllt sich), „+10.000 Geld“ (HUD), Umwelt-Pinsel (Verschmutzung im HUD), „Alles erforschen“ (Bauleiste aktualisiert).
3. Meldungen: `game.notify('Test', 'warn')` in der Konsole. Game Over: `game.endGame(false, 'Test')`.

## Schnittstellen zu anderen Modulen
- **factory** registriert Gebäude (Bauleiste), Rezepte (Crafting-Menü) und `info()` (Tooltip).
- **environment** schreibt `env.*` (Anzeigen) und meldet Angriffe über `notify`.
- **progression** stellt Forschungskosten/-ablauf (`research.request`), SDG-Werte (`stats`), Aktionen (PR-Kampagne, Börse) bereit und löst `gameOver` aus.

## Start-Prompt (1:1 in Claude Code einfügen)
```
Lies zuerst CLAUDE.md und docs/tasks/ui.md.
Arbeite nur auf Branch feature/ui und nur im Ordner src/features/ui/.
(Lege den Branch an, falls er fehlt: git fetch && git checkout -b feature/ui origin/main.)
Du darfst zusätzlich nur docs/tasks/ui.md (Checkliste abhaken) und die Tastentabelle in CLAUDE.md ändern.
Beginne mit M1. Commit nach jedem Teilschritt. Wenn M1 fertig ist und `npm run build` läuft: frag mich, ob du pushen und mit `gh pr create` einen PR öffnen sollst. Dann STOPP und berichte.
Brauchst du eine Core-Änderung: gib einen fertigen Issue-Text mit Label core-request aus und arbeite mit einem Workaround im eigenen Ordner weiter.
Wirst du neu gestartet, lies `git log` und die Checkliste in docs/tasks/ui.md und mach dort weiter.
```
