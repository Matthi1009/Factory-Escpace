# Paket `player-defense` (Runde 2)

Branch `r2/player-defense` · Vertrag und Regeln: [docs/ROUND2.md](../ROUND2.md) (zuerst lesen!)

## Ziel und Zuständigkeit
Der Spieler wird eine **Figur in der Welt** (wie in Factorio): Er läuft, hat **Reichweite**, baut **von Hand ab**, schießt mit einer **Handwaffe** und stirbt/respawnt. Dazu die **Verteidigung**: Geschützturm mit Munition, Laserturm mit Strom, Mauern, Tore, Reparatur. Monster verhalten sich dazu passend.

**Dazu gehört:**
- **Spieler im Core:** `game.player`, `damagePlayer`, `respawnPlayer`, `movePlayer`, `inReach`, `isWalkable`, `reachEnabled`, `cameraMode`, Events (ROUND2.md 4.3); Kamera folgt dem Spieler
- **Reichweite 10 Kacheln** für Bauen, Abreißen, Handabbau, Drehen, Bedienen; rote Vorschau mit Hinweis außerhalb; im F1-Debugpanel abschaltbar
- **Tasten:** WASD = Figur, Pfeiltasten und mittlere Maustaste nur im freien Kameramodus (F1)
- **Neue IDs:** Tag `gate`; Items `ammo`, `ammo_piercing`, `repair_pack`; die drei Rezepte in `factory/recipes.ts` (ROUND2.md 4.5)
- **Spielfigur:** Ingenieur im Schutzanzug, schräg von oben, 8 Richtungen, Lauf-, Steh- und Abbau-Animation; Handabbau mit Brocken-Partikeln
- **Handwaffe:** Leertaste, Richtung Maus, verbraucht `ammo`, Mündungsfeuer, Hülsen
- **Tod und Respawn:** nach 10 s am Wrack, Inventar bleibt; **Game Over gibt es nur beim Wrack** (bleibt wie bisher im Core)
- **Verteidigung:** `environment:turret` (Geschützturm, Munition per Greifarm/Förderband oder Klick aus dem Inventar, dreht sich zum Ziel, wirft Hülsen), `environment:laser_turret` (Strom), `environment:wall` (verbindet sich automatisch mit Nachbarmauern, Schadensstufen), `environment:gate` (Tor, Tag `gate`), **Reparatur** mit `repair_pack`
- **Monster-Verhalten:** greifen den Spieler unter 8 Kacheln an; umgehen Mauern oder greifen sie an; Tore blockieren Monster
- Die **Grafik** der Figur und der eigenen Gebäude machst du selbst nach der Stilvorgabe (ROUND2.md 3)

**Ausdrücklich NICHT:**
- Terrain, Monster-**Optik**, Kraftfeld-Optik, Effekt-Grundlagen (→ art-world); Maschinen-Optik (→ art-factory)
- Menüs, Karten, HUD (→ ui-menu-map); `game.state`/`settings` (→ ui-menu-map)
- Verschmutzungs-/Klima-Simulation, Spawn-Raten der Monster, Forschung, Geld

## Exklusive Dateien (nur diese darfst du ändern)
- `src/features/player/**`
- neue Core-Dateien `src/core/player/**` (`PlayerState.ts`, `installPlayer.ts`, `cameraFollow.ts`)
- Core: `src/core/render/Camera.ts`, `src/core/input/Interaction.ts`, `src/core/input/Input.ts`, `src/core/debug/DebugPanel.ts`, `src/main.ts` (eine Zeile), `src/core/content/items.ts`, `src/core/content/tags.ts`
- `src/features/factory/recipes.ts` (**nur** die drei neuen Rezepte)
- `src/features/environment/defense/**` und `src/features/environment/monsters/**` (**erst ab M2**, nach art-world **M0b**, siehe unten)
- `src/features/environment/art/defense-*.ts` (Optik von Turm, Laserturm, Mauer, Tor; art-world legt `defense-wall.ts`/`defense-turret.ts` in M0b an und übergibt sie dir)
- `docs/screenshots/r2-player-defense/**`, diese Aufgabendatei

**Tabu:** `Game.ts` (gehört art-world), `core/index.ts` (niemand), alles in `src/features/ui/`, `src/core/art/`, `Renderer.ts`. Neue Core-Dateien importierst du per **Tiefenpfad** (`'../../core/player/PlayerState'`), nicht über den Barrel. Brauchst du etwas Fremdes: Issue-Text mit Label `core-request`, mit Fallback weiter.

