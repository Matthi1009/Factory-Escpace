# Factory Escape

2D-Fabrikspiel im Browser (TypeScript + Vite + Canvas 2D), entstanden an der HTL Leoben.
Dein Raumschiff ist abgestürzt: Baue Ressourcen ab, errichte Fabriken, baue Raketenteile und hau ab, bevor die mutierten Monster dein Wrack zerstören.
Eine Satire darüber, wie man **nicht** mit der Umwelt umgehen sollte: Je mehr du die SDGs verfehlst, desto reicher wirst du.

```
npm install
npm run dev      # http://localhost:5173 – F1 öffnet das Debugpanel
npm run build
```

- **[docs/ANLEITUNG.md](docs/ANLEITUNG.md): Einstieg fürs Team – hier anfangen!**
- [CLAUDE.md](CLAUDE.md): Regeln, Befehle, Tastenbelegung
- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md): Spielidee und Zuständigkeiten
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): Core-API mit Beispielen
- [docs/TEAM.md](docs/TEAM.md): Wer macht was, Merge-Reihenfolge
- [docs/tasks/](docs/tasks/): Aufgaben und Start-Prompts pro Modul

## Runde 2: Factorio-Look, Spielfigur, Verteidigung, Karte, Hauptmenü
Das Spiel bekommt eine Spielfigur mit Reichweite und Handwaffe, Türme, Mauern und Tore, Minikarte und große Karte (mit Verschmutzungs-Heatmap), ein Hauptmenü und einen ernsten, schmutzig-industriellen Look. Vier Claude-Instanzen arbeiten gleichzeitig; der gemeinsame Vertrag steht in **[docs/ROUND2.md](docs/ROUND2.md)**.

| Paket | Inhalt | Aufgabendatei |
|---|---|---|
| **ui-menu-map** | Spielzustand, Einstellungen, Hauptmenü, Pausemenü, Game Over/Sieg, Minikarte, große Karte, UI-Look | [docs/tasks/r2-ui-menu-map.md](docs/tasks/r2-ui-menu-map.md) |
| **player-defense** | Spielfigur, Reichweite, Handabbau, Waffe, Türme, Mauern, Tore, Reparatur, Monster-Verhalten | [docs/tasks/r2-player-defense.md](docs/tasks/r2-player-defense.md) |
| **art-world** | Grafik-Grundlage, Terrain, Erzfelder, Umweltzerstörung, Monster-Optik, Kraftfeld, Effekte | [docs/tasks/r2-art-world.md](docs/tasks/r2-art-world.md) |
| **art-factory** | alle Maschinen, Förderbänder, Item-Icons, Wrack, Rakete, Kernschmelze, Demonstrationen | [docs/tasks/r2-art-factory.md](docs/tasks/r2-art-factory.md) |

**Die 4 Startzeilen** (je eine in eine eigene Claude-Code-Instanz im geklonten Repo einfügen):
```
Lies docs/tasks/r2-ui-menu-map.md und führe den Start-Prompt am Ende der Datei aus.
Lies docs/tasks/r2-player-defense.md und führe den Start-Prompt am Ende der Datei aus.
Lies docs/tasks/r2-art-world.md und führe den Start-Prompt am Ende der Datei aus.
Lies docs/tasks/r2-art-factory.md und führe den Start-Prompt am Ende der Datei aus.
```

