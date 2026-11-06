// Fester Logik-Takt (60 Ticks/s) und davon getrenntes Zeichnen per requestAnimationFrame.
// In der Pause laufen keine Ticks, gezeichnet wird weiter.

export const TICKS_PER_SECOND = 60;
const STEP = 1 / TICKS_PER_SECOND;
const MAX_STEPS_PER_FRAME = 8; // verhindert die „Todesspirale“, wenn ein Tick zu lange dauert

export class GameLoop {
  /** Gemessene Bilder pro Sekunde (geglättet) */
  fps = 60;
  private acc = 0;
  private last = 0;
  private running = false;

  constructor(
    private step: () => void,
    private frame: (alpha: number, dt: number) => void,
    private isPaused: () => boolean,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(now: number): void {
    const dt = Math.min(0.25, (now - this.last) / 1000);
    this.last = now;
    if (dt > 0) this.fps += (1 / dt - this.fps) * 0.05;
    if (this.isPaused()) {
      this.acc = 0;
    } else {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= STEP && steps < MAX_STEPS_PER_FRAME) {
        this.step();
        this.acc -= STEP;
        steps++;
      }
      if (steps === MAX_STEPS_PER_FRAME) this.acc = 0;
    }
    this.frame(this.acc / STEP, dt);
    requestAnimationFrame((t) => this.loop(t));
  }
}