## Verträge
**Du lieferst (M0):** Spieler (ROUND2.md 4.3, exakt die Signaturen dort), IDs (4.5), die Verteidigungs-IDs (4.6), später `game.getMonsters` (4.3, M3).
**Du nutzt (mit Fallback aus ROUND2.md 4.0, immer lazy):**
- `stateOf(game)` (Zustand): Schaden und Bewegung nur bei `playing`
- `settingsOf(game)`: `particles`, `quality` (Partikel-Menge)
- `addSorted(game, obj)`: die Figur und Projektile in der nach y sortierten Ebene
- Partikel `particlesOf(game)`: Arten `'chunk'` (Brocken) und `'shell'` (Hülsen) gibt es erst nach art-world **M0a** → bis dahin `'dust'` bzw. `'spark'`
- Palette: vorläufige Werte aus ROUND2.md Abschnitt 3 als lokale Konstanten in `features/player/art/`, bis art-world M0a in `main` ist

### Hinweise zur Umsetzung (aus der Erfahrung mit dem Code)
- **Kein Eingriff in `Game.ts`:** `installPlayer(game)` (aufgerufen aus `register()` von `features/player/index.ts`) hängt `player`, `damagePlayer`, … an die Instanz (`Object.assign`/`defineProperty`) und typisiert per `declare module '../Game' { interface Game { … } }` (Muster siehe ROUND2.md 4.1).
- **Kamera folgen:** in einer `requestAnimationFrame`-Schleife (läuft auch in der Pause), weich (`k = min(1, dt·7)`), nicht im Zustand `menu`. `cameraMode === 'free'` schaltet das Folgen aus; im freien Modus bewegen die Pfeiltasten die Kamera (in `Interaction._frame`; WASD bewegt dort **nicht** mehr die Kamera).
- **Bewegung:** WASD normalisiert, ca. 8 Kacheln/s, im `onTick('pre')`-System in `features/player/`; `game.movePlayer(dx, dy)` kümmert sich um Kollision (Radius 0,3, Achsen getrennt; Gebäude, Wasser, Wrack blockieren; `gate` nicht).
- **Start- und Respawn-Position:** rechts neben dem Wrack (`game.world.spawn` + (3,5 | 0,5)); ist das nicht begehbar, Spirale nach außen.
- **Reichweite in `Interaction.ts`:** in `applyAt` (Bauen, Abreißen, Handabbau, Anklicken), in `tick` (Handabbau-Fortschritt), in `rotate` und in `drawPreview` (Vorschau rot + Text „Außer Reichweite“). Mittelpunkt der Kachel: `(x + 0.5, y + 0.5)`. Meldung „Zu weit weg (Reichweite: 10 Kacheln)“ nur beim ersten Klick, nicht beim Ziehen.
- **Esc lässt du in `Interaction.ts` unverändert** (nur Auswahl aufheben); das Pausemenü macht ui-menu-map.
- **Space-Taste:** in deinem Modul mit `game.input.onKey('Space', …)`; Dauerfeuer über `game.input.isDown('Space')` im Tick.
- **Zeichnen der Figur:** als `SortedDrawable` mit `y = player.y + 0.3` und Sprite-Cache je Richtung/Animationsbild (`drawSprite`/`drawBuildingSprite` aus `src/core/art/` **nutzen**, nicht ändern).

## Meilensteine

