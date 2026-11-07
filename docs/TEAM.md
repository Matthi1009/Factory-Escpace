# Team

| Modul | Branch | Account/Person | Task-Datei |
|---|---|---|---|
| core (Grundgerüst, Core-PRs) | `main`, `core/<thema>` | Matthi1009 (hat das Grundgerüst gebaut) | docs/BUILD_STATUS.md |
| factory | `feature/factory` | Julix2009 | [tasks/factory.md](tasks/factory.md) |
| environment | `feature/environment` | offen | [tasks/environment.md](tasks/environment.md) |
| progression | `feature/progression` | Matthi1009 | [tasks/progression.md](tasks/progression.md) |
| ui | `feature/ui` | Julix2009 | [tasks/ui.md](tasks/ui.md) |

Jeder Account arbeitet mit einer eigenen Claude-Code-Instanz an genau einem Modul. Schritt-für-Schritt-Einstieg: [ANLEITUNG.md](ANLEITUNG.md).

## Empfohlene Merge-Reihenfolge

1. **Core-PRs (`core/<thema>`) sofort**, sobald sie da sind – alle anderen ziehen sie per `git pull origin main` nach.
2. **factory** zuerst: liefert Gebäude, Rezepte und Verschmutzung. Danach hat das Spiel echten Inhalt, an dem die anderen testen können.
3. **environment**: braucht nichts von den anderen, profitiert aber von echter Verschmutzung aus factory.
4. **progression**: setzt Forschungskosten für die IDs, die factory verwendet; Demos brauchen Gebäude mit Tag `pollutes`.
5. **ui** zuletzt pro Runde: zeigt alles an, was die anderen registriert haben – so sieht man beim Review sofort, ob die Anzeige generisch funktioniert.

Da jedes Modul nur im eigenen Ordner arbeitet, gibt es kaum Konflikte. Mögliche Konfliktstellen: die Tastentabelle in `CLAUDE.md` (beide Zeilen behalten) und `package-lock.json` (Version von main nehmen, dann `npm install`).
Nach jedem Merge in `main`: alle anderen Branches mergen `main` (`git pull origin main`) und prüfen `npm run build`.

## Runde 2

Details und Regeln: [ROUND2.md](ROUND2.md). Jedes Paket hat **einen** Account und **eine** Claude-Code-Instanz; jede Person trägt ihren Account in **ihrer** Zeile ein (Einzeiler, bei Konflikt beide Zeilen behalten).

| Paket | Branch | Account | Aufgabendatei |
|---|---|---|---|
| ui-menu-map | `r2/ui-menu-map` | offen | [tasks/r2-ui-menu-map.md](tasks/r2-ui-menu-map.md) |
| player-defense | `r2/player-defense` | offen | [tasks/r2-player-defense.md](tasks/r2-player-defense.md) |
| art-world | `r2/art-world` | offen | [tasks/r2-art-world.md](tasks/r2-art-world.md) |
| art-factory | `r2/art-factory` | offen | [tasks/r2-art-factory.md](tasks/r2-art-factory.md) |

**Merge-Reihenfolge der M0-PRs (Empfehlung; jeder M0 ist unabhängig lauffähig):** art-world M0a → art-world M0b → art-factory M0 → player-defense M0 → ui-menu-map M0. Danach M1–M3 in beliebiger Reihenfolge, ein PR pro Meilenstein. Abhängigkeiten: art-factory M1 wartet auf art-world M0a, player-defense M2 wartet auf art-world M0b.

