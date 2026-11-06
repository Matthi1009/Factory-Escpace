# Modul `environment`: Umwelt-Simulation, Monster, Verteidigung

Ordner: `src/features/environment/` · Branch: `feature/environment` · ID-Präfix: `environment:`

## Ziel und Zuständigkeit
Die Umwelt reagiert sichtbar auf die Fabrik, und die mutierten Monster greifen an.

**Dazu gehört:**
- Ausbreitung und Abklingen von Verschmutzung; daraus folgend Hitze, Kälte, Strahlung, Austrocknung (`env.*`)
- Terrain-Optik: sterbende Pflanzen (`grass → dry → dead → wasteland`, `toxic` bei Strahlung, `ice` bei Kälte) über `world.setTerrain` + `renderer.invalidateGround`, eigene Boden-Optik per `setGroundPainter`
- Verschmutzungs-Overlay (Ebene `overlay`)
- Monster: Mutationen (Typen je nach Umweltwerten), Spawns abhängig von der Verschmutzung, Wegfindung zur Basis (Wrack/Gebäude), Angriff über `damageBuilding`
- Verteidigung: Mauern, Geschütztürme, Kraftfeld (schützt, heizt aber die Region auf)

**Ausdrücklich NICHT:**
- Verschmutzung **erzeugen** (macht factory an ihren Gebäuden), Geld/SDG-Wertung (progression), Demonstrationen (progression; das sind keine Monster und werden nicht bekämpft!)
- HUD/Anzeigen (ui liest `env.total` usw.)

## Core-APIs, Events, Zustände
- Nutzt: `game.onTick`, `game.env.field()` (direkt auf Float32Arrays rechnen), `world.getTerrain/setTerrain/getBuilding/isBuildable/neighbors4/forEachInRadius/buildingsInRadius`, `renderer.addDrawHook('overlay' | 'entities' | 'effects', …)`, `renderer.invalidateGround(x, y, w, h)`, `setGroundPainter`, `defaultGroundPainter`, `damageBuilding`, `game.wreck`, `BaseBuilding`, `registries.buildings`, `createRng`
- **Schreibt:** `env.pollution` (Verteilung/Abklingen), `env.temperature`, `env.radiation` (Verteilung), `env.water` (Austrocknung), Terrain, Gebäude-HP (Schaden)
- **Liest:** `env.*`, Gebäude-Liste, `research.isUnlocked` (indirekt), `power.consume` (Türme/Kraftfeld)
- Events: `buildingDestroyed` (Pfade neu berechnen), `buildingPlaced`; feuert `notify` („Monsterangriff im Norden!“)
- Optional: `stats.define({ id: 'environment:monsters', label: 'Monster', group: 'environment' })`

## Konventionen (Vertrag mit den anderen Modulen)
- Einheiten: `pollution` ≥ 0 (factory emittiert ca. 0,5–3 pro Sekunde pro Gebäude), `temperature` in °C (Start 20), `radiation` ≥ 0, `water` 0..1 (Start 0,6; Wasserflächen 1).
- Ausbreitung **nicht jeden Tick über die ganze Karte** – z. B. alle 10 Ticks oder in Streifen (Performance: 65 536 Kacheln).
- `invalidateGround` nur für geänderte Kacheln aufrufen (ganz neu rendern kostet ~100 ms).
- Monster sind **keine** Gebäude, sondern eigene Objekte (Liste im Modul), gezeichnet auf Ebene `entities` mit `view.alpha`-Interpolation.
- Verteidigungsgebäude: Tag `defense`; Forschung `defense_walls`, `turrets`, `force_field`. Kraftfeld heizt per `env.add('temperature', …)`.
- Monster greifen **nur Gebäude** an (es gibt keine Spielfigur). Ziel Nr. 1 ist das Wrack (`game.wreck`).

## Meilensteine

