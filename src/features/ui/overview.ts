// Übersicht (Tab): Umwelt-Panel (Verschmutzung, Temperatur, Strahlung, Wasser) und SDG-Panel (stats, Gruppe 'sdg')
// im Satire-Stil: Wer die Umwelt zerstört, wird hier ironisch gelobt.
import type { EnvField, Game } from '../../core';
import { cap, el, fmt } from './dom';
import { Panel } from './windows';

interface EnvRow {
  field: EnvField;
  label: string;
  /** Anzeige eines Werts */
  show(v: number): string;
  /** 0..1 für den Balken (1 = schlimm) */
  badness(g: Game): number;
  caption(g: Game): string;
}

const ENV_ROWS: EnvRow[] = [
  {
    field: 'pollution',
    label: 'Verschmutzung',
    show: (v) => fmt(v, 1),
    badness: (g) => Math.min(1, g.env.total('pollution') / 20000),
    caption: (g) => {
      const t = g.env.total('pollution');
      if (t < 50) return 'Die Luft riecht noch nach Planet. Wie rückständig.';
      if (t < 1000) return 'Ein Hauch von Fortschritt liegt in der Luft.';
      if (t < 8000) return 'Der Himmel hatte schon bessere Tage. Die Aktionäre sind begeistert.';
      return 'Atmen wird überbewertet. Die Bilanz glänzt wie nie.';
    },
  },
  {
    field: 'temperature',
    label: 'Temperatur',
    show: (v) => `${fmt(v, 1)} °C`,
    badness: (g) => Math.min(1, Math.abs(g.env.average('temperature') - 20) / 30),
    caption: (g) => {
      const d = g.env.average('temperature') - 20;
      if (Math.abs(d) < 0.5) return 'Angenehm. Noch.';
      return d > 0 ? 'Gratis-Sauna für alle. Die Heizkosten sinken!' : 'Frische Brise. Pinguine fühlen sich wie zuhause.';
    },
  },
  {
    field: 'radiation',
    label: 'Strahlung',
    show: (v) => fmt(v, 3),
    badness: (g) => Math.min(1, g.env.total('radiation') / 2000),
    caption: (g) => {
      const t = g.env.total('radiation');
      if (t < 1) return 'Strahlungsfrei. Wie langweilig.';
      if (t < 200) return 'Ihre Pflanzen leuchten schon ein wenig. Praktisch: keine Lampen nötig.';
      return 'Der Geigerzähler hat gekündigt.';
    },
  },
  {
    field: 'water',
    label: 'Bodenfeuchte',
    show: (v) => `${fmt(v * 100)} %`,
    badness: (g) => Math.min(1, Math.max(0, (0.6 - g.env.average('water')) / 0.6)),
    caption: (g) => {
      const a = g.env.average('water');
      if (a > 0.55) return 'Es ist noch feucht. Das ändern wir.';
      if (a > 0.3) return 'Trockener Boden. Wasser gibt es doch im Supermarkt.';
      return 'Staubtrocken. Perfekt für Rechenzentren.';
    },
  },
];

