# Modul `factory`: Abbau, Transport, Verarbeitung, Rezepte, Energie

Ordner: `src/features/factory/` · Branch: `feature/factory` · ID-Präfix: `factory:`

## Ziel und Zuständigkeit
Alles, was Rohstoffe bewegt und verwandelt, plus die Energie dafür.

**Dazu gehört:**
- Abbaumaschinen (auf Erz-Kacheln), Förderbänder (inkl. Kurven/Seitenzufuhr), Greifarme, Öfen, Montagemaschinen, eigene Lager falls nötig
- **Alle Rezepte** (inkl. Handcrafting-Rezepte mit `madeIn: ['hand', …]`) für die zentralen Items
- Kraftwerke von Kohle bis Atom, Stromverbrauch der eigenen Maschinen (`game.power`)
- KI-Rechenzentrum (verbraucht Wasser in der Umgebung über `env.water`)
- Müll (`waste`, `nuclear_waste`) als Nebenprodukt, gratis abkippen (Verschmutzung) oder teuer entsorgen (Geld)
- Öko-Varianten (teuer, ineffizient, Tag `eco`), Seilbahn für weite Strecken
- **Verschmutzung erzeugen** an den eigenen Gebäuden (`env.add('pollution', …)`)

**Ausdrücklich NICHT:**
- Ausbreitung/Wirkung der Verschmutzung, Terrain-Änderungen, Monster, Mauern/Türme/Kraftfeld → environment
- Forschungskosten/-baum, Geld-Einnahmen, Demonstrationen, Kernschmelze, Sieg → progression
- HUD, Bauleiste, Inventar- und Crafting-Fenster → ui (factory registriert nur Gebäude/Rezepte, die ui zeigt sie an)

## Core-APIs, Events, Zustände
- Nutzt: `BaseBuilding` (`pushForward`, `pushTo`, `neighborBuilding`, `resourceUnder`, `active`), `registries.buildings/items/recipes`, `drawItem`, `renderer.addDrawHook('items', …)`, `game.onTick`, `game.world.getResource`, `Dir/dirVec/opposite`
- **Schreibt:** `env.pollution` (Gebäude mit Tag `pollutes`), `env.water` (Rechenzentrum), `env.radiation` (Atommüll abkippen), `power.produce/consume`, `inventory` (Kisten), `economy.spend` (Entsorgung)
- **Liest:** `research.isUnlocked` (indirekt über `requiresResearch`), `power.satisfaction`
- Events: hört ggf. auf `buildingRemoved` (Items zurückgeben), feuert `notify` (z. B. „Kraftwerk ohne Kohle“)

## Konventionen (Vertrag mit den anderen Modulen)
- **Tags setzen!** `pollutes` für alles, was verschmutzt (progression wählt darüber Demo-Ziele), `power_producer`/`power_consumer`, `reactor` (Atomkraftwerk), `datacenter`, `waste_disposal`, `eco`, `storage`.
- Verschmutzung: pro Gebäude und Tick `game.env.add('pollution', b.x, b.y, rateProSekunde / 60)`. Richtwerte pro Sekunde: Ofen 0,5 · Kohlekraftwerk 3 · Abkippen von 1 Müll 2 · Öko-Variante 0,1.
- Rechenzentrum: pro Sekunde `env.add('water', …, -0.02)` auf Kacheln im Radius 6.
- Strom in kW. Verbraucher rechnen mit dem Rückgabewert von `power.consume(kw)` (0..1) als Geschwindigkeitsfaktor.
- M1-Gebäude **ohne** `requiresResearch`, damit sie ohne progression baubar sind. Später: Montagemaschine `automation`, Stahl `steel`, Schaltkreis `electronics`, Kohlekraftwerk `power_coal`, Atom `nuclear`, Rechenzentrum `ai_datacenter`, Entsorgung `waste_management`, Öko `eco_tech`, Seilbahn `ropeway`, Raketenteil-Rezept `rocket`.
- Gebäude in sinnvoller Reihenfolge registrieren (Bauleiste zeigt Registrierungs-Reihenfolge): Band, Abbaumaschine, Ofen, Greifarm, Montagemaschine, …
- `info()` an jedem Gebäude implementieren (Rezept, Fortschritt, Inhalt), damit die ui es anzeigen kann.

## Meilensteine

