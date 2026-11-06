# Anleitung für das Team: So arbeitest du mit Claude Code an Factory Escape

Wir sind 4 Leute mit 4 Claude-Pro-Abos. Jeder übernimmt **ein Modul** und lässt es von seiner eigenen Claude-Code-Instanz bauen:

| Modul | Was es macht | Task-Datei |
|---|---|---|
| **factory** | Abbaumaschinen, Förderbänder, Öfen, Rezepte, Kraftwerke, Müll | [tasks/factory.md](tasks/factory.md) |
| **environment** | Verschmutzung, Umwelt, Monster, Mauern, Türme, Kraftfeld | [tasks/environment.md](tasks/environment.md) |
| **progression** | Forschung, Geld, SDG-Satire, Demonstrationen, Börse, Sieg | [tasks/progression.md](tasks/progression.md) |
| **ui** | HUD, Bauleiste, Inventar, Menüs, Forschungsfenster | [tasks/ui.md](tasks/ui.md) |

Wer welches Modul macht, steht in [TEAM.md](TEAM.md). Matthi trägt euch dort ein, bitte sprecht euch vorher ab.

Die Claude-Instanzen wissen nichts voneinander. Sie halten sich alle an dieselben Regeln aus `CLAUDE.md` (liest Claude automatisch) und arbeiten **nur im eigenen Ordner** `src/features/<modul>/`. Deshalb können alle gleichzeitig arbeiten, ohne sich in die Quere zu kommen.

---

## 1. Einmalig: Installieren

Du brauchst: **Git**, **Node.js ≥ 22.12**, die **GitHub CLI (`gh`)** und **Claude Code**.

**Windows** (PowerShell):
```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
winget install GitHub.cli
irm https://claude.ai/install.ps1 | iex
```
**macOS:** `brew install git node gh`, dann `curl -fsSL https://claude.ai/install.sh | bash`
**Linux:** Git, Node und gh über den Paketmanager installieren, dann `curl -fsSL https://claude.ai/install.sh | bash`

Danach das Terminal neu öffnen und prüfen:
```
git --version
node --version     # muss v22.12 oder höher sein
gh --version
claude --version
```

## 2. Einmalig: Zugang zum Repo

1. Du brauchst einen **GitHub-Account**. Schick Matthi deinen Benutzernamen.
2. Matthi lädt dich als Collaborator ein. Du bekommst eine E-Mail bzw. siehst es auf https://github.com/notifications → **Einladung annehmen**. Ohne Einladung kannst du nicht pushen.
3. GitHub CLI anmelden (öffnet den Browser):
   ```
   gh auth login
   ```
   Auswahl: `GitHub.com` → `HTTPS` → `Yes` (Git mit GitHub-Zugangsdaten anmelden) → `Login with a web browser`.
4. Deinen Namen für Commits setzen (falls noch nie gemacht):
   ```
   git config --global user.name "Dein Name"
   git config --global user.email "deine@email.at"
   ```

## 3. Einmalig: Projekt holen und testen

```
git clone https://github.com/Matthi1009/Factory-Escpace.git
cd Factory-Escpace
npm install
npm run dev
```
Öffne http://localhost:5173. Du solltest eine grüne Karte mit Erzfeldern und dem Raumschiff-Wrack in der Mitte sehen.
Probier kurz: **WASD** bewegt die Kamera, **Mausrad** zoomt, **F1** öffnet das Debugpanel, **Linksklick auf Erz** baut ab. Mit `Strg+C` im Terminal beendest du den Server.

## 4. Claude starten

Im Projektordner:
```
claude
```
Beim ersten Start meldest du dich mit **deinem eigenen Claude-Pro-Account** an (`/login`, falls Claude nicht von selbst fragt).

Dann öffnest du die Task-Datei deines Moduls (z. B. `docs/tasks/factory.md`), kopierst den **Start-Prompt ganz unten** (der Block nach „Start-Prompt“) und fügst ihn **1:1** in Claude ein.

Ab dann passiert Folgendes von selbst:
- Claude legt deinen Branch `feature/<modul>` an.
- Claude baut **Meilenstein M1** und committet nach jedem Teilschritt.
- Claude hakt erledigte Punkte in deiner Task-Datei ab.
- Ist M1 fertig, **fragt Claude dich**, ob es pushen und einen Pull Request öffnen soll. Dann hört es auf und berichtet.

Wenn Claude um Erlaubnis für einen Befehl fragt (z. B. `npm run build`, `git commit`), kannst du das normalerweise erlauben. **Aufpassen** solltest du bei: Löschen von Dateien, `git push --force`, Änderungen außerhalb deines Ordners. Das soll Claude laut Regeln sowieso nicht tun.

## 5. Testen, was Claude gebaut hat