export function createOverview(game: Game): Panel {
  const panel: Panel = new Panel(game.uiRoot, { title: 'Umwelt & SDG', keyHint: 'Tab', width: 460, onShow: render });

  /** Geöffnete Abschnitte (bleiben beim Neuzeichnen erhalten). Standard: nur SDG offen. */
  const open = new Set<string>(['sdg']);

  /** Einklappbarer Abschnitt: Kopfzeile zum Anklicken, Inhalt wird nur gebaut, wenn er offen ist. */
  function fold(key: string, title: string, hint: string, build: (box: HTMLElement) => void, cls = ''): HTMLElement {
    const wrap = el('div');
    const isOpen = open.has(key);
    const head = el('div', `fe-ui-fold ${cls}`);
    head.append(el('span', 'arrow', isOpen ? '▾' : '▸'), el('span', 'ttl', title), el('span', 'hint', hint));
    head.addEventListener('click', () => {
      if (open.has(key)) open.delete(key);
      else open.add(key);
      render();
    });
    wrap.appendChild(head);
    if (isOpen) {
      const box = el('div', 'fe-ui-foldbody');
      build(box);
      wrap.appendChild(box);
    }
    return wrap;
  }

  function render(): void {
    const body = panel.body;
    body.replaceChildren();

    // Kennzahlen generisch nach Gruppe sortieren (SDG kommt von progression, der Rest von beliebigen Modulen)
    const stats = game.stats.all();
    const groups = new Map<string, typeof stats>();
    for (const s of stats) {
      const g = s.group ?? 'sonstige';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(s);
    }
    const sdg = groups.get('sdg') ?? [];

    // 1. SDG (standardmäßig offen)
    const pct = sdg.filter((s) => s.unit === '%' && s.value !== undefined).map((s) => s.value!);
    const sdgHint = pct.length ? `Ø ${fmt(Math.round(pct.reduce((a, b) => a + b, 0) / pct.length))} % verfehlt` : '';
    body.appendChild(
      fold('sdg', 'SDG – UN-Nachhaltigkeitsziele', sdgHint, (box) => {
        if (sdg.length === 0) {
          box.appendChild(el('div', 'fe-ui-empty', 'Noch keine SDG-Wertung vorhanden.'));
          return;
        }
        if (pct.length) {
          const avg = pct.reduce((a, b) => a + b, 0) / pct.length;
          const line =
            avg >= 70 ? 'Glückwunsch! Die UN ist entsetzt, Ihre Bank ist begeistert.' : avg >= 30 ? 'Da geht noch was – für die Bilanz.' : 'Verdächtig nachhaltig. Das schadet dem Umsatz.';
          box.appendChild(el('div', 'fe-ui-satire', line));
        }
        for (const s of sdg) box.appendChild(statRow(s));
      }, 'sdg'),
    );

    // 2. Umwelt (zu)
    body.appendChild(
      fold('env', 'Umwelt', `Verschmutzung ${fmt(Math.round(game.env.total('pollution')))}`, (box) => {
        for (const r of ENV_ROWS) {
          const f = r.field;
          const stat = el('div', 'fe-ui-stat');
          const bad = r.badness(game);
          stat.classList.toggle('bad', bad > 0.4);
          stat.classList.toggle('worse', bad > 0.75);
          const top = el('div', 'top');
          top.append(el('span', 'nm', r.label), el('span', 'v', `Ø ${r.show(game.env.average(f))} · max ${r.show(game.env.max(f))}`));
          const bar = el('div', 'bar2');
          const fill = el('i');
          fill.style.width = `${Math.round(Math.max(0.02, bad) * 100)}%`;
          bar.appendChild(fill);
          stat.append(top, bar, el('div', 'cap', r.caption(game)));
          box.appendChild(stat);
        }
      }),
    );

    // 3. Alle übrigen Gruppen (zu)
    for (const [name, list] of groups) {
      if (name === 'sdg') continue;
      const title = name === 'sonstige' ? 'Weitere Kennzahlen' : cap(name);
      body.appendChild(fold(`group:${name}`, title, `${list.length}`, (box) => {
        for (const s of list) box.appendChild(statRow(s));
      }));
    }
  }

  function statRow(s: { label: string; unit?: string; value: number | undefined }): HTMLElement {
    const stat = el('div', 'fe-ui-stat');
    const v = s.value;
    const top = el('div', 'top');
    top.append(el('span', 'nm', s.label), el('span', 'v', v === undefined ? '–' : `${fmt(v, Number.isInteger(v) ? 0 : 1)}${s.unit ? ' ' + s.unit : ''}`));
    stat.appendChild(top);
    if (v !== undefined && s.unit === '%') {
      const bar = el('div', 'bar2');
      const fill = el('i');
      fill.style.width = `${Math.max(0, Math.min(100, v))}%`;
      bar.appendChild(fill);
      stat.classList.toggle('bad', v >= 40);
      stat.classList.toggle('worse', v >= 75);
      stat.appendChild(bar);
    }
    return stat;
  }

  window.setInterval(() => {
    if (panel.isOpen) render();
  }, 250);
  game.input.onKey('Tab', () => panel.toggle());
  return panel;
}
