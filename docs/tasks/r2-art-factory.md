# Paket `art-factory` (Runde 2)

Branch `r2/art-factory` · Vertrag und Regeln: [docs/ROUND2.md](../ROUND2.md) (zuerst lesen!)

## Ziel und Zuständigkeit
Alles, was die **Fabrik** zeigt, im ernsten Factorio-Look (ROUND2.md Abschnitt 3): **alle Maschinen, Förderbänder, Item-Icons, das Wrack, die Raketenrampe, die Kernschmelze, die Demonstrationen.** Du löst dazu zuerst den bisherigen Zeichencode aus der Logik heraus (M0).

**Dazu gehört:**
- **Maschinen:** Abbaumaschine Mk1/Mk2 (drehender Bohrer), Ofen (Glut, Rauch), Greifarm (sichtbares Greifen und Schwenken), Montagemaschine (Arbeitsfläche mit beweglichem Werkzeugkopf, Rezept-Icon klein sichtbar), Kohlekraftwerk (Schornstein, dunkler Rauch), Atomkraftwerk (Kühltürme mit Dampf, Warnzeichen), KI-Rechenzentrum (Server-Racks, blinkende Cyan-LEDs, Kühlwasser-Rohre), Müllkippe, Entsorgungsanlage, Öko-Ofen und Solarpark (sauberer, Paneele spiegeln je nach Tag/Nacht), Seilbahn (Stationen, Seil, Gondeln), Lagerkisten
- **Förderbänder** (die **wichtigste Optik**): Gummiband mit Laufrillen, die sich in Bandrichtung bewegen; saubere Kurven; **gut lesbare Items**, auch bei kleinem Zoom
- **Item-Icons** für **alle** Item-IDs über `drawItem`: `iron_ore`, `copper_ore`, `coal`, `stone`, `granite`, `uranium_ore`, `iron_plate`, `copper_plate`, `steel`, `gear`, `circuit`, `concrete`, `uranium_fuel`, `nuclear_waste`, `waste`, `rocket_part`, `ammo`, `ammo_piercing`, `repair_pack`
- **Wrack** (beschädigt, Rauch, Funken; wird mit sinkenden HP schlimmer), **Raketenrampe mit Startanimation**, **Kernschmelze** (Glühen, Bildschirm-Wackeln, Strahlungs-Ausbreitung), **Demonstrationen** (schlichte Figurengruppe mit Schildern, **gewaltfrei**, ernst, kein Comic)

**Ausdrücklich NICHT:**
- **jede Logik**: `tick()`, `acceptItem()`, Balancing, Rezepte, Registrierungen, IDs, Forschung, Geld (Logikfehler → GitHub-Issue mit Label nach Modul, nicht selbst reparieren)
- Terrain, Monster, Kraftfeld, Effekt-Grundlagen (→ art-world); Spielfigur, Türme, Mauern (→ player-defense); Menüs, Karten (→ ui-menu-map)

## Exklusive Dateien (nur diese darfst du ändern)
- `src/features/factory/art/**`, `src/features/progression/art/**`
- `src/core/art/items*`, `src/core/art/wreck*`, `src/core/art/buildings*` (neue Dateien)
- **Nur Zeichencode** (`draw()`-Methoden, Zeichen-Hooks, Zeichen-Hilfsfunktionen) in:
  `src/features/factory/buildings/*.ts`, `src/features/factory/index.ts` (Hook-Zeilen), `src/features/progression/{demonstrations,meltdown,rocket,index}.ts`, `src/core/render/drawItem.ts`, `src/core/buildings/{Chest,DebugSource,Wreck,drawBuilding}.ts`
- `docs/screenshots/r2-art-factory/**`, diese Aufgabendatei

**Tabu:** alles Übrige, vor allem `src/core/art/` außer den drei obigen Mustern (gehört art-world: du **liest** `PALETTE`, `drawMetalPanel`, `drawBuildingSprite`, `particlesOf` usw., änderst sie nicht; brauchst du einen neuen Helfer, lege ihn in `src/features/factory/art/` an), `Game.ts`, `Renderer.ts`, `src/features/ui/`, `src/features/player/`, `src/features/environment/`, `src/features/factory/recipes.ts`. Logik bleibt unberührt.

