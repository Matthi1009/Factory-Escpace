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
- [ ] Ordnerstruktur (`simulation.ts`, `overlay.ts`, `monsters/`, `index.ts`)
- [ ] Verschmutzung breitet sich aus und klingt langsam ab (Diffusion auf `env.field('pollution')`)
- [ ] Overlay zeichnet Verschmutzung sichtbar (Ebene `overlay`, nur sichtbarer Bereich)
- [ ] Ab einer Verschmutzungsschwelle spawnt ein Monstertyp am Rand der verschmutzten Zone
- [ ] Monster laufen (einfache Wegfindung, z. B. BFS/Flow-Field zum Wrack, Wasser umgehen) und greifen Gebäude an (`damageBuilding`)
- [ ] Zerstörtes Wrack → Core feuert `gameOver` (nur prüfen, nicht selbst bauen)
- [ ] `npm run build` grün, Commit, Bericht

### M2 – Umwelt-Folgen
- [ ] Hitze/Kälte/Strahlung/Austrocknung aus Verschmutzung ableiten und ausbreiten
- [ ] Terrain ändert sich (Pflanzen sterben) + eigene Boden-Optik (`setGroundPainter`)
- [ ] Mehrere Monster-Mutationen je nach Umwelt (z. B. Hitze → schnell, Strahlung → zäh)
- [ ] Mauern (`defense`, blockieren Monster, werden angegriffen)
- [ ] Geschütztürme (schießen auf Monster in Reichweite, verbrauchen Strom oder Munition), Effekte auf Ebene `effects`

### M3 – Kraftfeld & Feinschliff
- [ ] Kraftfeld: schützt Gebäude im Radius, verbraucht viel Strom, heizt die Region auf
- [ ] Wellen/Angriffe mit Vorwarnung (`notify`), Schwierigkeit steigt mit Gesamtverschmutzung
- [ ] Wasser: Austrocknung durch Rechenzentren sichtbar (Terrain `dry`), Seen schrumpfen optional
- [ ] Performance-Check bei vielen Monstern (Ziel: 60 FPS bei 200 Monstern)
- [ ] `stats` für Monsteranzahl/Durchschnittstemperatur

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
