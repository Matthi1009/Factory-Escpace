// Alle Styles der ui als CSS-String. Klassen haben das Präfix fe-ui-, z-index bleibt unter 1000 (Debugpanel).

export const UI_CSS = `
.fe-ui-hud,.fe-ui-toolbar,.fe-ui-panel,.fe-ui-toasts,.fe-ui-card{font:13px/1.4 system-ui,-apple-system,'Segoe UI',sans-serif;color:#e9edf3;box-sizing:border-box}
.fe-ui-hud *,.fe-ui-toolbar *,.fe-ui-panel *,.fe-ui-toasts *,.fe-ui-card *{box-sizing:border-box}

/* ---------- HUD ---------- */
.fe-ui-hud{position:absolute;top:8px;left:50%;transform:translateX(-50%);display:flex;gap:6px;align-items:stretch;z-index:300;pointer-events:none}
.fe-ui-chip{display:flex;align-items:baseline;gap:6px;padding:5px 11px;background:rgba(16,19,25,.88);border:1px solid #39424f;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.4);white-space:nowrap}
.fe-ui-chip .lbl{font-size:11px;color:#8d99a8;text-transform:uppercase;letter-spacing:.06em}
.fe-ui-chip .val{font-weight:600;font-variant-numeric:tabular-nums}
.fe-ui-chip.money .val{color:#8be28b}
.fe-ui-chip.money.neg .val{color:#ff8a80}
.fe-ui-chip.flash-up{animation:fe-ui-flash-up .7s ease-out}
.fe-ui-chip.flash-down{animation:fe-ui-flash-down .7s ease-out}
@keyframes fe-ui-flash-up{0%{background:rgba(70,170,80,.7)}100%{background:rgba(16,19,25,.88)}}
@keyframes fe-ui-flash-down{0%{background:rgba(190,70,60,.7)}100%{background:rgba(16,19,25,.88)}}
.fe-ui-chip.pollution .val{color:#d8b36a}
.fe-ui-chip.pollution.high .val{color:#ff9a5a}
.fe-ui-chip.pollution.extreme .val{color:#ff6a5a}
.fe-ui-chip.pause{background:rgba(120,60,20,.92);border-color:#d97a3a;font-weight:600;letter-spacing:.08em}

/* ---------- Bauleiste ---------- */
.fe-ui-toolbar{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);max-width:calc(100% - 24px);display:flex;gap:5px;padding:6px;
  background:rgba(14,17,22,.9);border:1px solid #39424f;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.5);overflow-x:auto;pointer-events:auto;z-index:300}
.fe-ui-slot{position:relative;flex:0 0 auto;width:64px;height:62px;padding:4px 3px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;
  background:#1c222c;border:2px solid #2f3846;border-radius:7px;cursor:pointer;user-select:none;transition:border-color .12s,background .12s}
.fe-ui-slot:hover{background:#252d3a;border-color:#4e5d73}
.fe-ui-slot .sw{width:30px;height:30px;border-radius:5px;border:2px solid rgba(0,0,0,.55);box-shadow:inset 0 0 0 2px rgba(255,255,255,.12)}
.fe-ui-slot .nm{font-size:10px;line-height:1.1;text-align:center;max-width:58px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#cfd7e2}
.fe-ui-slot .key{position:absolute;top:1px;left:4px;font-size:10px;font-weight:700;color:#8fb4e0}
.fe-ui-slot .lock{position:absolute;top:0;right:3px;font-size:11px}
.fe-ui-slot.sel{border-color:#ffd24a;background:#32301f;box-shadow:0 0 0 1px #ffd24a inset}
.fe-ui-slot.poor{opacity:.55}
.fe-ui-slot.poor .sw{filter:grayscale(.7)}
.fe-ui-slot.locked{opacity:.35;cursor:not-allowed}
.fe-ui-slot.locked .sw{filter:grayscale(1)}
.fe-ui-slot.locked:hover{background:#1c222c;border-color:#2f3846}

/* ---------- Karte (Hover-Infos) ---------- */
.fe-ui-card{position:absolute;z-index:500;pointer-events:none;min-width:170px;max-width:280px;padding:8px 10px;background:rgba(10,12,16,.96);border:1px solid #4a566a;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.55)}
.fe-ui-card h4{margin:0 0 3px;font-size:13px}
.fe-ui-card p{margin:0 0 5px;color:#aab5c4;font-size:12px}
.fe-ui-card .costs{display:flex;flex-direction:column;gap:1px;font-size:12px}
.fe-ui-card .ok{color:#8be28b}
.fe-ui-card .miss{color:#ff8a80}
.fe-ui-card .hint{margin-top:5px;padding-top:5px;border-top:1px solid #333c49;color:#ffcf7a;font-size:12px}

/* ---------- Fenster ---------- */
.fe-ui-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:none;flex-direction:column;min-width:260px;max-width:calc(100% - 24px);max-height:calc(100% - 130px);
  background:rgba(18,21,28,.97);border:1px solid #4a566a;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.6);pointer-events:auto;overflow:hidden}
.fe-ui-panel.open{display:flex}
.fe-ui-panel .bar{display:flex;align-items:center;gap:8px;padding:7px 10px;background:#232b38;border-bottom:1px solid #39424f;cursor:move;user-select:none}
.fe-ui-panel .bar .ttl{flex:1;font-weight:600}
.fe-ui-panel .bar .keyhint{font-size:11px;color:#8d99a8;border:1px solid #4a566a;border-radius:4px;padding:0 5px}
.fe-ui-panel .bar button{background:none;border:none;color:#aab5c4;font-size:16px;cursor:pointer;padding:0 4px;line-height:1}
.fe-ui-panel .bar button:hover{color:#fff}
.fe-ui-panel .body{padding:10px;overflow:auto}
.fe-ui-empty{color:#8d99a8;font-style:italic;padding:6px 2px}

/* ---------- Inventar ---------- */
.fe-ui-invgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:6px}
.fe-ui-invitem{display:flex;align-items:center;gap:7px;padding:5px 8px;background:#1d2430;border:1px solid #2f3846;border-radius:6px}
.fe-ui-invitem canvas{flex:0 0 auto}
.fe-ui-invitem .nm{flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fe-ui-invitem .n{font-weight:700;font-variant-numeric:tabular-nums}
.fe-ui-invitem.bump{animation:fe-ui-bump .35s ease-out}
@keyframes fe-ui-bump{0%{background:#3a4c2e}100%{background:#1d2430}}

/* ---------- Meldungen ---------- */
.fe-ui-toasts{position:absolute;top:54px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:5px;z-index:350;pointer-events:none;width:min(460px,calc(100% - 24px))}
.fe-ui-toast{padding:7px 13px;border-radius:8px;background:rgba(16,19,25,.94);border:1px solid #4a566a;border-left-width:4px;box-shadow:0 3px 12px rgba(0,0,0,.5);animation:fe-ui-toast-in .18s ease-out;transition:opacity .4s,transform .4s}
.fe-ui-toast.info{border-left-color:#6ab0ff}
.fe-ui-toast.success{border-left-color:#6ad67a}
.fe-ui-toast.warn{border-left-color:#ffcf5a}
.fe-ui-toast.error{border-left-color:#ff6a5a}
.fe-ui-toast.out{opacity:0;transform:translateY(-6px)}
@keyframes fe-ui-toast-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
`;

let injected = false;

/** Hängt die Styles genau einmal ins Dokument. */
export function injectStyles(): void {
  if (injected) return;
  injected = true;
  const style = document.createElement('style');
  style.id = 'fe-ui-styles';
  style.textContent = UI_CSS;
  document.head.appendChild(style);
}