## Verträge
**Du lieferst:** nichts am Vertrag; du **nutzt** ihn:
- Grafik-Grundlage (ROUND2.md 4.4): Palette-Slots, `drawBuildingSprite`/Sprite-Cache, `lodOf`, `particlesOf`, nach y sortierte Ebene (die Gebäude des Core laufen ab art-world M0a automatisch darüber; **du musst nichts anmelden**)
- `settingsOf(game)` (Shim 4.0, immer lazy): `screenShake` für das Kernschmelze-Wackeln, `particles`, `quality`
- Bis **art-world M0a** in `main` ist: die **vorläufigen Palette-Werte aus ROUND2.md Abschnitt 3** als lokale Konstanten in `src/features/factory/art/colors.ts`; danach auf `PALETTE.<slot>` umstellen (gleiche Namen)

### Umsetzungsregeln
- `draw()` in einer Logik-Datei besteht nur noch aus **einem Aufruf** `drawXyz(ctx, …)` aus `art/`; der Zustand, den die Zeichnung braucht (Fortschritt, läuft, Strom, Richtung, Inhalt), wird **als Parameter** durchgereicht (siehe `Furnace.ts` → `art/furnaceArt.ts`). Die Zeichenfunktion verändert nie Zustand.
- **Schräge Draufsicht:** Körper ragt über die Kachel nach oben (−y), Südseite sichtbar, Schatten nach rechts unten. Statisches im **Sprite-Cache** (`drawBuildingSprite`: Typ × Richtung × Zoomstufe), pro Frame nur Animiertes (Lüfter, LEDs, Glut, Partikel).
- **Status-LEDs** überall gleich: grün läuft, gelb wartet (Input fehlt/Output voll), rot blockiert (`blockedTicks > 0`) oder ohne Strom.
- **LOD:** weit weg vereinfachte Formen, ab mittlerem Zoom Rillen/LEDs/Rauch, nah Schrauben/Funken. Partikel nur sichtbar und nur ab LOD 1; Obergrenze hält das Partikelsystem.
- **Ausrichtung lesbar:** Ausgang = Rohrstutzen mit Warnstreifen-Kante, Eingang = Trichter/Flansch.

## Meilensteine

### M0 – Zeichencode aus der Logik herauslösen (klein, mechanisch, schnell mergen)
Optisch ändert sich **nichts**. Zeichencode **unverändert** verschieben, Logik-Dateien rufen nur noch `art/`-Funktionen auf.
- [ ] `factory/buildings/`: `Assembler`, `Inserter`, `Crate`, `CoalPlant`, `NuclearPlant`, `Datacenter`, `WasteBuildings` (Müllkippe und Entsorgung), `EcoBuildings` (Solarpark; der Öko-Ofen nutzt die Ofen-Optik), `RopewayStation` (+ Seil/Gondeln `drawRopeways`) → je eine Datei in `factory/art/`; die Bandzeichnung `drawBeltItems` aus `Belt.ts` → `art/beltItemsArt.ts` (`factory/index.ts` importiert von dort). Ofen, Band, Abbaumaschine Mk1/Mk2 liegen bereits in `art/`
- [ ] `progression/`: Zeichnen in `demonstrations.ts`, `meltdown.ts`, `rocket.ts` → `progression/art/` (je eine Datei)
- [ ] Core: `drawItem` aus `src/core/render/drawItem.ts` → `src/core/art/items.ts` (**Signatur und Verhalten von `drawItem(ctx, id, x, y, size)` bleiben**, die alte Datei ruft nur noch auf); `Wreck.ts` → `src/core/art/wreck.ts`; `Chest.ts`, `DebugSource.ts`, `drawBuilding.ts` → `src/core/art/buildings.ts`
- [ ] **Alle bisherigen Exporte der geänderten Core-Dateien bleiben bestehen** (`Game.ts` importiert `_bindDrawItem`, `drawDefaultBuilding`, `CHEST_DEF`, `DEBUG_SOURCE_DEF`, `WRECK_DEF`; `Interaction.ts` nutzt `drawDefaultBuilding`): Die alten Dateien werden zu dünnen Aufrufern, ihre Signaturen ändern sich nicht
- [ ] Die neuen Dateien `src/core/art/items.ts`, `wreck.ts`, `buildings.ts` importierst du **per Tiefenpfad**; **nicht** in `src/core/art/index.ts` (gehört art-world) und nicht in `src/core/index.ts` eintragen
- [ ] Vorher/nachher-Screenshots (gleiche Szene) **ansehen**: kein Unterschied; `npm run build` grün, PR, CI, `gh pr merge --merge`

