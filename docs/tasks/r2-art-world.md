# Paket `art-world` (Runde 2)

Branch `r2/art-world` · Vertrag und Regeln: [docs/ROUND2.md](../ROUND2.md) (zuerst lesen!)

## Ziel und Zuständigkeit
Die **Grafik-Grundlage im Core** (sortierte Ebene, Palette, LOD, Partikel) und die **Optik der Welt**: Terrain, Erzfelder, Wasser, Bäume, sichtbare Umweltzerstörung, Monster, Kraftfeld, Rauch und Explosionen. Du legst außerdem die **Palette** und die **Referenz-Stilprobe** fest, an der sich alle orientieren.

**Dazu gehört:**
- `renderer.addSortedDrawable` und die Ebene `'sorted'`; die Gebäude des Core laufen darüber (ROUND2.md 4.4)
- Palette-Slots (ROUND2.md Abschnitt 3), LOD nach `settings.quality`, Partikel-Arten `chunk`/`shell`, Partikel respektieren `settings.particles`
- Zeichencode aus `environment/` nach `environment/art/` auslösen (mechanisch, optisch unverändert)
- **Referenz-Stilprobe:** Grasboden mit Eisenerzfeld, Screenshots unter `docs/screenshots/reference/`
- **Terrain:** prozedurale Texturen für Erde, Gras, Sand, Fels (mit Steinchen, Grasbüscheln, Rissen), alle sechs Erzfelder als sichtbare Brocken, Wasser, Bäume mit Schatten
- **Sichtbare Umweltzerstörung** (stufenweise, siehe M2)
- **Monster-Optik:** mutierte Kreaturen mit Laufanimation, Treffer- und Todes-Effekt, verblassende Überreste (nicht menschlich, nicht niedlich)
- **Kraftfeld-Optik, Rauch-/Dampfsäulen, Explosionen**; optional Tag-Nacht-Zyklus mit Lichtern
- `docs/ART_STYLE.md` und `docs/ART_STATUS.md` auf den neuen Stil umschreiben (die aus der Grafik-Phase 1 sind **überholt**: orange „Satisfactory-Look“, Screenshots `phase1-*`)

**Ausdrücklich NICHT:**
- Optik der Maschinen, Items, des Wracks, der Raketenrampe, der Demonstrationen (→ art-factory)
- Spielfigur und Optik der Türme/Mauern/Tore (→ player-defense)
- Logik jeder Art: Verschmutzung, Klima, Terrain-**Umwandlung** (Sterben der Pflanzen), Monster-Verhalten, Spawn-Raten. Das alles bleibt, du zeichnest nur, was die Logik hergibt
- Menüs, Karten (→ ui-menu-map)

## Exklusive Dateien (nur diese darfst du ändern)
- `src/core/art/**` **außer** `items*`, `wreck*`, `buildings*`
- `src/core/render/Renderer.ts`
- `src/core/Game.ts` — **nur** die Gebäude-Zeichnung (siehe M0a)
- in `src/features/environment/`: `art/**` **außer** `defense-*`, `terrain.ts`, `overlay.ts`, `effects.ts`, `index.ts` (nur die Zeile `registerArt(game);`)
- Nur während **M0b** (mechanisch, optisch unverändert) darfst du außerdem Zeichencode aus diesen Logik-Dateien herauslösen: `environment/monsters/MonsterManager.ts`, `monsters/waves.ts`, `defense/Wall.ts`, `defense/Turret.ts`, `defense/ForceField.ts`, `defense/index.ts`
- `docs/ART_STYLE.md`, `docs/ART_STATUS.md`, `docs/screenshots/reference/**`, `docs/screenshots/r2-art-world/**`, diese Aufgabendatei

**Tabu:** `src/features/ui/`, `src/features/player/`, `src/features/factory/`, `src/features/progression/`, `Interaction.ts`, `Camera.ts`, `main.ts`. Die vorhandenen Namen in `src/core/art/` (`PALETTE`, `lodOf`, `drawMetalPanel`, `drawBuildingSprite`, `particlesOf`, …) **bleiben bestehen**: art-factory nutzt sie bereits (nur erweitern, nie umbenennen oder entfernen). Neue Core-Dateien importiert man per Tiefenpfad; `core/index.ts` ändert niemand.

