# Build-Status Grundgerüst

Fortschritt der Instanz, die das Grundgerüst baut. Bei Neustart: `git log` + diese Datei lesen und bei „Als Nächstes“ weitermachen.

## Erledigt
- [x] Vite + TypeScript (strict) aufgesetzt, `npm run build` inkl. Modulgrenzen-Check (`scripts/check-boundaries.mjs`)
- [x] Core: Inhalte (`src/core/content/`), Registries, EventBus, Zufall/Noise
- [x] Core: Welt 256×256 + Weltgenerierung per Seed (Start-Erzfelder am Spawn)
- [x] Core: Renderer (HiDPI, Kamera, Boden-Cache, Ebenen, Draw-Hooks, drawItem, Assets)
- [x] Core: Gebäude-System (BuildingDef, BaseBuilding, Item-Transfer, core:chest, debug:source, Wrack)
- [x] Core: Zustände (env, economy, power, inventory, research, stats, crafting)
- [x] Core: Spieler-Interaktion (Kamera, Platzieren/Ziehen, Abriss, Q, R, Handabbau, Werkzeuge)
- [x] Core: Game + Game-Loop (60 Ticks/s, Pause), F1-Debugpanel, `window.game`
- [x] Feature-Stubs + `src/main.ts`
- [x] Browser-Smoke-Test (Firefox headless): alle Abnahmepunkte aus dem Auftrag automatisiert geprüft
- [x] Doku: CLAUDE.md, README.md, docs/ARCHITECTURE.md, docs/GAME_DESIGN.md, docs/tasks/*.md, docs/TEAM.md
- [x] GitHub-Workflows (ci.yml, deploy.yml)
- [x] Abschlussprüfung: Build grün, keine TODOs im Core, Gegenprobe Parallelität

## Als Nächstes
- [ ] Push nach GitHub (nach Freigabe)
- [ ] GitHub Pages aktivieren: Settings → Pages → Source „GitHub Actions“
- [ ] Label `core-request` im Repo anlegen
- [ ] Danach nur noch Core-PRs auf Anfrage (`core/<thema>`)