### M0 – Grundlage (klein, schnell mergen)
- [ ] `src/core/player/PlayerState.ts` (`REACH = 10`, Klasse, `dir8`), `installPlayer.ts` (alle Methoden aus 4.3 + Events per Interface-Merging), `cameraFollow.ts`
- [ ] `Camera.ts` ergänzen (nur Hilfsfunktion fürs Folgen, falls nötig), `Interaction.ts`: Reichweite, Pfeiltasten nur im freien Modus, mittlere Maustaste nur frei
- [ ] `DebugPanel.ts`: Schalter „Kamera: folgt Spieler / frei“ und „Reichweite: an / aus“
- [ ] `src/features/player/index.ts`: Platzhalter-Kreis (WASD, Blickrichtungs-Strich) als sortiertes Objekt (`addSorted`-Fallback) + `src/main.ts`: `registerPlayer(game)` **vor** `registerUi(game)`
- [ ] `tags.ts`: `gate`; `items.ts`: `ammo`, `ammo_piercing`, `repair_pack`; `factory/recipes.ts`: die drei Rezepte (ROUND2.md 4.5)
- [ ] Prüfen im Headless-Browser: WASD bewegt (≈ 8 Kacheln in 1 s), Wrack und Wasser blockieren, Klick 25 Kacheln entfernt baut nicht und meldet „Zu weit weg“, Reichweite im F1 abschaltbar, Kamera folgt, `game.damagePlayer(100)` löst `playerDied` aus, `respawnPlayer()` stellt wieder her
- [ ] `npm run build` grün, PR, CI, `gh pr merge --merge`

### M1 – Spielfigur, Handabbau, Handwaffe (danach STOPP)
- [ ] **Figur:** Ingenieur im Schutzanzug (Helm mit Visier, kantiger Rucksack, Stiefel, Werkzeug), **8 Richtungen**, Animationen Stehen (leichtes Atmen), Laufen (Beine/Arme im Wechsel, 6 Bilder), Abbauen (Arm-/Werkzeugschlag, Funken). Alles prozedural in `src/features/player/art/`, nach der Stilvorgabe (gedeckte Farben, Schatten nach rechts unten, **keine** Comic-Optik, kein Gesicht außer dem dunklen Visier)
- [ ] **Handabbau:** Linke Maustaste halten auf Erz in Reichweite (der Core baut ab); Figur dreht sich zur Kachel und spielt die Abbau-Animation; bei `handMined` fliegen Brocken (`'chunk'`, Fallback `'dust'`)
- [ ] **Handwaffe:** Leertaste feuert Richtung Maus (Figur dreht sich), **1 `ammo` pro Schuss**, ca. 4 Schüsse/s, Mündungsfeuer (kurzer heller Blitz), Leuchtspur, Hülsen (`'shell'`, Fallback `'spark'`); ohne Munition: Klicken und Meldung „Keine Munition“ (höchstens alle 2 s). **Treffer auf Monster folgen erst in M3**, sobald `environment/monsters/` dir gehört
- [ ] **Tod und Respawn:** bei `playerDied` Figur liegt kurz, nach **10 s** `respawnPlayer()`, Inventar bleibt; Meldung mit Countdown (`game.notify`); **Game Over bleibt nur beim Wrack**
- [ ] LOD: Figur klein (weit herausgezoomt) als vereinfachte Silhouette
- [ ] Screenshots (Figur in 8 Richtungen, laufend, abbauend, schießend) in `docs/screenshots/r2-player-defense/`, **selbst ansehen**: ernst und industriell?
- [ ] PR, CI, mergen → **STOPP: Screenshot-Pfade und 5 Zeilen Beschreibung, auf OK warten**

### M2 – Verteidigung (**erst starten, wenn art-world M0b in `main` ist**)
- [ ] **Geschützturm** (`environment:turret`, bestehende Registrierung ersetzen): Munition `ammo` und `ammo_piercing` (stärker) per Greifarm/Förderband (`acceptItem`) **oder** per Linksklick aus dem Inventar (wie die Kohle-Befüllung in `factory`: `buildingClicked`, höchstens bis zu einem Vorrat); dreht sich weich zum nächsten Ziel; wirft Hülsen; Info-Zeilen (`info()`: Munition, Reichweite)
- [ ] **Laserturm** (`environment:laser_turret`, Forschung `turrets`): Strom (`game.power.consume`), kein Munitionsverbrauch, Laserstrahl; ohne Strom aus
- [ ] **Mauern** (`environment:wall`): verbinden sich automatisch mit Nachbarmauern (Verbindungsstücke), **Schadensstufen** (mindestens 3 sichtbare Stufen)
- [ ] **Tore** (`environment:gate`, Tag `gate`, Forschung `defense_walls`): Spieler geht durch, Monster werden wie von einer Mauer aufgehalten
- [ ] **Reparatur:** Linksklick auf ein beschädigtes Verteidigungsgebäude (Tag `defense`) oder das Wrack in Reichweite, wenn ein `repair_pack` im Inventar liegt: verbraucht 1 Paket, stellt einen Teil der HP wieder her (Meldung/Effekt)
- [ ] Optik der Verteidigung in `environment/art/defense-*.ts` (übernommen von art-world, M0b), nach Stilvorgabe
- [ ] Screenshots (Türme, Wall mit Verbindungen und Schäden, Tor, Laser), ansehen, PR, CI, mergen

