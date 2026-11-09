# Modul `progression`: Forschung, Geld, Events, Ziele

Ordner: `src/features/progression/` · Branch: `feature/progression` · ID-Präfix: `progression:`

## Ziel und Zuständigkeit
Die Regeln, die das Spiel vorantreiben: was man erforschen kann, wofür es Geld gibt, welche Events passieren und wie das Spiel endet.

**Dazu gehört:**
- Forschungsbaum: Kosten (Items, optional Geld/Zeit) und Abhängigkeiten für **alle zentralen Forschungs-IDs** (`src/core/content/research.ts`), Ablauf (starten, Fortschritt, freischalten)
- Geld und **SDG-Satire-Wertung**: je mehr Verschmutzung/Umweltzerstörung, desto mehr Geld
- Demonstrations-Events (gewaltfrei): blockieren ein verschmutzendes Gebäude, Auflösen per PR-Kampagne (Geld)
- Börse (Kurse, Verkaufen von Items gegen Geld)
- Raketen-Ziel (Sieg), Kernschmelze-Finale, Game Over/Sieg auslösen (`game.endGame`)

**Ausdrücklich NICHT:**
- Fenster/HUD für Forschung, SDG, Börse (→ ui; progression liefert Daten über `research`, `stats`, `actions`)
- Rezepte, Gebäude, Reaktor selbst (→ factory), Verbreitung der Strahlung (→ environment)
- Gewalt gegen Demonstranten – gibt es nicht

## Core-APIs, Events, Zustände
- Nutzt: `registries.research.update/all`, `research.setRequestHandler/unlock/current/progress`, `registries.actions.register`, `stats.define/set`, `game.onTick`, `world.buildingsWithTag`, `blockBuilding/unblockBuilding`, `destroyBuilding`, `endGame`, `renderer.addDrawHook('entities', …)` (Demonstranten), `interaction.setTool` (optional: Ziel wählen)
- **Schreibt:** `economy` (Einnahmen/Ausgaben), `research` (unlock, current, progress), `inventory` (Forschungskosten abziehen, Börse), `stats` (SDG-Werte), Blockaden, bei Kernschmelze `env.radiation`
- **Liest:** `env.total/average` (Verschmutzung, Temperatur, Wasser, Strahlung), `inventory.count('rocket_part')`, Gebäude mit Tags `pollutes`/`reactor`/`eco`/`datacenter`
- Events: `researchUnlocked` (Meldung), `buildingClicked` (Demo auflösen), `buildingDestroyed`; feuert `notify`, löst `gameOver` über `endGame` aus

## Konventionen (Vertrag mit den anderen Modulen)
- `game.research.setRequestHandler(id => …)` setzen: prüft Voraussetzungen (`requires`), zieht Kosten ab (`inventory.removeAll`, `economy.spend`), startet die Forschung. ui ruft nur `game.research.request(id)` auf und liest `research.current/progress`.
- Forschung in Abhängigkeit vom Baum; Wurzeln (ohne `requires`): `automation`, `defense_walls`. Vorschlag: `automation → logistics, steel, power_coal`; `steel → concrete, electronics`; `electronics → ai_datacenter → ai_automation`; `power_coal → waste_management, eco_tech, nuclear`; `defense_walls → turrets → force_field`; `logistics → ropeway`; `nuclear + electronics → rocket`.
- SDG-Kennzahlen über `stats` mit `group: 'sdg'`, z. B. `progression:sdg_13` (Klima), `progression:sdg_6` (Wasser), `progression:sdg_15` (Leben an Land), `progression:sdg_total` (0–100 %, „wie stark verfehlt“).
- Spielerknöpfe als `ActionDef` mit Präfix `progression:` (z. B. `progression:pr_campaign`, `progression:sell_iron_plate`); ui und Debugpanel zeigen sie automatisch.
- Sieg: z. B. 10 × `rocket_part` im Inventar → `game.endGame(true, 'Die Rakete hebt ab …')`.
- Kernschmelze: Reaktor (`buildingsWithTag('reactor')`) zerstören (`destroyBuilding`), viel `radiation` im Umkreis, danach Satire-Ende über `endGame`.

## Meilensteine

### M1 – Forschung kostet Items, Geld steigt mit Verschmutzung (1–2 Sessions)
- [x] Ordnerstruktur (`research.ts`, `economy.ts`, `index.ts`)
- [x] Kosten + Abhängigkeiten für alle zentralen Forschungs-IDs per `registries.research.update`
- [x] `setRequestHandler`: Voraussetzungen prüfen, Items abziehen, Forschung läuft (`current`, `progress`) und wird freigeschaltet (`unlock`), `notify` bei Abschluss
- [x] Geld-Einnahmen pro Sekunde abhängig von `env.total('pollution')` (Satire), `moneyChanged` kommt vom Core
- [x] Erste SDG-Kennzahl in `stats`
- [x] Für Tests ohne ui: je Forschung eine Aktion `progression:research_<id>` ODER Test über Konsole dokumentieren → erledigt: nur im Dev-Modus, Kategorie `debug`, plus `progression:debug_status`
- [x] `npm run build` grün, Commit, Bericht

Notizen M1: Baum in `research.ts` (`RESEARCH_TREE`), Balancing-Konstanten in `economy.ts` (`BASE_INCOME`, `POLLUTION_INCOME`, `SDG_SCALE`). Kennzahlen: `progression:sdg_total` (%), `progression:income` (€/s). Es läuft immer nur eine Forschung gleichzeitig.