### M1 – sichtbare Verschmutzung + erster Monstertyp (1–2 Sessions)
- [x] Ordnerstruktur (`simulation.ts`, `overlay.ts`, `monsters/`, `index.ts`)
- [x] Verschmutzung breitet sich aus und klingt langsam ab (Diffusion auf `env.field('pollution')`)
- [x] Overlay zeichnet Verschmutzung sichtbar (Ebene `overlay`, nur sichtbarer Bereich)
- [x] Ab einer Verschmutzungsschwelle spawnt ein Monstertyp am Rand der verschmutzten Zone
- [x] Monster laufen (einfache Wegfindung, z. B. BFS/Flow-Field zum Wrack, Wasser umgehen) und greifen Gebäude an (`damageBuilding`)
- [x] Zerstörtes Wrack → Core feuert `gameOver` (nur prüfen, nicht selbst bauen)
- [x] `npm run build` grün, Commit, Bericht

Notizen M1: Balancing zentral in `config.ts` (`ENV_CONFIG`). Ausbreitung 6×/s, Abbau ≈ 0,3 %/s (Wald filtert stärker). Monster ab Σ Verschmutzung 300, Rate (Σ − 300)/400 pro Minute, max. 150, Spawn am Rand der Smogwolke (≥ 20 Kacheln vom Wrack). Flow-Field (Dijkstra) zum Wrack, Wasser unpassierbar, Gebäude kosten 10 → werden angegriffen statt weit umgangen. Kennzahl `environment:monsters`. Dev-Aktionen im F1-Panel: „5 Käfer spawnen“, „Alle Monster entfernen“. `MonsterManager.damage(m, n)` ist für die Geschütztürme in M2 vorbereitet.

### M2 – Umwelt-Folgen
- [x] Hitze/Kälte/Strahlung/Austrocknung aus Verschmutzung ableiten und ausbreiten
- [x] Terrain ändert sich (Pflanzen sterben) + eigene Boden-Optik (`setGroundPainter`)
- [x] Mehrere Monster-Mutationen je nach Umwelt (z. B. Hitze → schnell, Strahlung → zäh)
- [x] Mauern (`defense`, blockieren Monster, werden angegriffen)
- [x] Geschütztürme (schießen auf Monster in Reichweite, verbrauchen Strom oder Munition), Effekte auf Ebene `effects`

### M3 – Kraftfeld & Feinschliff
- [x] Kraftfeld: schützt Gebäude im Radius, verbraucht viel Strom, heizt die Region auf
- [x] Wellen/Angriffe mit Vorwarnung (`notify`), Schwierigkeit steigt mit Gesamtverschmutzung
- [x] Wasser: Austrocknung durch Rechenzentren sichtbar (Terrain `dry`), Seen schrumpfen optional
- [x] Performance-Check bei vielen Monstern (Ziel: 60 FPS bei 200 Monstern)
- [x] `stats` für Monsteranzahl/Durchschnittstemperatur