### M3 – Monster-Verhalten, Waffe trifft, Karten-Anbindung
- [ ] Monster greifen den **Spieler** an, wenn er **unter 8 Kacheln** nah ist (`game.damagePlayer`); umgehen Mauern über das Flow-Field oder greifen sie an (Wegkosten für Mauern/Tore)
- [ ] Die **Handwaffe trifft** Monster (Treffer auf das erste Monster entlang des Strahls, Schaden und Reichweite so wählen, dass ein Spieler ohne Türme eine kleine Welle mit etwas Geschick übersteht)
- [ ] `game.getMonsters(): Iterable<{ x; y; kind? }>` (ROUND2.md 4.3) für die Karten des ui-Pakets
- [ ] Balance-Feinschliff, Info-Texte, FPS-Messung, Abschlussbericht

## Testanleitung
- Start direkt im Spiel: `http://localhost:5173/?seed=7&start=1`. F1-Debugpanel: **„+100 jedes Item“** (Munition, Eisen, Reparaturpakete craften oder direkt haben), **„Alles erforschen“**, Gebäude wählen (Türme/Mauern/Tore), Aktionen **„Angriffswelle ankündigen“** und **„Käfer spawnen“**, Umwelt-Pinsel für Verschmutzung (lockt Monster).
- Konsole: `game.player`, `game.damagePlayer(30)`, `game.respawnPlayer()`, `game.cameraMode = 'free'`.
- Ohne das ui-Paket (kein Menü): Seite mit `?start=1` laden. Ohne `settings`/`state`: Fallbacks aus ROUND2.md 4.0 nutzen.
- Screenshots im Headless-Browser (ROUND2.md Abschnitt 8); **Bilder ansehen**: Figur in 8 Richtungen, Reichweite (rote Vorschau mit Text), Turm mit Mündungsfeuer und Hülsen, Mauer-Verbindungen, Monster vor einem Tor.
- FPS-Benchmark aus ROUND2.md Abschnitt 8 vorher/nachher (Ziel: unter 10 ms/Frame bei 500 Gebäuden); zusätzlich mit 16 Türmen und 40 Monstern messen.

## Start-Prompt (1:1 in Claude Code einfügen)
```
Du arbeitest im Repo Matthi1009/Factory-Escpace, Paket player-defense. Lies zuerst CLAUDE.md, docs/ROUND2.md und docs/tasks/r2-player-defense.md.
Du änderst ausschließlich deine exklusiven Dateien (Abschnitt "Exklusive Dateien" in deiner Aufgabendatei und docs/ROUND2.md, Abschnitt 6). Brauchst du mehr: Issue-Text mit Label core-request ausgeben und mit dem Fallback aus ROUND2.md 4.0 weitermachen. In src/features/environment/ arbeitest du erst ab M2 und erst, wenn art-world M0b in main ist (prüfe git log und docs/tasks/r2-art-world.md auf main).
Branch r2/player-defense (von main). Commit nach jedem Teilschritt, erledigte Punkte in docs/tasks/r2-player-defense.md abhaken.
Beginne mit M0, halte ihn klein und merge ihn schnell: git pull origin main, npm run build, PR, grüner CI, gh pr merge --merge.
Nach jedem Meilenstein: main mergen, npm run build, im Headless-Browser Screenshots machen und selbst ansehen, ob es ernst und industriell wirkt (nicht verspielt), PR, CI, mergen, main zurückholen.
STOPP nach M1: Screenshot-Pfade und 5 Zeilen Beschreibung ausgeben und auf mein OK warten. Danach M2 und M3 ohne Rückfragen.
STOPP auch bei: neuen npm-Paketen, Konflikten in Dateien, die dir nicht gehören, FPS unter 60 (über 10 ms/Frame im Benchmark).
Wirst du neu gestartet: lies git log und docs/tasks/r2-player-defense.md und mach dort weiter.
Am Ende: Zusammenfassung, FPS vorher und nachher, Screenshot-Pfade und eine Testliste für den Browser.
```