### M2 – Events & Börse
- [x] Demonstrationen: zufällig ein Gebäude mit Tag `pollutes` blockieren (`blockBuilding`), Demonstranten zeichnen (Ebene `entities`), `notify`
- [x] PR-Kampagne: Aktion und/oder Klick auf blockiertes Gebäude (`buildingClicked`) → `economy.spend` + `unblockBuilding`
- [x] Vollständige SDG-Wertung (mehrere Ziele, Gesamtwert), Geld-Multiplikator davon abhängig
- [x] Börse: schwankende Kurse (`stats`), Verkaufs-Aktionen
- [x] Müll-Entsorgung kostet Geld / Bonus für Abkippen (mit factory abstimmen über Items, nicht über Code) → Entsorgung kassiert factory selbst; Abkippen erhöht Verschmutzung → mehr Einnahmen und höherer Multiplikator

### M3 – Ziele & Enden
- [x] Raketen-Ziel: Fortschritt als `stats` (`progression:rocket_parts`), Sieg per `endGame(true, …)`
- [x] Kernschmelze-Finale (Auslöser z. B. Reaktor ohne Kühlwasser oder Aktion „Sicherheitssysteme abschalten“)
- [x] Balancing des Forschungsbaums und der Einnahmen

Notizen M2/M3: Alle Werte in `config.ts` (`PROGRESSION_CONFIG`). SDG-Ziele (`sdg.ts`): 3 Gesundheit (Strahlung), 6 Wasser (verlorene Bodenfeuchte), 7 Energie (Anteil Nicht-Öko-Kraftwerke), 13 Klima (Verschmutzung + Temperatur), 15 Leben an Land (Smog-Kacheln); Einnahmen × (1 + SDG %/50). Demonstrationen (`demonstrations.ts`) alle 30 s gewürfelt ab 20 % Verfehlung, max. 3, 90 s Blockade; PR-Kampagne über das Aktionen-Menü (K); Klick aufs Gebäude zeigt nur einen Hinweis (Issue #15). Seit Issue #13: Einnahmen 0,004 €/s je Verschmutzung, Betriebskosten je Tag (`upkeepByTag`), jede Forschung kostet Geld, PR-Kampagne ≥ 60 s Einnahmen; Kennzahlen `progression:upkeep`, `progression:net_income`. Börse (`market.ts`): Kurse als `progression:price_<item>` (Gruppe „Börse“), Verkaufen per Aktion. Rakete (`rocket.ts`): 10 Raketenteile → Aktion „Rakete starten“ → 10 s Countdown → Sieg. Kernschmelze (`meltdown.ts`): Risiko steigt bei > 45 °C oder Bodenfeuchte < 0,15 am Reaktor oder mit „Sicherheitssysteme abschalten“ (+5.000 €); bei 100 % Explosion, Strahlung, verseuchtes Land, nach 8 s Spielende. Dev-Aktionen: „Demonstration starten“, „Kernschmelze auslösen“.

## Allein testen
1. `npm run dev`, F1 → „+100 jedes Item“, dann in der Konsole `game.research.request('automation')` (oder deine Test-Aktion im Debugpanel unter „Aktionen“).
2. `game.research.current`, `game.research.progress`, `game.research.unlockedIds()` prüfen; Meldungen stehen im Debugpanel.
3. Geld: Umwelt-Pinsel (Feld `pollution`) → Geld im Debugpanel-Status steigt schneller.
4. Demonstrationen ohne factory: Test-Gebäude im eigenen Ordner mit Tag `pollutes` registrieren oder `core:chest` per `game.world.buildingsOfType('core:chest')` als Ziel verwenden.
5. Sieg testen: `game.inventory.add('rocket_part', 10)`.

## Schnittstellen zu anderen Modulen
- **factory** setzt `requiresResearch` mit den zentralen IDs → progression bestimmt, wann sie frei werden. factory taggt Gebäude (`pollutes`, `reactor`), progression findet sie darüber.
- **environment** liefert die Umweltwerte (`env.*`) für Geld und SDG-Wertung; bei der Kernschmelze verteilt environment die von progression gesetzte Strahlung.
- **ui** ruft `research.request(id)` auf, zeigt `research.current/progress`, alle `stats` (Gruppe `sdg`) und alle `actions` an und reagiert auf `gameOver`.

## Start-Prompt (1:1 in Claude Code einfügen)
```
Lies zuerst CLAUDE.md und docs/tasks/progression.md.
Arbeite nur auf Branch feature/progression und nur im Ordner src/features/progression/.
(Lege den Branch an, falls er fehlt: git fetch && git checkout -b feature/progression origin/main.)
Du darfst zusätzlich nur docs/tasks/progression.md (Checkliste abhaken) und die Tastentabelle in CLAUDE.md ändern.
Beginne mit M1. Commit nach jedem Teilschritt. Wenn M1 fertig ist und `npm run build` läuft: frag mich, ob du pushen und mit `gh pr create` einen PR öffnen sollst. Dann STOPP und berichte.
Brauchst du eine Core-Änderung: gib einen fertigen Issue-Text mit Label core-request aus und arbeite mit einem Workaround im eigenen Ordner weiter.
Wirst du neu gestartet, lies `git log` und die Checkliste in docs/tasks/progression.md und mach dort weiter.
```
