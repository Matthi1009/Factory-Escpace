# Art-Status (Grafik-Überarbeitung)

Stil: siehe [ART_STYLE.md](ART_STYLE.md). Wird die Arbeit unterbrochen: zuerst `git log` und diese Datei lesen und dort weitermachen.

## Phase 1 – Stil festlegen
- [x] `docs/ART_STYLE.md`
- [x] `src/core/art/`: Palette, Licht-Konstanten, LOD, Helfer (`drawMetalPanel`, `drawHazardStripes`, `drawBolts`, `drawPipeStub`, `drawFan`, `drawStatusLed`, `drawShadow`, `drawGlow`), Sprite-Cache, Partikelsystem (Pool mit Obergrenze)
- [x] Beispiele: Ofen, Förderband (inkl. Kurve), Abbaumaschine Mk1/Mk2 in `src/features/factory/art/`
- [x] Screenshots nah/mittel/weit in `docs/screenshots/phase1-*.png`
- [ ] PR, CI, Merge → **STOPP, Freigabe abwarten**

## Phase 2 (nach Freigabe, Reihenfolge)
- [ ] terrain (environment)
- [ ] factory (alle Maschinen)
- [ ] items
- [ ] environment: Verteidigung und Monster
- [ ] progression
- [ ] ui
- [ ] Effekte und Feinschliff

## Messungen (Headless-Chromium, 500 Gebäude: 60 Abbaumaschinen, 264 Bänder, 88 Öfen, 88 Kisten, 1280×720)
Gemessen wird die Zeit von `renderer._render()` pro Frame (Mittel über 200 Frames).

| Zoom | vorher (Formen/Farben) | Phase 1 |
|---|---|---|
| 8 (weit, alle 500 sichtbar) | 5,61 ms | 5,61 ms |
| 16 (mittel) | 5,55 ms | 6,29 ms |
| 40 (nah) | 1,30 ms | 3,53 ms |
| echte Bildrate (rAF) | 58 FPS | 60 FPS |

Ziel: 60 FPS (16,7 ms/Frame) mit 500 Gebäuden ganz herausgezoomt. In Phase 1 sind erst Ofen, Band und Abbaumaschine neu gezeichnet (Kisten noch alt).