## Verträge
**Du lieferst:** Grafik-Grundlage (ROUND2.md 4.4), Palette-Slots (Abschnitt 3), `setLodQuality`, Partikel-Arten.
**Du nutzt (mit Fallback, immer lazy):** `settingsOf(game)` (`quality`, `particles`), `stateOf(game)`. `installArt(game)` (in `src/core/art/install.ts`, neu) abonniert `settingsChanged` über `onEvent` (4.0) und liest beim Start einmal den Ist-Wert; **fehlt `game.settings`, gelten die Standardwerte** (`medium`, Partikel an).

## Meilensteine

### M0a – Grafik-Grundlage und Stilprobe (klein, schnell mergen; schaltet art-factory M1 frei)
- [ ] `Renderer.ts`: Ebene `'sorted'` (zwischen `'overlay'` und `'buildings'`), `addSortedDrawable`/`removeSortedDrawable`, Culling über `x/cy/radius`, Sortierung nach `y`, jedes Objekt in `save()/restore()`, Fehler abfangen. `RENDER_LAYERS` nur erweitern.
- [ ] `Game.ts`: Gebäude beim Platzieren als sortierte Objekte anmelden (`y = b.y + size.h`, `x/cy` = Mitte, `radius = max(w,h)/2 + 2`), beim Entfernen/Zerstören abmelden; die bisherige `drawBuildings`-Schleife im `'buildings'`-Hook entfällt. **HP-Balken, „blockiert“-Markierung und „deaktiviert“-Abdunklung bleiben unverändert.** Nichts anderes in `Game.ts` ändern.
- [ ] `src/core/art/palette.ts`: alle Slots aus ROUND2.md Abschnitt 3 **zusätzlich** zu den vorhandenen (u. a. `earth`, `earthDark`, `dirt`, `rust`, `rustLight`, `rustDark`, `steelWorn`, `oil`, `soot`, `hazardFaded`, `concrete`, `grass`, `grassDark`, `sand`, `rock`, `electric`). Werte dürfen feinjustiert, **Namen nicht geändert** werden.
- [ ] `lod.ts`: `setLodQuality('low' | 'medium' | 'high')` (Vorschlag: Schwellen × 1,7 bei `low`, × 0,7 bei `high`); `particles.ts`: Arten `'chunk'` (Brocken) und `'shell'` (Hülsen), Schalter `enabled` (= `settings.particles`) und Obergrenze je Qualität (Vorschlag 150 / 350 / 600), `emit`/`emitRate` tun nichts bei `enabled = false`
- [ ] `src/core/art/install.ts` (neu): `installArt(game)` verbindet Einstellungen (lazy, Shim) mit LOD und Partikeln und leert den Sprite-Cache bei Qualitätswechsel; Aufruf aus `environment/art/index.ts` (`registerArt(game)`), eingehängt durch **eine** Zeile in `environment/index.ts`
- [ ] **Referenz-Stilprobe:** Boden-Painter im neuen Look in `src/core/art/terrain.ts` (`GROUND_PX` und `defaultGroundPainter` ziehen aus `Renderer.ts` hierher um; `Renderer.ts` re-exportiert beide, damit die API bleibt): Gras mit Variation und Eisenerzfeld mit sichtbaren Brocken
- [ ] Screenshots **nah, mittel, weit** in `docs/screenshots/reference/` (Boden mit Erzfeld plus ein paar vorhandene Gebäude), **ansehen**: ernst, industriell, nicht verspielt? `docs/ART_STYLE.md` auf den neuen Stil umschreiben (Perspektive, Licht, Palette, Formsprache, Status-LEDs, Do’s/Don’ts mit Verweis auf die Screenshots)
- [ ] Prüfen: Spiel sieht unverändert aus (außer Boden), Gebäude überdecken sich nach y korrekt (Gebäude weiter unten liegt vorne), FPS-Benchmark vorher/nachher
- [ ] `npm run build` grün, PR, CI, `gh pr merge --merge`

