# Team

| Modul | Branch | Account/Person | Task-Datei |
|---|---|---|---|
| core (Grundgerüst, Core-PRs) | `main`, `core/<thema>` | Matthi1009 (hat das Grundgerüst gebaut) | docs/BUILD_STATUS.md |
| factory | `feature/factory` | offen | [tasks/factory.md](tasks/factory.md) |
| environment | `feature/environment` | offen | [tasks/environment.md](tasks/environment.md) |
| progression | `feature/progression` | offen | [tasks/progression.md](tasks/progression.md) |
| ui | `feature/ui` | offen | [tasks/ui.md](tasks/ui.md) |

Jeder Account arbeitet mit einer eigenen Claude-Code-Instanz an genau einem Modul. Start: den Start-Prompt am Ende der jeweiligen Task-Datei einfügen.

## Empfohlene Merge-Reihenfolge

1. **Core-PRs (`core/<thema>`) sofort**, sobald sie da sind – alle anderen ziehen sie per `git pull origin main` nach.
2. **factory** zuerst: liefert Gebäude, Rezepte und Verschmutzung. Danach hat das Spiel echten Inhalt, an dem die anderen testen können.
3. **environment**: braucht nichts von den anderen, profitiert aber von echter Verschmutzung aus factory.
4. **progression**: setzt Forschungskosten für die IDs, die factory verwendet; Demos brauchen Gebäude mit Tag `pollutes`.
5. **ui** zuletzt pro Runde: zeigt alles an, was die anderen registriert haben – so sieht man beim Review sofort, ob die Anzeige generisch funktioniert.

Da jedes Modul nur im eigenen Ordner arbeitet, gibt es kaum Konflikte. Mögliche Konfliktstellen: die Tastentabelle in `CLAUDE.md` (beide Zeilen behalten) und `package-lock.json` (Version von main nehmen, dann `npm install`).
Nach jedem Merge in `main`: alle anderen Branches mergen `main` (`git pull origin main`) und prüfen `npm run build`.
