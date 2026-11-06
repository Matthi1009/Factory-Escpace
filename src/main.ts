// Einstiegspunkt. Diese Datei wird nach dem Grundgerüst NIE wieder geändert.
// Jedes Modul hängt sich ausschließlich über seine register(game)-Funktion ein.
import { Game } from './core';
import { register as registerFactory } from './features/factory';
import { register as registerEnvironment } from './features/environment';
import { register as registerProgression } from './features/progression';
import { register as registerUi } from './features/ui';

const game = new Game({ container: document.getElementById('app')! });

registerFactory(game);
registerEnvironment(game);
registerProgression(game);
registerUi(game);

game.start();

if (import.meta.env.DEV) (window as unknown as { game: Game }).game = game;