Notizen M2/M3 (alle Werte in `config.ts`):
- **Klima** (`climate.ts`, 1×/s): Zieltemperatur = 20 °C + Erderwärmung (bis +4 °C, Σ Verschmutzung) + Wärmeinsel (bis +12 °C lokal) − Smog-Winter (Verschmutzung > 15) − nuklearer Winter (Strahlung) + Wärmequellen (Kraftfeld). Strahlung breitet sich aus und zerfällt sehr langsam. Bodenfeuchte erholt sich langsam, Hitze (> 30 °C) und Smog trocknen aus. Kennzahlen `environment:avg_temperature`, `environment:max_temperature`, `environment:radiation`.
- **Terrain** (`terrain.ts`): Gras/Wald → `dry` → `dead` → `wasteland`, `toxic` (Strahlung > 5), `ice` (< 0 °C); erholt sich bei besseren Werten. Seen trocknen zu Sand aus (und füllen sich wieder). Eigene Boden-Optik (tote Bäume, Risse, Giftflecken, Eis). Kennzahl `environment:dead_land`.
- **Mutationen** (`monsters/types.ts`): Hitzeameise (> 30 °C), Strahlenschnecke (Strahlung > 1), Frostspinne (< 8 °C), sonst Käfer. Meldung beim ersten Auftauchen. Bei Zoom < 14 vereinfachte Darstellung.
- **Mauer** `environment:wall` (Forschung `defense_walls`, 1200 HP): Wegkosten 40 → Monster laufen außen herum, wenn es einen Weg gibt.
- **Geschützturm** `environment:turret` (Forschung `turrets`): Reichweite 8, Strom (wenn ein Netz existiert) oder Munition (Eisenplatte 10 / Stahl 25 Schuss, Start 30), Reichweiten-Vorschau.
- **Kraftfeld** `environment:force_field` (Forschung `force_field`, 600 kW): Kuppel Radius 10, Monster werden am Rand gegrillt, Gebäude darin sind geschützt; heizt bis +18 °C im Umkreis 16 (→ Kernschmelze-Risiko am Reaktor!).
- **Wellen** (`monsters/waves.ts`): erste nach 3 min über der Spawn-Schwelle, dann alle 4 min, 20 s Vorwarnung mit Richtung + rotem Pfeil, Größe wächst mit Verschmutzung und Wellennummer. Kennzahl `environment:wave`.
- Performance: 200 Monster inkl. Klima/Terrain/Smog ≈ 0,22 ms/Tick.
- Dev-Aktionen: „Jede Mutation einmal spawnen“, „Angriffswelle ankündigen“.

## Allein testen
1. `npm run dev`, F1 → Umwelt-Pinsel: Feld `pollution`, „Am Mauszeiger erhöhen“ aktivieren, linke Maustaste gedrückt halten → Verschmutzung erzeugen (rechte Maustaste senkt). Esc beendet den Pinsel.
2. „Feld anzeigen“ zeigt die Rohwerte; dein Overlay sollte sich ähnlich, aber schöner verhalten.
3. Ohne factory: Verschmutzung per Konsole `game.env.add('pollution', 140, 128, 200)` oder per `debug:source` + eigenes Test-Gebäude im eigenen Ordner.
4. Ziele für Monster: `core:chest` per Debugpanel bauen; das Wrack steht immer.
5. Kachelwerte unter der Maus stehen im Debugpanel-Status.

## Schnittstellen zu anderen Modulen
- **factory** schreibt `env.pollution` (und `water`, `radiation`) an ihren Gebäuden → environment verteilt das, lässt Pflanzen sterben und spawnt abhängig davon Monster.
- **progression** liest `env.total('pollution')` für Geld/SDG-Wertung; bei der Kernschmelze schreibt progression viel `radiation` → environment verteilt sie und macht das Terrain `toxic`.
- **ui** zeigt `env.total/average` und Werte unter dem Mauszeiger an; Meldungen über `notify`.

## Start-Prompt (1:1 in Claude Code einfügen)
```
Lies zuerst CLAUDE.md und docs/tasks/environment.md.
Arbeite nur auf Branch feature/environment und nur im Ordner src/features/environment/.
(Lege den Branch an, falls er fehlt: git fetch && git checkout -b feature/environment origin/main.)
Du darfst zusätzlich nur docs/tasks/environment.md (Checkliste abhaken) und die Tastentabelle in CLAUDE.md ändern.
Beginne mit M1. Commit nach jedem Teilschritt. Wenn M1 fertig ist und `npm run build` läuft: frag mich, ob du pushen und mit `gh pr create` einen PR öffnen sollst. Dann STOPP und berichte.
Brauchst du eine Core-Änderung: gib einen fertigen Issue-Text mit Label core-request aus und arbeite mit einem Workaround im eigenen Ordner weiter.
Wirst du neu gestartet, lies `git log` und die Checkliste in docs/tasks/environment.md und mach dort weiter.
```
