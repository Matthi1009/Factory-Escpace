# Paket `ui-menu-map` (Runde 2)

Branch `r2/ui-menu-map` · Vertrag und Regeln: [docs/ROUND2.md](../ROUND2.md) (zuerst lesen!)

## Ziel und Zuständigkeit
Alles, was der Spieler als Oberfläche sieht und bedient – **im ernsten Industrie-Look** (ROUND2.md, Abschnitt 3) – plus die **Zustandsmaschine und die Einstellungen** des Spiels.

**Dazu gehört:**
- **Spielzustand** `game.state` (`menu` | `playing` | `paused` | `gameover` | `victory`), Event `stateChanged`, Start per `?start=1`, `newGame()`, `backToMenu()` (ROUND2.md 4.1)
- **Einstellungen** `game.settings` mit `localStorage` (ROUND2.md 4.2)
- **Esc-Logik:** Auswahl aufheben → Fenster schließen → Pausemenü
- **Hauptmenü** „Factory Escape“: Neues Spiel mit Seed-Feld, Einstellungen, Steuerung, Credits (Namen aus `docs/TEAM.md`), im Hintergrund die laufende Welt mit langsamer Kamerafahrt
- **Pausemenü:** Weiter, Einstellungen, Steuerung, Zurück zum Hauptmenü
- **Game-Over- und Sieg-Bildschirm** mit Statistik (Spielzeit, Verschmutzung in %, produzierte Items) und Knopf zum Hauptmenü
- **Minikarte** (unten rechts) und **große Karte (M)**
- **Das komplette bestehende UI** (HUD, Bauleiste, Inventar, Crafting, Forschung, Tooltip, Übersicht, Aktionen, Meldungen, Fenster) im neuen Look: dunkle abgenutzte Metall-Panels, Nieten, Warnstreifen an Kopfzeilen, klare eigene Icons, nur System-Schriften

**Ausdrücklich NICHT:**
- Spiellogik (Kosten, Forschung, Geld, Verschmutzung) und neue Gebäude/Rezepte
- Spielfigur, Reichweite, Kamera-Folgen, Waffe (→ player-defense)
- Terrain-, Gebäude-, Monster-Zeichnung (→ art-world, art-factory)
- Änderungen an `Game.ts`, `Interaction.ts`, `core/index.ts` (gehören anderen bzw. niemandem)

## Exklusive Dateien (nur diese darfst du ändern)
- `src/features/ui/**`
- `src/features/factory/dialogs/**` (Rezept-Dialog: Optik, `data-esc-closable`-Markierung, Esc über dein Capture-Muster statt `onKey`)
- neue Core-Dateien: `src/core/state/GameState.ts`, `src/core/state/Settings.ts`
- `docs/screenshots/r2-ui-menu-map/**`, diese Aufgabendatei

Alles andere ist tabu (ROUND2.md 6). Brauchst du eine fremde Datei: Issue-Text mit Label `core-request` ausgeben, mit Fallback weitermachen. Neue Core-Dateien importierst du per **Tiefenpfad** (`'../../core/state/Settings'`), nicht über den Barrel.

## Verträge
**Du lieferst (M0):** Spielzustand (4.1) und Einstellungen (4.2), exakt mit den Signaturen aus ROUND2.md.
**Du nutzt (mit Fallback, immer lazy lesen):**
- Spieler (4.3): `playerOf(game)` für Pfeil auf der Karte und HP-Anzeige; fehlt er, zeichnest du den Pfeil am Wrack (`game.wreck`) und blendest die HP-Anzeige aus
- Monster-Positionen: `game.getMonsters?.()`; fehlt es, keine roten Punkte
- `settings` für Minikarte an/aus, Partikel/Wackeln/Qualität im Einstellungen-Menü
- Palette: lies Farben aus `PALETTE` (`src/core/art/`); **nutze bis art-world M0a die vorläufigen Werte aus ROUND2.md Abschnitt 3** (eigene CSS-Variablen in `src/features/ui/styles.ts`), damit dein UI nicht von deren Lieferung abhängt

### Umsetzung der Zustandsmaschine ohne `Game.ts` (Pflicht-Algorithmus)
1. `installGameState(game)` wird am Anfang von `register()` des ui-Moduls aufgerufen. Es definiert `state`, `setState`, `startPlaying`, `newGame`, `backToMenu` (Interface-Merging aus ROUND2.md, Einträge mit `Object.defineProperty` auf der Instanz).
2. Startzustand: `new URLSearchParams(location.search).get('start') === '1'` → `playing`, sonst `menu`; im Zustand `menu` sofort `game.setPaused(true)`.
3. Synchronisation über das bestehende Event `pauseChanged` (auch `P` ruft `game.togglePause()`):
   - `paused === false` und Zustand `menu`/`gameover`/`victory` → sofort wieder `game.setPaused(true)`;
   - `paused === true` und Zustand `playing` → Zustand `paused`; `paused === false` und Zustand `paused` → `playing`.
