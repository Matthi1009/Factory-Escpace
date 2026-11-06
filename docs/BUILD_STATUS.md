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

## Als Nächstes
- [ ] Doku: CLAUDE.md, docs/ARCHITECTURE.md, docs/GAME_DESIGN.md, docs/tasks/*.md, docs/TEAM.md
- [ ] GitHub-Workflows (ci.yml, deploy.yml)
- [ ] Abschlussprüfung (Gegenprobe Parallelität, keine TODOs im Core, Browser-Test)
