// Tastatur- und Maus-Zustand. Tasten werden über KeyboardEvent.code angesprochen ('KeyE', 'Digit1', 'Tab' …).
// Eingaben in <input>/<textarea>/<select> werden ignoriert.

export type KeyHandler = (e: KeyboardEvent) => void;

export class Input {
  private down = new Set<string>();
  private keyHandlers = new Map<string, Set<KeyHandler>>();
  /** Mausposition in CSS-Pixeln relativ zum Canvas */
  mouseX = 0;
  mouseY = 0;
  /** Ist die Maus über dem Canvas? */
  mouseInside = false;

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      if (isTyping(e)) return;
      this.down.add(e.code);
      const set = this.keyHandlers.get(e.code);
      if (set && set.size) {
        e.preventDefault();
        if (!e.repeat) for (const fn of [...set]) fn(e);
      }
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
    canvas.addEventListener('mousemove', (e) => {
      this.mouseX = e.offsetX;
      this.mouseY = e.offsetY;
      this.mouseInside = true;
    });
    canvas.addEventListener('mouseleave', () => (this.mouseInside = false));
  }

  /** Ist die Taste gerade gedrückt? z. B. isDown('ShiftLeft') */
  isDown(code: string): boolean {
    return this.down.has(code);
  }

  /** Handler für einen Tastendruck (ohne Auto-Repeat). Rückgabe: Abmelde-Funktion. */
  onKey(code: string, fn: KeyHandler): () => void {
    let set = this.keyHandlers.get(code);
    if (!set) this.keyHandlers.set(code, (set = new Set()));
    set.add(fn);
    return () => set!.delete(fn);
  }
}

function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
}