4. Event `gameOver` des Core: `won ? 'victory' : 'gameover'`.
5. `setState(s)` setzt `game.setPaused(s !== 'playing')` (außer bei `gameover`/`victory`, dort ist es schon pausiert) und feuert `stateChanged { state, prev }`.
6. Esc: Capture-Listener-Muster aus ROUND2.md 4.1. Offene Fenster zählt, was dein `closeAllPanels()` schließt **und** jedes Element in `game.uiRoot` mit `data-esc-closable` (der Rezept-Dialog der factory bekommt dieses Attribut von dir und schließt sich bei Esc selbst; dein Pause-Handler pausiert dann nicht).
7. Im Zustand `menu`: Kamerafahrt per `requestAnimationFrame` (Zoom ≈ 20, langsame Bahn um `game.world.spawn`, ±35 Kacheln). Im Menü sind Bauleiste/HUD/Fenster ausgeblendet. Die Kamerafahrt endet bei `stateChanged` ≠ `menu`; der Kamera-Folge-Modus von player-defense greift erst danach.

## Meilensteine

### M0 – Grundlage (klein, schnell mergen)
- [ ] `src/core/state/GameState.ts`: Typ, Interface-Merging, `installGameState(game)` (Algorithmus oben)
- [ ] `src/core/state/Settings.ts`: Klasse, `localStorage` mit try/catch, Event `settingsChanged`, `installSettings(game)`
- [ ] Aufruf beider `install…` am Anfang von `register()` in `src/features/ui/index.ts`
- [ ] Esc-Logik (Capture-Muster), `data-esc-closable` im Rezept-Dialog (`factory/dialogs/recipeDialog.ts`)
- [ ] Platzhalter: ein einfacher „Start“-Knopf im Zustand `menu` (ruft `game.startPlaying()`); der alte eigene Startbildschirm und die Taste M des alten ui-Menüs entfallen
- [ ] Der HUD-Hinweis PAUSE erscheint nur im Zustand `paused`
- [ ] Prüfen: ohne `?start=1` tickt nichts (`game.tickCount` steht), mit Start-Knopf läuft es; `P` im Menü startet **nicht**; Esc: Auswahl → Fenster → Pause
- [ ] `npm run build` grün, PR, CI, `gh pr merge --merge`

### M1 – Hauptmenü, Pausemenü, Einstellungen, Game Over (danach STOPP)
- [ ] Neuer Stil-Grundbaukasten in `src/features/ui/`: Panels (Metall, Nieten), Knöpfe, Kopfzeilen mit Warnstreifen, Icon-Satz (selbst gezeichnete SVG/Canvas-Icons)
- [ ] Hauptmenü: Titel, Neues Spiel (Seed-Feld, Zufalls-Knopf), Einstellungen, Steuerung, Credits (Namen aus `docs/TEAM.md` fest im Code), Welt läuft im Hintergrund mit Kamerafahrt
- [ ] Pausemenü (Esc/☰): Weiter, Einstellungen, Steuerung, Zurück zum Hauptmenü
- [ ] Einstellungen-Seite: Qualität (niedrig/mittel/hoch), Wackeln, Partikel, Minikarte → schreibt in `game.settings`
- [ ] Steuerung-Seite: alle Tasten aus ROUND2.md Abschnitt 5
- [ ] Game-Over- und Sieg-Bildschirm mit Statistik (Spielzeit, Verschmutzung in % verschmutzter Kacheln, produzierte Items) und Knopf zum Hauptmenü
- [ ] Screenshots in `docs/screenshots/r2-ui-menu-map/`, selbst ansehen: ernst und industriell, nicht verspielt?
- [ ] PR, CI, mergen → **STOPP: Screenshot-Pfade und 5 Zeilen Beschreibung, auf OK warten**

### M2 – Minikarte, restliches UI im neuen Look
- [ ] Minikarte unten rechts: Terrain, Erz, Gebäude, Spieler als Pfeil (Blickrichtung), Monster rot, Verschmutzung als halbtransparente Farbschicht; Klick springt (nur im freien Kameramodus sinnvoll, sonst nur anzeigen); folgt `settings.minimap`
- [ ] Rechenzeit: Weltabbild höchstens 1× pro Sekunde neu berechnen, Spielerpfeil/Kamerarahmen öfter
- [ ] HUD, Bauleiste, Inventar, Crafting, Forschung, Tooltip, Übersicht, Aktionen, Meldungen, Gebäude-Info im neuen Look (eigene Icons, Warnstreifen, Nieten)
- [ ] HP-Anzeige des Spielers im HUD (nur wenn `playerOf(game)` vorhanden)
- [ ] Screenshots, ansehen, PR, CI, mergen

