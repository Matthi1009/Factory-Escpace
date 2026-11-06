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
  background:rgba(14,17,22,.9);border:1px solid #39424f;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.5);overflow-x:auto;scrollbar-color:#4a566a #10151c;scrollbar-width:thin;pointer-events:auto;z-index:300}
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
.fe-ui-panel .body{padding:10px;overflow:auto;scrollbar-color:#4a566a #10151c}
.fe-ui-empty{color:#8d99a8;font-style:italic;padding:6px 2px}

/* ---------- Inventar ---------- */
.fe-ui-invgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:6px}
.fe-ui-invitem{display:flex;align-items:center;gap:7px;padding:5px 8px;background:#1d2430;border:1px solid #2f3846;border-radius:6px}
.fe-ui-invitem canvas{flex:0 0 auto}
.fe-ui-invitem .nm{flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fe-ui-invitem .n{font-weight:700;font-variant-numeric:tabular-nums}
.fe-ui-invitem.bump{animation:fe-ui-bump .35s ease-out}
@keyframes fe-ui-bump{0%{background:#3a4c2e}100%{background:#1d2430}}

/* ---------- Crafting ---------- */
.fe-ui-tabs{display:flex;gap:4px;margin-bottom:8px}
.fe-ui-tab{padding:3px 10px;background:#1d2430;border:1px solid #2f3846;border-radius:6px;color:#aab5c4;cursor:pointer;font:inherit}
.fe-ui-tab.on{background:#2c3a52;border-color:#6ab0ff;color:#fff}
.fe-ui-sect{margin:10px 0 4px;font-size:11px;color:#8d99a8;text-transform:uppercase;letter-spacing:.07em}
.fe-ui-queue{display:flex;flex-direction:column;gap:4px;margin-bottom:6px}
.fe-ui-job{position:relative;padding:4px 8px;background:#1d2430;border:1px solid #2f3846;border-radius:6px;overflow:hidden}
.fe-ui-job .fill{position:absolute;left:0;top:0;bottom:0;background:rgba(90,170,255,.28);width:0}
.fe-ui-job span{position:relative}
.fe-ui-recipe{display:flex;align-items:center;gap:10px;padding:6px 8px;margin-bottom:4px;background:#1d2430;border:1px solid #2f3846;border-radius:7px}
.fe-ui-recipe.blocked .out{opacity:.6}
.fe-ui-recipe .out{display:flex;align-items:center;gap:6px;min-width:130px;font-weight:600}
.fe-ui-recipe .ins{flex:1;display:flex;flex-wrap:wrap;gap:3px 8px;font-size:12px}
.fe-ui-recipe .in{display:inline-flex;align-items:center;gap:3px;color:#cfd7e2}
.fe-ui-recipe .in.lack{color:#ff8a80}
.fe-ui-recipe .meta{font-size:11px;color:#8d99a8;white-space:nowrap}
.fe-ui-btn{background:#2d6a3a;color:#fff;border:1px solid #4a9a5a;border-radius:6px;padding:4px 10px;cursor:pointer;font:inherit;white-space:nowrap}
.fe-ui-btn:hover:not(:disabled){background:#38804a}
.fe-ui-btn:disabled{background:#2a3038;border-color:#3a4350;color:#7d8896;cursor:not-allowed}
.fe-ui-reason{font-size:11px;color:#e0a060}

/* ---------- Forschung ---------- */
.fe-ui-tree{display:flex;gap:12px;align-items:flex-start}
.fe-ui-col{display:flex;flex-direction:column;gap:8px;min-width:200px;max-width:230px}
.fe-ui-col.flat{display:grid;grid-template-columns:repeat(3,minmax(200px,1fr));max-width:none;width:100%}
.fe-ui-col.flat .hd{grid-column:1/-1}
.fe-ui-col .hd{font-size:11px;color:#8d99a8;text-transform:uppercase;letter-spacing:.07em}
.fe-ui-rcard{position:relative;padding:8px 9px;background:#1d2430;border:1px solid #2f3846;border-radius:8px;overflow:hidden}
.fe-ui-rcard h5{margin:0 0 2px;font-size:13px}
.fe-ui-rcard p{margin:0 0 5px;font-size:11.5px;color:#aab5c4}
.fe-ui-rcard .cost{display:flex;flex-wrap:wrap;gap:2px 8px;font-size:12px;margin-bottom:5px}
.fe-ui-rcard .cost .lack{color:#ff8a80}
.fe-ui-rcard .req{font-size:11px;color:#8d99a8;margin-bottom:5px}
.fe-ui-rcard.done{border-color:#3d7a4a;background:#1c2a22}
.fe-ui-rcard.current{border-color:#6ab0ff}
.fe-ui-rcard.locked{opacity:.55}
.fe-ui-rcard .badge{position:absolute;top:6px;right:8px;font-size:11px}
.fe-ui-bar{height:5px;background:#10151c;border-radius:3px;overflow:hidden;margin-top:4px}
.fe-ui-bar>i{display:block;height:100%;width:0;background:#6ab0ff}

/* ---------- Strom im HUD ---------- */
.fe-ui-chip.power .val{color:#ffd24a}
.fe-ui-chip.power.low .val{color:#ff9a5a}
.fe-ui-chip.power.out .val{color:#ff6a5a}

/* ---------- Info unter der Maus ---------- */
.fe-ui-tip{position:absolute;z-index:450;pointer-events:none;min-width:150px;max-width:280px;padding:7px 10px;background:rgba(10,12,16,.93);border:1px solid #4a566a;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,.5);font:12px/1.4 system-ui,sans-serif;color:#e9edf3}
.fe-ui-tip h4{margin:0 0 2px;font-size:13px}
.fe-ui-tip .dim{color:#8d99a8}
.fe-ui-tip .warn{color:#ffcf7a}
.fe-ui-tip div+div{margin-top:1px}

/* ---------- Gebäude-Info ---------- */
.fe-ui-binfo .tags{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}
.fe-ui-binfo .tag{padding:0 6px;border:1px solid #4a566a;border-radius:10px;font-size:11px;color:#aab5c4}
.fe-ui-binfo .hp{height:7px;background:#10151c;border-radius:4px;overflow:hidden;margin:4px 0 8px}
.fe-ui-binfo .hp>i{display:block;height:100%;background:#6ad67a}
.fe-ui-binfo .lines div{padding:1px 0}

/* ---------- Übersicht (Umwelt + SDG) ---------- */
.fe-ui-sect.sdg{color:#ffb86a}
.fe-ui-stat{margin-bottom:9px}
.fe-ui-stat .top{display:flex;justify-content:space-between;gap:12px}
.fe-ui-stat .top .nm{font-weight:600}
.fe-ui-stat .top .v{font-variant-numeric:tabular-nums;color:#cfd7e2}
.fe-ui-stat .bar2{height:7px;background:#10151c;border-radius:4px;overflow:hidden;margin:3px 0}
.fe-ui-stat .bar2>i{display:block;height:100%;background:#6ab0ff}
.fe-ui-stat.bad .bar2>i{background:#e0703a}
.fe-ui-stat.worse .bar2>i{background:#e0403a}
.fe-ui-stat .cap{font-size:11.5px;color:#aab5c4;font-style:italic}
.fe-ui-satire{margin:2px 0 8px;padding:6px 9px;border-left:3px solid #ffb86a;background:rgba(255,184,106,.08);color:#ffd9a8;font-style:italic;font-size:12px}

.fe-ui-fold{display:flex;align-items:center;gap:7px;margin:8px 0 4px;padding:5px 8px;background:#1d2430;border:1px solid #2f3846;border-radius:6px;cursor:pointer;user-select:none}
.fe-ui-fold:hover{background:#252d3a}
.fe-ui-fold .arrow{width:12px;color:#8d99a8}
.fe-ui-fold .ttl{flex:1;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#cfd7e2;font-weight:600}
.fe-ui-fold .hint{font-size:11px;color:#8d99a8}
.fe-ui-fold.sdg .ttl{color:#ffb86a}
.fe-ui-foldbody{padding:4px 2px 0}

/* ---------- Aktionen ---------- */
.fe-ui-action{display:flex;align-items:center;gap:10px;padding:7px 9px;margin-bottom:4px;background:#1d2430;border:1px solid #2f3846;border-radius:7px}
.fe-ui-action .tx{flex:1}
.fe-ui-action .tx b{display:block}
.fe-ui-action .tx span{font-size:12px;color:#aab5c4}
.fe-ui-action.off{opacity:.6}

/* ---------- Menü, Hilfe ---------- */
.fe-ui-menu{display:flex;flex-direction:column;gap:6px;min-width:230px}
.fe-ui-menu .fe-ui-btn{padding:8px 14px;font-size:14px;text-align:center}
.fe-ui-menu .fe-ui-btn.sec{background:#2a3444;border-color:#46566e}
.fe-ui-menu .fe-ui-btn.sec:hover{background:#34425a}
.fe-ui-keys{width:100%;border-collapse:collapse}
.fe-ui-keys td{padding:3px 6px;border-bottom:1px solid #262e3a;vertical-align:top}
.fe-ui-keys td:first-child{white-space:nowrap;width:1%}
.fe-ui-keys kbd{display:inline-block;padding:0 6px;background:#1d2430;border:1px solid #4a566a;border-radius:4px;font:11px/1.6 ui-monospace,monospace;color:#cfe3ff}
.fe-ui-help p{margin:0 0 8px;color:#cfd7e2}
.fe-ui-hud .menubtn{pointer-events:auto;cursor:pointer;background:rgba(16,19,25,.88);border:1px solid #39424f;border-radius:8px;color:#cfd7e2;padding:0 10px;font-size:16px}
.fe-ui-hud .menubtn:hover{background:#252d3a;color:#fff}

/* ---------- Overlay (Start, Game Over) ---------- */
.fe-ui-overlay{position:absolute;inset:0;z-index:950;display:flex;align-items:center;justify-content:center;background:rgba(6,8,12,.82);pointer-events:auto;animation:fe-ui-fade .4s ease-out;font:14px/1.5 system-ui,sans-serif;color:#e9edf3}
@keyframes fe-ui-fade{from{opacity:0}to{opacity:1}}
.fe-ui-overlay .box{max-width:min(520px,calc(100% - 32px));padding:26px 30px;text-align:center;background:rgba(18,21,28,.98);border:1px solid #4a566a;border-radius:14px;box-shadow:0 10px 50px rgba(0,0,0,.7)}
.fe-ui-overlay h1{margin:0 0 6px;font-size:28px;letter-spacing:.02em}
.fe-ui-overlay .sub{margin:0 0 14px;color:#aab5c4}
.fe-ui-overlay.win h1{color:#8be28b}
.fe-ui-overlay.lose h1{color:#ff8a80}
.fe-ui-overlay .sum{display:flex;justify-content:center;gap:18px;margin:12px 0 18px;font-size:13px;color:#cfd7e2}
.fe-ui-overlay .sum b{display:block;font-size:17px;color:#fff}
.fe-ui-overlay .fe-ui-btn{padding:9px 22px;font-size:15px}

/* ---------- Minimap ---------- */
.fe-ui-minimap{position:absolute;top:8px;left:8px;z-index:300;padding:4px;background:rgba(14,17,22,.9);border:1px solid #39424f;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.5);pointer-events:auto}
.fe-ui-minimap canvas{display:block;border-radius:4px;cursor:crosshair}

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