Lass in einem **zweiten Terminal** `npm run dev` laufen und lade den Browser neu. Jedes Modul kann man allein testen:
- **F1-Debugpanel:** alle Gebäude zum Auswählen, „+100 jedes Item“, „+10.000 Geld“, „Alles erforschen“, Umwelt-Pinsel (Verschmutzung malen).
- **Debug-Quelle** (`debug:source`): spuckt ein wählbares Item aus, z. B. zum Testen von Förderbändern.
- **Browser-Konsole** (F12): `game` ist dort verfügbar, z. B. `game.inventory.entries()`.

Was in deinem Modul genau zu testen ist, steht im Abschnitt „Allein testen“ deiner Task-Datei. Wenn dir etwas nicht gefällt, sag es Claude einfach in normalen Worten („Die Förderbänder sind zu langsam“, „Das Inventar soll unten rechts sein“).

## 6. Meilenstein fertig → Pull Request

1. Claude fragt: „Soll ich pushen und einen PR öffnen?“ → **Ja**.
2. Claude gibt dir den Link zum Pull Request. Auf GitHub läuft automatisch die **CI** (baut das Projekt). Sie muss grün ✅ sein.
3. Sag im Team Bescheid. Jemand schaut kurz drüber und klickt **„Merge pull request“**.
4. Danach in Claude weitermachen: „Mach mit M2 weiter.“

Nach jedem Merge in `main` wird das Spiel automatisch auf GitHub Pages veröffentlicht (sobald Matthi Pages aktiviert hat). Dort sieht man den gemeinsamen Stand.

## 7. Jeden Tag: Stand der anderen holen

Bevor du loslegst, sag Claude:
```
Hol dir den aktuellen Stand von main (git pull origin main), merge ihn in meinen Branch und prüfe, ob npm run build noch läuft.
```
So siehst du die Arbeit der anderen in deinem Spiel, und Konflikte bleiben klein.

## 8. Wenn die Session abbricht (Limit erreicht)

Pro-Abos haben ein Nutzungslimit. Wenn Claude mittendrin aufhört:
1. Warten, bis das Limit zurückgesetzt ist (Claude zeigt die Uhrzeit an).
2. `claude` neu starten und **denselben Start-Prompt** nochmal einfügen.
3. Claude liest `git log` und die abgehakte Checkliste und macht dort weiter, wo es war. Es geht nichts verloren, weil nach jedem Teilschritt committet wird.

Tipp: Sag Claude ab und zu „Commit jetzt bitte den aktuellen Stand“, bevor du aufhörst.

## 9. Wenn Claude eine Änderung am Core braucht

Den Ordner `src/core/` darf **nur Matthi** ändern. Wenn deine Claude-Instanz etwas aus dem Core braucht, gibt sie dir einen **fertigen Issue-Text** aus und arbeitet mit einem Workaround weiter. Du:
1. Gehst auf https://github.com/Matthi1009/Factory-Escpace/issues → **New issue**.
2. Kopierst Titel und Text hinein und setzt das Label **`core-request`**.
3. Schreibst Matthi Bescheid. Er setzt es um und merged es in `main`.
4. Danach holst du dir `main` (Schritt 7) und sagst Claude: „Der Core-Request #<Nummer> ist jetzt in main, bau den Workaround zurück.“

## 10. Die wichtigsten Regeln (Claude kennt sie, aber du solltest sie auch kennen)

- ✅ Nur im eigenen Ordner `src/features/<modul>/` arbeiten.
- ❌ Nie `src/core/`, `src/main.ts`, `package.json` oder fremde Modul-Ordner ändern.
- ❌ Nie direkt auf `main` arbeiten oder pushen, immer über den eigenen Branch und einen Pull Request.
- ❌ Kein `git push --force`.
- ✅ Vor jedem Commit muss `npm run build` fehlerfrei laufen (das prüft auch, dass niemand aus fremden Ordnern importiert).
- ✅ Neue IDs immer mit Präfix, z. B. `factory:belt`.

## 11. Probleme?

| Problem | Lösung |
|---|---|
| `Permission denied` / `403` beim Push | Einladung zum Repo angenommen? `gh auth login` nochmal ausführen. |
| `npm run dev` startet nicht | `node --version` prüfen (≥ 22.12), dann `npm install`. |
| Merge-Konflikt | Claude sagen: „Löse den Merge-Konflikt.“ Bei `package-lock.json`: Version von main nehmen, dann `npm install`. Bei der Tastentabelle in `CLAUDE.md`: beide Zeilen behalten. |
| CI im Pull Request ist rot | Claude sagen: „Die CI im PR schlägt fehl, schau dir das mit `gh pr checks` an und behebe es.“ |
| Claude will etwas im Core ändern | Stoppen und sagen: „Nein, das ist Core. Schreib einen core-request.“ |
| Claude weiß nicht mehr, was es tun soll | Den Start-Prompt nochmal einfügen. |

Mehr Details: [CLAUDE.md](../CLAUDE.md) (Regeln und Tasten), [ARCHITECTURE.md](ARCHITECTURE.md) (Core-API), [GAME_DESIGN.md](GAME_DESIGN.md) (Spielidee).