### M0b – Zeichencode aus `environment/` herauslösen (schaltet player-defense M2 frei)
Rein mechanisch, **optisch nichts ändern**: Zeichencode **unverändert** nach `src/features/environment/art/` verschieben; die Logik-Datei ruft nur noch die Funktion auf und reicht benötigten Zustand als Parameter durch.
- [ ] `effects.ts` (Tracer/Effekte) → `art/effects.ts`; `overlay.ts` (Verschmutzungs-Overlay) → `art/overlay.ts`; Boden-Painter in `terrain.ts` → `art/terrainPaint.ts`
- [ ] `monsters/MonsterManager.ts` (Zeichnen der Monster) → `art/monsters.ts`; `monsters/waves.ts` (Warnpfeil) → `art/waveWarning.ts`
- [ ] `defense/Wall.ts` → `art/defense-wall.ts`; `defense/Turret.ts` → `art/defense-turret.ts` (diese beiden **gehen danach an player-defense**); `defense/ForceField.ts` → `art/forcefield.ts` (bleibt bei dir); Zeichencode in `defense/index.ts` → `art/defense-ranges.ts` (an player-defense)
- [ ] `environment/art/index.ts` (in M0a angelegt) um die Zeichen-Hooks erweitern: `registerArt(game)` meldet die ausgelösten Funktionen an; die **eine** Zeile in `environment/index.ts` steht schon seit M0a
- [ ] Prüfen: Screenshot-Vergleich vorher/nachher zeigt keinen Unterschied; Monster, Türme, Mauern, Kraftfeld, Verschmutzungs-Overlay funktionieren wie vorher (F1: „Käfer spawnen“, Umwelt-Pinsel, Türme bauen)
- [ ] PR, CI, mergen. **Danach** gehören `defense/**` und `monsters/**` player-defense: du fasst sie nicht mehr an. In `ART_STATUS.md` und im PR festhalten: „M0b gemerged“

### M1 – Terrain (danach STOPP)
- [ ] Prozedurale Bodentexturen mit deterministischem Noise (`hash2`/`valueNoise` aus dem Core): **Erde, Gras, Sand, Fels** mit Steinchen, Grasbüscheln, Rissen, weichen Übergängen zwischen Terrain-Arten; kein Einheitsfarb-Muster
- [ ] **Alle sechs Erzfelder** als sichtbare Brocken, je Ressource unterscheidbar: Eisen rötlich-grau, Kupfer orange-metallisch (mit grünlicher Patina), Kohle schwarz glänzend, Stein grau, Granit gesprenkelt (rosa/grau), Uran grün glimmend (leichtes Leuchten als animiertes Overlay, sparsam)
- [ ] **Wasser:** Ufer mit nassem Sand, dunkleres Tiefwasser, dezente Bewegung als Overlay
- [ ] **Bäume** von oben gesehen (Kronen mit Schatten nach rechts unten), in Wald-Kacheln; Auflösung des Bodens anpassen (`GROUND_PX` 12 oder 16; Speicher beachten: Boden-Canvas = 256 × `GROUND_PX` Pixel je Seite) und messen, dass der Start unter ca. 1 s bleibt
- [ ] Änderungen nur in **Teilbereichen** neu zeichnen (`invalidateGround(x, y, w, h)`), **nie** jeden Frame; der Boden bleibt im Offscreen-Canvas
- [ ] Screenshots nah/mittel/weit in `docs/screenshots/r2-art-world/`, ansehen, FPS messen, PR, CI, mergen → **STOPP: Screenshot-Pfade und 5 Zeilen Beschreibung, auf OK warten**

### M2 – Umweltzerstörung und Monster
- [ ] **Sichtbare Umweltzerstörung, stufenweise** (aus den Werten in `game.env` und dem Terrain-Typ, den die Logik setzt): gesund grün → **ausgetrocknet** braun → **tot** grau; **ölig/dunkel** bei hoher Verschmutzung; **radioaktiv** mit grünlichem Schimmer; **Smog-Schleier** als Overlay (`environment/art/overlay.ts`)
- [ ] Bäume werden bei Verschmutzung **kahl** und sterben ab; Wasserflächen sehen bei Wassermangel entsprechend ausgetrocknet aus (Ufer zieht sich zurück: die Logik wandelt Kacheln um, du zeichnest sie)
- [ ] **Monster:** mutierte Kreaturen von oben/schräg, **Lauf-Animation** (Beine bzw. Wackeln), leuchtende Mutationsmerkmale (Adern, Auswüchse), **Mutationsstufen optisch unterscheidbar** (Typen aus `environment/monsters/types.ts`), asymmetrisch, Chitin/Risse, **nicht menschlich, nicht niedlich**; als `SortedDrawable` (`addSortedDrawable`)
- [ ] Treffer-Effekt (kurzes Aufblitzen, Spritzer), Todes-Effekt, **verblassende Überreste**
- [ ] Screenshots (Stufen der Zerstörung, Monster in Bewegung und tot), ansehen, FPS (auch mit 40 Monstern), PR, CI, mergen

