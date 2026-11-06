// Minimap oben links: Boden, Erz, Gebäude und der sichtbare Ausschnitt. Klick springt mit der Kamera dorthin. Taste N blendet sie aus.
import { RESOURCES, TERRAINS, type Game } from '../../core';
import { el } from './dom';

const SIZE = 160;
const REFRESH_MS = 1000;

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function createMinimap(game: Game): void {
  const wrap = el('div', 'fe-ui-minimap');
  const canvas = el('canvas');
  canvas.width = canvas.height = SIZE;
  wrap.appendChild(canvas);
  game.uiRoot.appendChild(wrap);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = game.world.width;
  const h = game.world.height;
  // Welt-Abbild 1 Pixel pro Kachel; wird in Intervallen neu berechnet (Terrain verändert sich)
  const base = document.createElement('canvas');
  base.width = w;
  base.height = h;
  const bctx = base.getContext('2d')!;
  const img = bctx.createImageData(w, h);
  const terrainRgb = TERRAINS.map((t) => rgb(t.color));
  const resRgb = RESOURCES.map((r) => rgb(r.color));

  const rebuildBase = () => {
    const d = img.data;
    const wd = game.world;
    for (let i = 0; i < w * h; i++) {
      const res = wd.resource[i]!;
      const c = res !== 0 ? resRgb[res - 1]! : (terrainRgb[wd.terrain[i]!] ?? [0, 0, 0]);
      d[i * 4] = c[0];
      d[i * 4 + 1] = c[1];
      d[i * 4 + 2] = c[2];
      d[i * 4 + 3] = 255;
    }
    bctx.putImageData(img, 0, 0);
    for (const b of wd.allBuildings()) {
      bctx.fillStyle = b === game.wreck ? '#ffffff' : '#ffd24a';
      bctx.fillRect(b.x, b.y, b.def.size.w, b.def.size.h);
    }
  };

  const draw = () => {
    if (wrap.style.display === 'none') return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base, 0, 0, SIZE, SIZE);
    const cam = game.camera;
    const k = SIZE / w;
    const vw = cam.viewWidth / cam.zoom;
    const vh = cam.viewHeight / cam.zoom;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect((cam.x - vw / 2) * k, (cam.y - vh / 2) * k, vw * k, vh * k);
  };

  const refresh = () => {
    if (wrap.style.display === 'none') return;
    rebuildBase();
    draw();
  };

  const jump = (e: MouseEvent) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * w;
    const y = ((e.clientY - r.top) / r.height) * h;
    game.camera.centerOn(x, y);
    draw();
  };
  canvas.addEventListener('mousedown', (e) => {
    jump(e);
    const move = (ev: MouseEvent) => jump(ev);
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  });

  refresh();
  game.events.on('ready', refresh);
  window.setInterval(refresh, REFRESH_MS);
  // Kamerarahmen öfter nachzeichnen als das Weltabbild
  window.setInterval(draw, 100);
  game.input.onKey('KeyN', () => {
    wrap.style.display = wrap.style.display === 'none' ? '' : 'none';
    refresh();
  });
}