### M3 – Große Karte (M)
- [ ] Fenster mit Canvas, **zoom- und verschiebbar** (Mausrad, Ziehen)
- [ ] Ebenen umschaltbar: **Verschmutzungs-Heatmap** (Farbverlauf transparent → gelb → orange → dunkelrot → schwarzbraun), Strahlung, Temperatur, Wasser/Dürre, Monster (`getMonsters`), Gebäude, Spieler
- [ ] Legende: Anteil verschmutzter Kacheln in % (Schwelle: Verschmutzung > 0,5), verschmutzte Fläche in Kacheln, **Trend der letzten 60 s** (Pfeil + Prozentpunkte), **weitester verschmutzter Punkt vom Wrack** (Entfernung in Kacheln), **Kurve über die Spielzeit** (Verlauf des verschmutzten Anteils, Abtastung alle 5 s, max. 720 Punkte)
- [ ] **Karte höchstens 2× pro Sekunde neu berechnen**; Taste M öffnet/schließt, Esc schließt
- [ ] Feinschliff: alle Fenster einheitlich, Fokus/Tastatur, Layout bei kleinem Fenster
- [ ] Screenshots, ansehen, FPS-Messung, PR, CI, mergen, Abschlussbericht

## Testanleitung
- Zustand: `http://localhost:5173/?seed=7` (Menü) und `?seed=7&start=1` (direkt im Spiel). In der Konsole: `game.state`, `game.tickCount`.
- Debugpanel (F1): „+100 jedes Item“, „+10.000 Geld“, „Alles erforschen“ füllen Inventar/Forschung; mit dem **Umwelt-Pinsel** Verschmutzung malen und in Minikarte und großer Karte prüfen; „Angriffswelle ankündigen“ / „Käfer spawnen“ für Monster-Punkte; `game.endGame(true, 'Test')` bzw. `(false, 'Test')` für Sieg/Game Over.
- Screenshots im Headless-Browser (ROUND2.md Abschnitt 8): Menü, Pausemenü, Einstellungen, Game Over, Minikarte, große Karte mit Heatmap. **Bilder ansehen** und prüfen.
- FPS: Benchmark aus ROUND2.md Abschnitt 8 **mit geöffnetem HUD und Minikarte** vorher und nachher (Ziel: unter 10 ms/Frame bei 500 Gebäuden, ganz herausgezoomt). Karten-Neuberechnung darf keine Frame-Spitzen erzeugen.

## Start-Prompt (1:1 in Claude Code einfügen)
```
Du arbeitest im Repo Matthi1009/Factory-Escpace, Paket ui-menu-map. Lies zuerst CLAUDE.md, docs/ROUND2.md und docs/tasks/r2-ui-menu-map.md.
Du änderst ausschließlich deine exklusiven Dateien (Abschnitt "Exklusive Dateien" in deiner Aufgabendatei und docs/ROUND2.md, Abschnitt 6). Brauchst du mehr: Issue-Text mit Label core-request ausgeben und mit dem Fallback aus ROUND2.md 4.0 weitermachen.
Branch r2/ui-menu-map (von main). Commit nach jedem Teilschritt, erledigte Punkte in docs/tasks/r2-ui-menu-map.md abhaken.
Beginne mit M0, halte ihn klein und merge ihn schnell: git pull origin main, npm run build, PR, grüner CI, gh pr merge --merge.
Nach jedem Meilenstein: main mergen, npm run build, im Headless-Browser Screenshots machen und selbst ansehen, ob es ernst und industriell wirkt (nicht verspielt), PR, CI, mergen, main zurückholen.
STOPP nach M1: Screenshot-Pfade und 5 Zeilen Beschreibung ausgeben und auf mein OK warten. Danach M2 und M3 ohne Rückfragen.
STOPP auch bei: neuen npm-Paketen, Konflikten in Dateien, die dir nicht gehören, FPS unter 60 (über 10 ms/Frame im Benchmark).
Wirst du neu gestartet: lies git log und docs/tasks/r2-ui-menu-map.md und mach dort weiter.
Am Ende: Zusammenfassung, FPS vorher und nachher, Screenshot-Pfade und eine Testliste für den Browser.
```