### M3 – Kraftfeld, Effekte, Feinschliff
- [ ] **Kraftfeld** (`art/forcefield.ts`): flimmernde Kuppel (kein glattes Blau), Treffer-Wellen
- [ ] **Rauch- und Dampfsäulen**, **Explosionen** in `src/core/art/effects*` (vom Partikelsystem getragen, mit Obergrenze); für Gebäude-Zerstörung und Kernschmelze nutzbar (art-factory ruft sie auf)
- [ ] Optional **Tag-Nacht-Zyklus** mit Lichtern (abschaltbar über `settings.quality = 'low'`)
- [ ] LOD- und Leistungsfeinschliff (Boden-Overlays), FPS-Messung, `ART_STATUS.md` aktualisieren, Abschlussbericht

## Testanleitung
- `http://localhost:5173/?seed=7&start=1`. F1: **Umwelt-Pinsel** (Feld wählen, „Am Mauszeiger erhöhen“, linke Maustaste halten) malt Verschmutzung/Strahlung/Temperatur/Wasser und zeigt die Stufen der Zerstörung; „Feld anzeigen“ = Heatmap; Aktion **„Käfer spawnen“**, **„Jede Mutation einmal spawnen“**, **„Angriffswelle ankündigen“**; Gebäude über das Panel setzen.
- `game.renderer.invalidateGround()` in der Konsole erzwingt das Neuzeichnen des Bodens (messen: dauert es nur einmal?).
- Screenshots im Headless-Browser (ROUND2.md Abschnitt 8): **nah, mittel, weit**; Vergleich vorher/nachher bei M0b. **Bilder ansehen**: Wirkt es ernst, schmutzig-industriell, nicht verspielt? Stimmen Schatten (rechts unten) und die Überlappung nach y?
- FPS-Benchmark aus ROUND2.md Abschnitt 8 vorher und nachher (Ziel: unter 10 ms/Frame bei 500 Gebäuden, ganz herausgezoomt; Referenz heute 5,6 ms). Die Messung gehört in jeden PR-Text.

## Start-Prompt (1:1 in Claude Code einfügen)
```
Du arbeitest im Repo Matthi1009/Factory-Escpace, Paket art-world. Lies zuerst CLAUDE.md, docs/ROUND2.md und docs/tasks/r2-art-world.md.
Du änderst ausschließlich deine exklusiven Dateien (Abschnitt "Exklusive Dateien" in deiner Aufgabendatei und docs/ROUND2.md, Abschnitt 6). Brauchst du mehr: Issue-Text mit Label core-request ausgeben und mit dem Fallback aus ROUND2.md 4.0 weitermachen.
Branch r2/art-world (von main). Commit nach jedem Teilschritt, erledigte Punkte in docs/tasks/r2-art-world.md abhaken.
Beginne mit M0a, halte ihn klein und merge ihn schnell: git pull origin main, npm run build, PR, grüner CI, gh pr merge --merge. Danach M0b genauso (rein mechanisch, optisch unverändert).
Nach jedem Meilenstein: main mergen, npm run build, im Headless-Browser Screenshots machen und selbst ansehen, ob es ernst und industriell wirkt (nicht verspielt), PR, CI, mergen, main zurückholen.
STOPP nach M1: Screenshot-Pfade und 5 Zeilen Beschreibung ausgeben und auf mein OK warten. Danach M2 und M3 ohne Rückfragen.
STOPP auch bei: neuen npm-Paketen, Konflikten in Dateien, die dir nicht gehören, FPS unter 60 (über 10 ms/Frame im Benchmark).
Wirst du neu gestartet: lies git log und docs/tasks/r2-art-world.md und mach dort weiter.
Am Ende: Zusammenfassung, FPS vorher und nachher, Screenshot-Pfade und eine Testliste für den Browser.
```