### M1 – spielbare Kette (1–2 Sessions)
- [x] Ordnerstruktur (`buildings/`, `recipes.ts`, `index.ts`) und `register(game)`
- [x] Grundrezepte registriert: Eisen-/Kupferplatte (Ofen), Zahnrad, Stein→Beton-Vorstufe o. Ä.; Handcrafting-Rezepte für die M1-Gebäude-Materialien (`madeIn: ['hand', …]`)
- [x] `factory:belt`: nimmt Items von hinten und den Seiten an, transportiert sie sichtbar (Hook auf Ebene `items`), gibt sie vorne per `pushForward` ab
- [x] `factory:miner` (Brennstoff oder vorerst ohne Energie): nur auf Erz baubar (`canPlace`), gibt das Erz unter sich nach vorne aus
- [x] `factory:furnace`: nimmt Erz (+ ggf. Kohle) an, schmilzt nach Rezept, gibt Platten vorne aus; Tag `pollutes`, verschmutzt
- [x] Kette Abbaumaschine → Band → Ofen → Band → `core:chest` funktioniert, Platten landen im Inventar
- [x] `info()` für alle M1-Gebäude
- [x] `npm run build` grün, Commit, Bericht

### M2 – Automatisierung & Strom
- [ ] Greifarm (`factory:inserter`) zwischen Maschinen/Kisten
- [ ] Montagemaschine mit wählbarem Rezept (z. B. per `buildingClicked` + einfachem Auswahl-Dialog im eigenen Ordner oder Rezept über `actions`)
- [ ] Kohlekraftwerk (`power_producer`, `pollutes`), elektrische Abbaumaschine/Montagemaschine (`power_consumer`)
- [ ] Stahl, Schaltkreis, Beton – Rezepte und Ketten
- [ ] Müll als Nebenprodukt; Müllkippe (gratis, verschmutzt) und Entsorgungsanlage (kostet Geld, `waste_disposal`)

### M3 – Endgame
- [ ] Atomkraftwerk (`reactor`, Uran-Brennstab, Atommüll), Uranverarbeitung
- [ ] KI-Rechenzentrum (`datacenter`, Wasserverbrauch) + KI-Automatisierung (z. B. Maschinen schneller, wenn `ai_automation` erforscht)
- [ ] Öko-Varianten (Ofen, Kraftwerk) mit Tag `eco`
- [ ] Seilbahn (zwei Stationen, Transport über Distanz)
- [ ] Raketenteil-Rezept (`rocket`)
- [ ] Balancing: Verschmutzungsraten, Strom, Rezeptzeiten

## Allein testen
1. `npm run dev`, F1 öffnen → „+100 jedes Item“.
2. Im Debugpanel unter „Gebäude bauen“ deine Gebäude wählen, platzieren, mit R drehen.
3. Ohne Abbaumaschine: `debug:source` (Item im Panel wählen, z. B. Eisenerz) → Band → Ofen → Band → `core:chest`. Inventar im Panel-Status beobachten.
4. Verschmutzung prüfen: „Feld anzeigen“ mit Feld `pollution` → Flecken an Öfen.
5. Konsole: `game.world.buildingsWithTag('pollutes')`, `game.power`.

## Schnittstellen zu anderen Modulen
- **environment** liest `env.pollution/water/radiation`, die factory schreibt, verteilt sie und lässt davon Pflanzen sterben und Monster spawnen. Monster greifen factory-Gebäude über `damageBuilding` an.
- **progression** findet Gebäude über Tags (`pollutes` für Demonstrationen, `reactor` für die Kernschmelze), setzt Forschungskosten für die IDs, die factory in `requiresResearch` verwendet, und zählt `rocket_part` im Inventar.
- **ui** zeigt alle nicht-`hidden` Gebäude in der Bauleiste, Handcrafting-Rezepte (`madeIn` enthält `'hand'`) im Crafting-Menü und `info()` im Tooltip.

## Start-Prompt (1:1 in Claude Code einfügen)
```
Lies zuerst CLAUDE.md und docs/tasks/factory.md.
Arbeite nur auf Branch feature/factory und nur im Ordner src/features/factory/.
(Lege den Branch an, falls er fehlt: git checkout -b feature/factory origin/main – vorher git fetch.)
Du darfst zusätzlich nur docs/tasks/factory.md (Checkliste abhaken) und die Tastentabelle in CLAUDE.md ändern.
Beginne mit M1. Commit nach jedem Teilschritt. Wenn M1 fertig ist und `npm run build` läuft: frag mich, ob du pushen und mit `gh pr create` einen PR öffnen sollst. Dann STOPP und berichte.
Brauchst du eine Core-Änderung: gib einen fertigen Issue-Text mit Label core-request aus und arbeite mit einem Workaround im eigenen Ordner weiter.
Wirst du neu gestartet, lies `git log` und die Checkliste in docs/tasks/factory.md und mach dort weiter.
```
