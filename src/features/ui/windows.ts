// Fenster-Basis: verschiebbar, mit Titelleiste, Schließen-Knopf und Tastenkürzel. Alle Fenster liegen in game.uiRoot.
import { el } from './dom';

const MIN_Z = 200;
const MAX_Z = 900; // Debugpanel hat 1000
let zCounter = MIN_Z;
const panels = new Set<Panel>();

export interface PanelOptions {
  title: string;
  /** Tastenkürzel nur als Hinweis in der Titelleiste, z. B. 'E' */
  keyHint?: string;
  width?: number;
  /** Feste Startposition in px (sonst zentriert), z. B. { left: 12, top: 70 } */
  anchor?: { left?: number; top?: number; right?: number; bottom?: number };
  /** Wird bei jedem Öffnen aufgerufen (Inhalt neu aufbauen) */
  onShow?: () => void;
  onHide?: () => void;
}

export class Panel {
  readonly el: HTMLDivElement;
  readonly body: HTMLDivElement;
  private opened = false;
  private moved = false;

  constructor(root: HTMLElement, private opts: PanelOptions) {
    this.el = el('div', 'fe-ui-panel');
    if (opts.width) this.el.style.width = `${opts.width}px`;
    if (opts.anchor) {
      const a = opts.anchor;
      this.el.style.transform = 'none';
      this.el.style.left = a.left !== undefined ? `${a.left}px` : 'auto';
      this.el.style.top = a.top !== undefined ? `${a.top}px` : 'auto';
      if (a.right !== undefined) this.el.style.right = `${a.right}px`;
      if (a.bottom !== undefined) this.el.style.bottom = `${a.bottom}px`;
      this.moved = true;
    }
    const bar = el('div', 'bar');
    bar.appendChild(el('span', 'ttl', opts.title));
    if (opts.keyHint) bar.appendChild(el('span', 'keyhint', opts.keyHint));
    const close = el('button', '', '✕');
    close.title = 'Schließen';
    close.addEventListener('click', () => this.hide());
    bar.appendChild(close);
    this.body = el('div', 'body');
    this.el.append(bar, this.body);
    root.appendChild(this.el);
    panels.add(this);

    this.el.addEventListener('mousedown', () => this.toFront());
    this.enableDrag(bar);
  }

  get isOpen(): boolean {
    return this.opened;
  }

  show(): void {
    if (this.opened) return this.toFront();
    this.opened = true;
    this.el.classList.add('open');
    this.toFront();
    this.opts.onShow?.();
  }

  hide(): void {
    if (!this.opened) return;
    this.opened = false;
    this.el.classList.remove('open');
    this.opts.onHide?.();
  }

  toggle(): void {
    if (this.opened) this.hide();
    else this.show();
  }

  private toFront(): void {
    if (++zCounter > MAX_Z) zCounter = MIN_Z;
    this.el.style.zIndex = String(zCounter);
  }

  private enableDrag(handle: HTMLElement): void {
    handle.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
      const rect = this.el.getBoundingClientRect();
      const parent = (this.el.offsetParent as HTMLElement | null)?.getBoundingClientRect() ?? { left: 0, top: 0, width: innerWidth, height: innerHeight };
      const dx = e.clientX - rect.left;
      const dy = e.clientY - rect.top;
      const move = (ev: MouseEvent) => {
        if (!this.moved) {
          this.moved = true;
          this.el.style.transform = 'none'; // ab jetzt absolute Position statt Zentrierung
        }
        const x = Math.min(Math.max(0, ev.clientX - dx - parent.left), parent.width - 60);
        const y = Math.min(Math.max(0, ev.clientY - dy - parent.top), parent.height - 30);
        this.el.style.left = `${x}px`;
        this.el.style.top = `${y}px`;
      };
      const up = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      e.preventDefault();
    });
  }
}

/** Schließt alle offenen Fenster (Esc). Gibt zurück, ob eins offen war. */
export function closeAllPanels(): boolean {
  let any = false;
  for (const p of panels) {
    if (p.isOpen) {
      any = true;
      p.hide();
    }
  }
  return any;
}
