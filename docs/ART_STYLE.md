# Art-Style: Industrie-Look

Ein sauberer, moderner Industrie-Stil in der Draufsicht: wuchtige Metallmaschinen, Industrieorange, Warnstreifen, Rohre, Lüfter,
Lichter und Dampf. Alle Designs sind **eigene Entwürfe**; es werden keine Grafiken, Logos oder Namen aus anderen Spielen übernommen.
Es gibt keine Spielfigur: Der Spieler ist die Kamera, die Hauptbasis ist das abgestürzte Raumschiff-Wrack.

Die Konstanten stehen in `src/core/art/palette.ts`, die Zeichen-Helfer in `src/core/art/`. **Nur Optik** wird hier geändert:
Spiellogik, `tick()`, Werte, Rezepte und IDs bleiben unberührt. Die Zeichenfunktionen jedes Moduls liegen in `src/features/<modul>/art/`;
die `draw()`-Methoden der Gebäude rufen nur diese Funktionen auf.

## Palette

| Name | Wert | Verwendung |
|---|---|---|
| Industrieorange | `#F28C28` | Hauptakzent: Gehäuse, Rahmen, Hauptelemente |
| Stahl dunkel / mittel / hell | `#2B3036` / `#5A6470` / `#A9B2BA` | Rahmen, Böden, Rohre, Platten |
| Warngelb | `#F2C230` mit Schwarz | Warnstreifen an Gefahrenstellen und Kanten |
| Strom-Cyan | `#3FC1D0` | Strom, Bildschirme, KI |
| Glut | `#FF6A1A` → `#FFD27A` | Öfen, Hitze |
| Öko-Grün | `#6BBF59` | umweltfreundliche Varianten |
| Strahlung | `#9CFF3A` | Uran, Atommüll, Reaktor |
| Monster | `#7A3FA0` (Violett), `#B4E33D` (Giftgrün) | Mutanten, Leuchtmerkmale |

## Licht und Tiefe

- Das Licht kommt **immer von oben links** (Bildschirmraum), egal wie ein Gebäude gedreht ist.
- Jedes Gebäude hat einen weichen **Schatten nach unten rechts**, eine **helle Oberkante** (oben/links) und eine **dunkle Unterkante** (unten/rechts).
- Technisch: `draw()` bekommt einen mit der Gebäuderichtung gedrehten Canvas. Die statischen Teile werden deshalb im **entdrehten** Raum
  gezeichnet (`drawBuildingSprite`), nur richtungsabhängige Teile (Anschlüsse, Pfeile) werden mit `withDir` gedreht.

## Formsprache

- Abgerundete Metallplatten mit Nieten/Schrauben und sichtbaren Fugen
- Lüftergitter, Rohranschlüsse an Ein- und Ausgängen
- Warnstreifen an Gefahrenstellen, kleine Status-LEDs
- **Richtung immer erkennbar:** Ausgang = Rohrstutzen mit Warnstreifen-Lippe und Pfeil; Eingang = Trichter/Flansch
- Jedes Gebäude ist auch ohne Beschriftung eindeutig erkennbar (eigene Silhouette und Leitmotiv)

## Status-Sprache (für alle Maschinen gleich)

| LED | Bedeutung |
|---|---|
| grün | läuft |
| gelb | wartet auf Input oder Output ist voll |
| rot | kein Strom oder blockiert (z. B. Demonstration) |
| grau | aus / unbenutzt |

## Leitmotive der Maschinen

| Gebäude | Erkennungsmerkmal |
|---|---|
| Ofen | Glut-Kammer mit Gitter, Schornstein, Rauch und Funken beim Arbeiten |
| Förderband | Gummiband mit Pfeil-Rillen, die in Bandrichtung laufen; Stahl-Seitenschienen; saubere Kurven |
| Abbaumaschine | Orange Gehäuse, rotierender Bohrkopf im Schacht; Mk1 mit Kohle-Luke und Schornstein, Mk2 mit Cyan-Spulen |

## Performance

- **Sprite-Cache:** Statische Teile pro Gebäudetyp, Richtung und Zoomstufe einmal in ein Offscreen-Canvas (`src/core/art/spriteCache.ts`).
  Pro Frame nur das Bild plus die animierten Teile (Lüfter, LEDs, Glut, Partikel).
- **LOD** (`lodOf`): `0` weit (kein Detail, vereinfachte Formen), `1` mittel (Rillen, LEDs), `2` nah (Schrauben, Partikel, Funken).
- **Partikel** (`src/core/art/particles.ts`): fester Pool mit Obergrenze; es wird nur emittiert, was gezeichnet wird, und nur ab LOD 1.
- Der Boden wird im Offscreen-Canvas gerendert; Änderungen nur in Teilbereichen (`invalidateGround`).