### M1 – Förderbänder, Items, Ofen, Abbaumaschine (**erst starten, wenn art-world M0a in `main` ist**; danach STOPP)
- [ ] **Förderband:** dunkles Gummiband mit Querrillen, abgenutzte Stahlschienen mit Rost, Stoßfugen; Rillen **laufen** in Bandrichtung (Geschwindigkeit wie das Band, 1,8 Kacheln/s); **Kurven** sauber (Viertelring); Seiteneinspeisung erkennbar; Richtung auch im Stand lesbar (Pfeil-Rillen)
- [ ] **Items auf dem Band:** gut lesbar bei kleinem Zoom (Silhouette + zwei Töne, Größe ≈ 0,28 Kachel), kleiner Schatten; weiche Bewegung (`prev`/`alpha` wie bisher)
- [ ] **Item-Icons für alle 19 IDs** (siehe oben): Erzbrocken je Metall, gewalzte Platten, Zahnrad, Platine (gedämpftes Dunkelgrün mit Leiterbahn), Stahlträger, Betonblock, Brennstab (Stab mit leuchtendem Ende), Atommüll-Fass mit Strahlenzeichen, Müllsack, Raketenteil, Munition (Patrone/Magazin), panzerbrechende Munition, Reparaturpaket; **kein Item ist ein einfacher Kreis**; unbekannte IDs behalten die Standardform
- [ ] **Ofen** und **Abbaumaschine Mk1/Mk2** im neuen Look (aus der Phase 1 übernehmen und umstylen: gedeckte Palette, Rost, Ruß; Bohrer dreht, Glut glüht, Rauch)
- [ ] Screenshots (Bänder mit Kurven und Items, Öfen, Abbaumaschinen; nah/mittel/weit) in `docs/screenshots/r2-art-factory/`, **selbst ansehen**: ernst und industriell, Items lesbar?
- [ ] FPS-Benchmark vorher/nachher, PR, CI, mergen → **STOPP: Screenshot-Pfade und 5 Zeilen Beschreibung, auf OK warten**

### M2 – alle übrigen Maschinen
- [ ] **Greifarm:** Gelenkarm mit Basis, Greifer; schwenkt sichtbar von Quelle zu Ziel, hält das Item (`t`-Fortschritt aus der Logik)
- [ ] **Montagemaschine:** Arbeitsfläche mit beweglichem Werkzeugkopf (nur bei Arbeit), das **Rezept-Icon** (erstes Nicht-Müll-Ergebnis) klein sichtbar; Status-LED (läuft/wartet/ohne Strom)
- [ ] **Kohlekraftwerk:** hoher Schornstein mit dunklem Rauch, Kohlebunker, Glut; **Atomkraftwerk:** zwei Kühltürme mit Dampfsäule, Reaktorgebäude, Warnzeichen (verblasstes Gelb), grünes Glimmen nur am Kern; **KI-Rechenzentrum:** flacher Block mit Rack-Reihen, blinkende Cyan-LEDs, Kühlwasser-Rohre
- [ ] **Müllkippe** (Halde mit Schrott, Rauchschwaden), **Entsorgungsanlage** (Filterbecken, Förderband-Schlund), **Öko-Ofen** (sauberer, gedämpftes Grün als Akzent, kein Rauch), **Solarpark** (Paneel-Reihen, spiegeln je nach Tag/Nacht; Tageslicht als Parameter aus der Logik-Datei durchreichen)
- [ ] **Seilbahn:** Stationsgebäude mit Seilrolle, gespannte Seile, **fahrende Gondeln** mit Item
- [ ] **Lagerkisten:** Stahlcontainer mit Rost und Füllstandsanzeige
- [ ] Screenshots aller Maschinen (nah/mittel/weit), ansehen, FPS, PR, CI, mergen

