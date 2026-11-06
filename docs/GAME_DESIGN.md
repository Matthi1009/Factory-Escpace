# Game Design: Factory Escape

> Satire mit Lerneffekt: Das Spiel zeigt, wie man **nicht** mit der Umwelt umgehen sollte.

## 1. Grundidee
- 2D-Fabrikspiel in Draufsicht, Bauen auf einem Raster (256 × 256 Kacheln). Bewusst 2D, damit das Projekt überschaubar bleibt.
- **Start:** Das Raumschiff stürzt auf einem fremden Planeten ab. Man hat nichts außer dem Wrack.
- **Ziel:** Raketenteile bauen und den Planeten verlassen.
- **Optionales Finale:** Kernschmelze im Atomreaktor, die die Region unbewohnbar macht.
- **Hardcore:** Wird das Raumschiff-Wrack (die Hauptbasis) zerstört, ist das Spiel vorbei.

## 2. Ressourcen und Produktion
- Ressourcen: **Eisen, Kupfer, Kohle, Stein, Granit, Uran**. Erzvorkommen sind **unendlich**.
- Anfangs von Hand abbauen (Linksklick auf Erz), dann Maschinen craften und immer größere Fabriken bauen.
- Kette: Abbaumaschine → Förderband → Ofen → Montagemaschine → Lager. Greifarme verbinden Maschinen, Seilbahnen überbrücken weite Strecken.
- Zwischenprodukte: Eisen-/Kupferplatte, Stahl, Zahnrad, Schaltkreis, Beton, Uran-Brennstab, Raketenteil.
- Energie: Kraftwerke von Kohle bis Atom. Ohne Strom laufen Maschinen langsamer oder gar nicht.

## 3. Umwelt (das „Problem“)
- Fabriken **verschmutzen** die Umwelt. Die Verschmutzung **breitet sich aus**.
- Die Umwelt wird **heißer, kälter, radioaktiv und trockener**.
- **Pflanzen sterben** (Terrain wird zu „abgestorben“, „Ödland“ …).
- **Tiere mutieren zu Monstern**, die die Basis angreifen – je mehr Verschmutzung, desto mehr und stärkere Monster.
- **KI-Rechenzentren** verbrauchen viel Wasser → die Gegend trocknet aus. Dafür schalten sie **KI-Automatisierung** frei.
- **Müll** kann man gratis in die Umwelt kippen (verursacht Verschmutzung) oder teuer entsorgen.
- **Umweltfreundliche Maschinen** (Öko-Varianten) gibt es, sie sind aber teuer und ineffizienter.

## 4. Wirtschaft (die Satire)
- **Je stärker man die SDGs (UN-Nachhaltigkeitsziele) verfehlt, desto mehr Geld bekommt man.**
- Geld finanziert Forschung, Entsorgung, PR-Kampagnen, Börsengeschäfte.
- Eine SDG-Wertung zeigt dem Spieler schonungslos, was er anrichtet.

## 5. Verteidigung
- **Mauern**, **Geschütztürme** und ein **Kraftfeld** (schützt, heizt aber die Region auf).
- Bekämpft werden **ausschließlich mutierte Monster**.

## 6. Events
- **Demonstrationen** (gewaltfrei): Demonstranten blockieren ein Gebäude für eine Zeit. Man kann sie mit Geld (**PR-Kampagne**) auflösen. Gegen Demonstranten gibt es keine Gewalt.
- **Börse**: Kurse schwanken, Rohstoffe/Produkte können verkauft werden.

## 7. Fortschritt
- **Forschung/Skilltree**: Automatisierung, Logistik, Stahl, Elektronik, Beton, Kohlekraft, Müllentsorgung, Öko-Technik, Kernkraft, KI-Rechenzentrum, KI-Automatisierung, Mauern, Geschütztürme, Kraftfeld, Seilbahn, Raketenbau.
- Forschung kostet Items (und ggf. Geld) und hat Voraussetzungen.

## 8. Spielende
| Ende | Auslöser |
|---|---|
| **Sieg** | Genug Raketenteile gebaut → Rakete startet |
| **Satire-Finale** | Kernschmelze → Region unbewohnbar (Spieler entkommt trotzdem oder nicht – Entscheidung progression) |
| **Niederlage** | Raumschiff-Wrack zerstört (Core löst `gameOver` aus) |

## 9. Wem gehört welche Mechanik?

| Mechanik | Modul | Gemeinsame Schnittstelle (Core) |
|---|---|---|
| Welt, Erzfelder, Kamera, Bauen/Abriss, Handabbau, Wrack, Game-Over bei Wrack-Zerstörung | **core** | – |
| Abbaumaschinen, Förderbänder, Greifarme, Öfen, Montagemaschinen | factory | `BaseBuilding`, `acceptItem`, `registries.buildings` |
| Alle Rezepte inkl. Handcrafting | factory | `registries.recipes`, `game.handCraft` |
| Kraftwerke (Kohle … Atom), Stromverbrauch | factory | `game.power`, Tags `power_producer`/`power_consumer`/`reactor` |
| KI-Rechenzentrum (Wasserverbrauch) | factory | `env.water`, Tag `datacenter`, Forschung `ai_datacenter`/`ai_automation` |
| Müll erzeugen, gratis abkippen / teuer entsorgen | factory | Item `waste`, `env.pollution`, `economy.spend`, Tag `waste_disposal` |
| Öko-Varianten, Seilbahn | factory | Tag `eco`, Forschung `eco_tech`/`ropeway` |
| Verschmutzung **erzeugen** | factory | `env.add('pollution', …)`, Tag `pollutes` |
| Verschmutzung **ausbreiten**, Hitze, Kälte, Strahlung, Austrocknung | environment | `env.*` (Float32Arrays) |
| Terrain-Optik, sterbende Pflanzen | environment | `world.setTerrain`, `renderer.invalidateGround/setGroundPainter` |
| Monster-Mutation, Spawns nach Verschmutzung, Wegfindung, Angriffe | environment | `damageBuilding`, `game.wreck`, Ebene `entities` |
| Mauern, Geschütztürme, Kraftfeld | environment | `BaseBuilding`, Tag `defense`, `env.temperature` |
| Forschungsbaum (Kosten, Abhängigkeiten, Ablauf) | progression | `registries.research.update`, `research.setRequestHandler/unlock` |
| Geld + SDG-Satire-Wertung | progression | `economy`, `stats`, `env.total` |
| Demonstrationen + PR-Kampagne | progression | `blockBuilding/unblockBuilding`, `buildingClicked`, `registries.actions` |
| Börse | progression | `economy`, `inventory`, `registries.actions`, `stats` |
| Raketen-Ziel, Kernschmelze-Finale, Sieg | progression | `inventory.count('rocket_part')`, Tag `reactor`, `endGame` |
| HUD, Bauleiste, Inventar, Crafting-Menü | ui | `registries.*`, `inventory`, `interaction.select`, `handCraft` |
| Umwelt- und SDG-Anzeige, Forschungsfenster | ui | `env.total/average`, `stats.all()`, `research.request` |
| Meldungen, Game-Over-Screen, Menüs | ui | Events `notify`, `gameOver`, `game.uiRoot` |
