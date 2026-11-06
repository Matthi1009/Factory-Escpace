// Optionale Sprites aus public/assets/<modul>/…
// image('factory/belt.png') liefert null, solange das Bild lädt oder fehlt → dann Formen als Fallback zeichnen.

export class Assets {
  private images = new Map<string, HTMLImageElement | 'loading' | 'missing'>();

  /** Bild relativ zu public/assets/, z. B. 'environment/monster.png'. null = (noch) nicht verfügbar. */
  image(path: string): HTMLImageElement | null {
    const entry = this.images.get(path);
    if (entry instanceof HTMLImageElement) return entry;
    if (entry) return null;
    this.images.set(path, 'loading');
    const img = new Image();
    img.onload = () => this.images.set(path, img);
    img.onerror = () => this.images.set(path, 'missing');
    img.src = `${import.meta.env.BASE_URL}assets/${path}`;
    return null;
  }
}