### M3 – Progression-Optik und Feinschliff
- [ ] **Wrack:** beschädigtes Raumschiff als Basis, schwelender Rauch, gelegentliche Funken; je weniger HP, desto schlimmer (HP als Parameter durchreichen)
- [ ] **Raketenrampe** mit Startgerüst neben dem Wrack und **Startanimation** (Countdown, Rauch am Boden, Aufsteigen) aus `rocket.ts`
- [ ] **Kernschmelze:** Glühen, Druckwelle und Strahlungs-Ausbreitung; **Bildschirm-Wackeln** nur wenn `settingsOf(game).screenShake` (Vorschlag: kurze CSS-Verschiebung des Canvas-Elements, damit kein Core-Code nötig ist)
- [ ] **Demonstrationen:** schlichte, ernste Figurengruppe (Silhouetten in Alltagskleidung, **keine** Gesichter, **keine** Gewalt), Schilder mit den vorhandenen Parolen, Gruppe wirkt lebendig (leichtes Schwanken), blockiertes Gebäude bleibt klar erkennbar (rote LED)
- [ ] LOD- und Leistungsfeinschliff, FPS-Messung (**unter 10 ms/Frame bei 500 Gebäuden**), Abschlussbericht

## Testanleitung
- `http://localhost:5173/?seed=7&start=1`. F1: **„+100 jedes Item“**, **„Alles erforschen“**, Gebäude aus der Liste wählen und setzen; `debug:source` (Item im Panel wählen) füttert Bänder und Maschinen zum Anschauen.
- Konsole für Szenen: `game.placeBuilding('factory:furnace', x, y, dir, { free: true })`; Kraftwerk mit Kohle: `game.inventory.add('coal', 5)` und das Kraftwerk anklicken.
- Progression-Effekte: Aktionen-Menü (K) im Dev-Modus: **„Demonstration starten“**, **„Kernschmelze auslösen“**; Rakete: `game.inventory.add('rocket_part', 10)` und Aktion **„Rakete starten“**.
- Screenshots im Headless-Browser (ROUND2.md Abschnitt 8): **nah, mittel, weit**; **Bilder ansehen** und prüfen: Richtung, Überlappung nach y, Lesbarkeit der Items, Rost/Ruß statt Bonbonfarben.
- FPS-Benchmark aus ROUND2.md Abschnitt 8 vorher/nachher; zusätzlich mit Partikeln (alle Öfen arbeiten, Kraftwerke laufen).

## Start-Prompt (1:1 in Claude Code einfügen)
```
Du arbeitest im Repo Matthi1009/Factory-Escpace, Paket art-factory. Lies zuerst CLAUDE.md, docs/ROUND2.md und docs/tasks/r2-art-factory.md.
Du änderst ausschließlich deine exklusiven Dateien (Abschnitt "Exklusive Dateien" in deiner Aufgabendatei und docs/ROUND2.md, Abschnitt 6), in Logik-Dateien nur den Zeichencode. Brauchst du mehr: Issue-Text mit Label core-request ausgeben und mit dem Fallback aus ROUND2.md 4.0 weitermachen. Fällt dir ein Logikfehler auf: GitHub-Issue anlegen, nicht selbst reparieren.
Branch r2/art-factory (von main). Commit nach jedem Teilschritt, erledigte Punkte in docs/tasks/r2-art-factory.md abhaken.
Beginne mit M0, halte ihn klein und merge ihn schnell: git pull origin main, npm run build, PR, grüner CI, gh pr merge --merge. M1 startest du erst, wenn art-world M0a in main ist (prüfe git log und die Datei docs/tasks/r2-art-world.md auf main).
Nach jedem Meilenstein: main mergen, npm run build, im Headless-Browser Screenshots machen und selbst ansehen, ob es ernst und industriell wirkt (nicht verspielt), PR, CI, mergen, main zurückholen.
STOPP nach M1: Screenshot-Pfade und 5 Zeilen Beschreibung ausgeben und auf mein OK warten. Danach M2 und M3 ohne Rückfragen.
STOPP auch bei: neuen npm-Paketen, Konflikten in Dateien, die dir nicht gehören, FPS unter 60 (über 10 ms/Frame im Benchmark).
Wirst du neu gestartet: lies git log und docs/tasks/r2-art-factory.md und mach dort weiter.
Am Ende: Zusammenfassung, FPS vorher und nachher, Screenshot-Pfade und eine Testliste für den Browser.
```
