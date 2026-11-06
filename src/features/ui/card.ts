// Schwebende Info-Karte (Hover) über einem Element.
import type { Game } from '../../core';
import { el } from './dom';

export class HoverCard {
  private card = el('div', 'fe-ui-card');

  constructor(private game: Game) {
    this.card.style.display = 'none';
    game.uiRoot.appendChild(this.card);
  }

  /** Zeigt content über (oder, wenn kein Platz ist, unter) dem Anker. */
  show(anchor: HTMLElement, content: HTMLElement): void {
    this.card.replaceChildren(content);
    this.card.style.display = 'block';
    const root = this.game.uiRoot.getBoundingClientRect();
    const a = anchor.getBoundingClientRect();
    const w = this.card.offsetWidth;
    const h = this.card.offsetHeight;
    let x = a.left - root.left + a.width / 2 - w / 2;
    let y = a.top - root.top - h - 8;
    if (y < 8) y = a.bottom - root.top + 8;
    x = Math.max(8, Math.min(x, root.width - w - 8));
    this.card.style.left = `${x}px`;
    this.card.style.top = `${y}px`;
  }

  hide(): void {
    this.card.style.display = 'none';
  }
}
