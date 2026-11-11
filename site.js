const CONFIG = {
  // Adresse deiner Impro-App-Schnittstelle (Google Apps Script)
  API: "https://script.google.com/macros/s/AKfycbwcGZii-rdT7MHU_vxgWMGMFsZIuwUW96_ECA8vTRAzEk8RbPszsdT2Dh8CPYJSWgqM/exec",
  // Adresse, an die Vorschläge gehen
  KONTAKT_MAIL: "leon@impro-fundus.de",
  PAYPAL_URL: "https://paypal.me/improfundus",
  // Website des Theater Brand (wird überall im Text verlinkt)
  THEATER_BRAND_URL: "https://theater-brand.clubdesk.com/home",
  // Spendenkonto. Solange leer, steht dort ein Hinweis.
  SPENDE: { inhaber: "", iban: "", bic: "", zweck: "Spende Impro-Fundus" }
};
const katLabel = n => ({ "Zweierübungen": "2er-Übungen", "Dreierübungen": "3er-Übungen" })[n] || n;
const UE_INFO = {
  "Zweierübungen": "Übungen für genau zwei Personen.",
  "Dreierübungen": "Übungen für genau drei Personen.",
  "Gruppenübungen": "Übungen für Gruppen.",
  "Warm-Up-Spiele": "Aufwärmen für den Probenbeginn.",
  "Kennenlernspiele": "Spiele, mit denen sich Gruppen besser kennenlernen."
};

let CATS = [], ITEMS = [], VORG = {}, LOADED = false, FEHLER = "";

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const catOf = id => CATS.find(c => c.id === id);
const shortOf = i => {
  if (!i.ab) return "Beschreibung folgt.";
  const z = i.ab.split(/\n/).find(l => l.trim().length > 30) || i.ab.split("\n")[0];
  return z.slice(0, 150);
};
const seite = (titel, text) => `<div class="pagehead"><h1>${esc(titel)}</h1></div><div class="note">${esc(text)}</div>`;
const prose = t =>t.split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
const pickFrom = list => (list && list.length) ? list[Math.floor(Math.random() * list.length)].t : "–";
const DICE = [["Ort", "ort"], ["Beziehung", "bezieh"], ["Gefühl", "gef"], ["Tätigkeit", "tät"]];
const diceDefault = i => Object.keys(VORG).find(x => x.toLowerCase().includes(DICE[i][1])) || Object.keys(VORG)[i];
const diceKeys = () => (S.dice && S.dice.length === 4) ? S.dice : [0, 1, 2, 3].map(diceDefault);
const draw = () => {
  const ks = diceKeys();
  return ks.map(k => [k, pickFrom(VORG[k])]);
};
const vCount = () => Object.values(VORG).reduce((a, x) => a + x.length, 0);

var RAW = null, ZIT = [];
function setData(d) {
  RAW = d; ZIT = Array.isArray(d.zitate) ? d.zitate : [];
  CATS = d.uebungenReihe.map(k => ({ id: k, name: katLabel(k), desc: UE_INFO[k] || "" }));
  const KAT_ALT = { "2er": "Zweierübungen", "3er": "Dreierübungen", "Gruppe": "Gruppenübungen", "Warm-Up": "Warm-Up-Spiele" };
  ITEMS = d.uebungen.map(u => ({ id: u.id, cat: KAT_ALT[u.kat] || u.kat, title: u.titel, level: u.level || "", draft: u.entwurf === "1", ab: u.ablauf || "", dauer: u.dauer || "", tn: u.tn || "", eig: u.eig || [] }));
  VORG = {};
  d.vorgabenReihe.forEach(k => { VORG[k] = d.vorgaben[k] || []; });
  Object.keys(d.vorgaben).forEach(k => { if (!VORG[k]) VORG[k] = d.vorgaben[k]; });
  slugsBauen();
  LOADED = true;
  nachDatenAnwenden();
}

const S = {
  sp: { step: 1, betrag: 10, zweck: "fundus", name: "", mail: "", text: "", danke: false }, view: "start", cat: null, id: null, vcat: null, vprop: "alle", q: "", sent: false, level: "alle", p: "alle", draw: null };

/* ===== Eigene Adresse für jede Seite =====
   Jede Seite hat einen eigenen Link. Die Adresse in der Browserzeile ändert sich beim Klicken,
   der Zurück-Knopf des Browsers funktioniert, und jeder Link lässt sich teilen. */
const BASIS_URL = "https://impro-fundus.de";
const slug = s => String(s ?? "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const SEITEN = {
  start: "/", kats: "/uebungen/", alle: "/alle-uebungen/", vorgaben: "/vorgaben/", impro: "/was-ist-impro/",
  ueber: "/ueber-den-fundus/", kontakt: "/kontakt/", spenden: "/spenden/", einreichen: "/vorschlag-einreichen/",
  impressum: "/impressum/", datenschutz: "/datenschutz/", nutzung: "/nutzungsbedingungen/", suche: "/suche/",
  proben: "/proben/", probeNeu: "/proben/neu/"
};
let ITEM_SLUG = {};
function slugsBauen() {
  const zaehl = {};
  ITEMS.forEach(i => { if (!i.draft) { const s = slug(i.title); zaehl[s] = (zaehl[s] || 0) + 1; } });
  ITEM_SLUG = {};
  ITEMS.forEach(i => {
    const s = slug(i.title);
    ITEM_SLUG[i.id] = (!s || i.draft || zaehl[s] > 1) ? (s ? s + "-" : "") + slug(i.id) : s;
  });
}
function pfadFuer(s = S) {
  switch (s.view) {
    case "kat": { const c = catOf(s.cat); return c ? "/uebungen/" + slug(c.name) + "/" : "/uebungen/"; }
    case "item": return ITEM_SLUG[s.id] ? "/uebung/" + ITEM_SLUG[s.id] + "/" : "/uebungen/";
    case "vorgaben": return s.vcat ? "/vorgaben/" + slug(s.vcat) + "/" : "/vorgaben/";
    case "suche": return "/suche/" + (s.q ? "?q=" + encodeURIComponent(s.q) : "");
    case "probe": return s.pid ? "/proben/" + encodeURIComponent(s.pid) + "/" : "/proben/";
    default: return SEITEN[s.view] || "/";
  }
}
/* Stellt die Seite zu einer Adresse ein. Gibt false zurück, wenn dafür erst die Daten geladen sein müssen. */
let WARTET = null;
function pfadAnwenden(pfad, query) {
  const t = String(pfad || "/").split("/").filter(x => x && x !== "index.html");
  const pn = "/" + t.join("/") + (t.length ? "/" : "");
  const neu = { view: "start", cat: null, id: null, vcat: null, q: "", pid: null, von: null };
  const fest = Object.keys(SEITEN).find(k => SEITEN[k] === pn);
  if (fest) {
    neu.view = fest;
    if (fest === "suche") neu.q = (new URLSearchParams(query || "").get("q") || "").trim();
  } else if (t[0] === "proben" && t.length === 2) {
    neu.view = "probe"; neu.pid = decodeURIComponent(t[1]);
  } else if (t.length === 2 && ["uebungen", "uebung", "vorgaben"].includes(t[0])) {
    if (!LOADED) return false;
    neu.view = "nichtda";
    if (t[0] === "uebungen") { const c = CATS.find(x => slug(x.name) === t[1]); if (c) { neu.view = "kat"; neu.cat = c.id; } }
    else if (t[0] === "uebung") { const i = ITEMS.find(x => ITEM_SLUG[x.id] === t[1]); if (i) { neu.view = "item"; neu.id = i.id; } }
    else { const k = Object.keys(VORG).find(x => slug(x) === t[1]); if (k) { neu.view = "vorgaben"; neu.vcat = k; } }
  } else neu.view = "nichtda";
  Object.assign(S, neu);
  return true;
}
function nachDatenAnwenden() {
  if (!WARTET) return;
  const w = WARTET; WARTET = null;
  pfadAnwenden(w.p, w.q);
  if (S.view === "item" && w.v) S.von = w.v;
  try {
    const kanon = pfadFuer();
    if (S.view !== "nichtda" && location.pathname + (S.view === "suche" ? location.search : "") !== kanon) history.replaceState(history.state, "", kanon);
  } catch (e) {}
}
function go(view, o = {}, ersetzen = false) {
  const vorher = pfadFuer(), vonVorher = S.von;
  Object.assign(S, { view, cat: null, id: null, pid: null, von: null, vcat: view === "vorgaben" ? null : S.vcat }, o);
  const neu = pfadFuer();
  if (neu !== vorher) {
    try {
      const n = (history.state && history.state.n) || 0;
      if (ersetzen || (vorher.startsWith("/suche/") && neu.startsWith("/suche/"))) history.replaceState({ n, v: S.von }, "", neu);
      else { history.replaceState({ n, y: window.scrollY, v: vonVorher }, ""); history.pushState({ n: n + 1, v: S.von }, "", neu); }
    } catch (e) {}
  }
  if (view !== "einreichen") S.sent = false;
  if (view === "spenden" && S.sp.danke) S.sp = { step: 1, betrag: 10, zweck: "fundus", name: "", mail: "", text: "", danke: false };
  if (S.diceOpen) closeDlg();
  closeDrawer(); render(); window.scrollTo(0, 0);
}
function zurueck() {
  const n = (history.state && history.state.n) || 0;
  if (n > 0) { history.back(); return; }
  if (S.view !== "start") go("start");
}
window.addEventListener("popstate", e => {
  S.sent = false;
  if (S.diceOpen || !$("#dlg").hidden) closeDlg();
  closeDrawer();
  const vv = (e.state && e.state.v) || null;
  if (!pfadAnwenden(location.pathname, location.search)) WARTET = { p: location.pathname, q: location.search, v: vv };
  else if (S.view === "item" && vv) S.von = vv;
  render(); window.scrollTo(0, (e.state && e.state.y) || 0);
});
const startVon = (history.state && history.state.v) || null;
try { history.scrollRestoration = "manual"; history.replaceState({ n: (history.state && history.state.n) || 0, v: startVon }, ""); } catch (e) {}
if (!pfadAnwenden(location.pathname, location.search)) WARTET = { p: location.pathname, q: location.search, v: startVon };
else if (S.view === "item" && startVon) S.von = startVon;
function kopfHoehe() {
  const k = $(".topwrap");
  if (k) document.documentElement.style.setProperty("--hm", k.offsetHeight + "px");
}
window.addEventListener("resize", kopfHoehe);
/* Wischen nach rechts = zurück (nur Handy) */
let wischX = null, wischY = 0;
document.addEventListener("touchstart", e => {
  wischX = null;
  if (e.touches.length !== 1 || window.innerWidth >= 900) return;
  if (e.target.closest(".chips, input, textarea, select, .dlg")) return;
  const t = e.touches[0];
  if (t.clientX < 24 && !$("#drawer").classList.contains("open")) return;
  wischX = t.clientX; wischY = t.clientY;
}, { passive: true });
document.addEventListener("touchend", e => {
  if (wischX === null) return;
  const t = e.changedTouches[0], dx = t.clientX - wischX, dy = t.clientY - wischY;
  wischX = null;
  if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 2) return;
  if ($("#drawer").classList.contains("open")) { if (dx < 0) closeDrawer(); return; }
  if (dx > 0) zurueck();
}, { passive: true });
document.addEventListener("submit", e => {
  if (e.target.id !== "dsearch") return;
  e.preventDefault();
  const v = e.target.querySelector(".dq").value.trim();
  if (!v) return;
  S.q = v;
  const qi = $("#q"); if (qi) qi.value = v;
  go("suche");
});
function closeDrawer() { $("#drawer").classList.remove("open"); $("#scrim").hidden = true; }
function openDrawer() { $("#drawer").classList.add("open"); $("#scrim").hidden = false; }

const ICONS = {
  start: '<path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z"/>',
  kats: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  vorgaben: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>',
  einreichen: '<path d="M12 5v14M5 12h14"/>',
  spenden: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'
};

function navHTML() {
  const b = (on, attrs, label) => `<button class="navbtn${on ? " on" : ""}" ${attrs}><span>${label}</span></button>`;
  let h = `<form class="dsearch" id="dsearch" role="search"><input class="dq" type="search" enterkeyhint="search" placeholder="Spiel oder Vorgabe suchen" aria-label="Suchen" value="${esc(S.q || "")}"></form>`;
  h += b(S.view === "start", 'data-go="start"', "Start");
  h += b(["kats", "kat", "item", "alle"].includes(S.view), 'data-go="kats"', "Übungen");
  h += b(S.view === "vorgaben", 'data-go="vorgaben"', "Vorgaben");
  h += b(S.view === "einreichen", 'data-go="einreichen"', "Vorschlag einreichen");
  h += b(S.view === "kontakt", 'data-go="kontakt"', "Kontakt");
  h += `<div class="lbl">Mehr</div>`;
  h += b(S.view === "impro", 'data-go="impro"', "Was ist Impro?");
  h += b(false, 'data-pdf="1"', "Eigene Spielliste erstellen");
  h += `<div class="lbl">Über den Fundus</div>`;
  h += b(S.view === "ueber", 'data-go="ueber"', "Alles über den Fundus");
  h += b(S.view === "spenden", 'data-go="spenden"', "Spenden");
  h += b(S.view === "impressum", 'data-go="impressum"', "Impressum");
  h += b(S.view === "datenschutz", 'data-go="datenschutz"', "Datenschutz");
  h += b(S.view === "nutzung", 'data-go="nutzung"', "Nutzungsbedingungen");
  return h;
}

function bottomHTML() {
  const ic = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  return `<button data-back aria-label="Zurück">${ic('<path d="M15 5l-7 7 7 7"/>')}Zurück</button>`
    + `<button data-go="start" class="${S.view === "start" ? "on" : ""}" aria-label="Startseite">${ic(ICONS.start)}Start</button>`
    + (inProbe() ? `<button data-go="vorgaben" aria-label="Vorgaben">${ic('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none"/>')}Vorgaben</button>` : "")
    + (inProbe() ? "" : `<button data-dicedlg class="${S.diceOpen ? "on" : ""}" aria-label="Szenenwürfel" aria-expanded="${!!S.diceOpen}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none"/></svg>Würfel</button>`);
}

// Sind wir gerade in einer eigenen Probe? (Probenseite oder eine Übung, die von dort geöffnet wurde)
function inProbe() {
  return S.view === "probe" || (S.view === "item" && !!S.von);
}

const card = (i, ohneKat) => `<button class="card" data-item="${esc(i.id)}">${(ohneKat && !i.dauer) ? "" : `<span class="eyebrow">${ohneKat ? esc(i.dauer) : esc(katLabel(i.cat)) + (i.dauer ? " · " + esc(i.dauer) : "")}</span>`}<h3>${esc(i.title)}${i.draft ? '<span class="pill todo">Entwurf</span>' : ""}${!i.ab ? '<span class="pill todo">folgt</span>' : ""}</h3><p>${esc(shortOf(i))}</p><span class="meta">${i.level ? `<span>${esc(i.level)}</span>` : ""}</span></button>`;
const genHTML = () => {
  const ks = diceKeys();
  const res = S.draw || [];
  const chev = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
  const slot = (k, i) => `<div class="slot"><div class="slot-top"><button class="dtog" type="button" data-dtog="${i}" aria-expanded="${S.dpick === i}" aria-label="Vorgabe für Würfel ${i + 1} ändern" title="Vorgabe ändern">${chev}</button><span>${esc(k)}</span></div><strong>${esc(res[i] ? res[i][1] : "–")}</strong>${S.dpick === i ? `<div class="dmenu">${Object.keys(VORG).map(o => `<button class="dopt${o === k ? " on" : ""}" type="button" data-dset="${i}" data-val="${esc(o)}">${esc(o)}</button>`).join("")}</div>` : ""}</div>`;
  return `<section class="gen" aria-live="polite"><span class="eyebrow">Szenen-Würfel</span><div class="gen-slots">${ks.map(slot).join("")}</div><div><button class="btn red" data-roll>Neu würfeln</button></div></section>`;
};

const levelChips = () => `<div class="row" role="group" aria-label="Niveau"><span class="eyebrow">Niveau</span>${[["Einsteiger", "Anfänger"], ["Fortgeschritten", "Fortgeschritten"]].map(([v, l]) => `<button class="chip" aria-pressed="${S.level === v}" data-level="${v}">${l}</button>`).join("")}</div>`;
const sideTop = () => `<div class="sidesearch"><input id="allq" type="search" placeholder="Übungen suchen …" value="${esc(S.aq || "")}" aria-label="Übungen suchen"></div><button class="navbtn${S.view === "alle" ? " on" : ""}" data-go="alle"><span>Alle Übungen</span><span class="count">${ITEMS.length}</span></button>`;
async function kontaktSenden() {
  const vn = $("#k-vn").value.trim(), mail = $("#k-mail").value.trim(), bt = $("#k-betreff").value.trim(), tx = $("#k-text").value.trim();
  const err = $("#k-err");
  let m = "";
  if (!vn) m = "Bitte gib deinen Vornamen ein.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) m = "Bitte gib eine gültige E-Mail-Adresse ein.";
  else if (!bt) m = "Bitte gib einen Betreff ein.";
  else if (tx.length < 20) m = `Die Nachricht muss mindestens 20 Zeichen lang sein (aktuell ${tx.length}).`;
  else if (!CONFIG.KONTAKT_MAIL) m = "Das Kontaktformular ist noch nicht eingerichtet.";
  if (m) { err.textContent = m; err.hidden = false; return; }
  err.hidden = true;
  const btn = $("#kf button[type=submit]");
  btn.disabled = true; btn.textContent = "Wird gesendet …";
  try {
    const nn = $("#k-nn").value.trim(), tel = $("#k-tel").value.trim();
    const r = await apiPost({ action: "kontakt", vorname: vn, nachname: nn, mail, telefon: tel, betreff: bt, text: tx });
    if (!r || !r.ok) throw new Error((r && r.msg) || "nicht gesendet");
    S.kSent = true; render(); window.scrollTo(0, 0);
  } catch (e) {
    btn.disabled = false; btn.textContent = "Nachricht senden";
    err.textContent = "Die Nachricht konnte gerade nicht gesendet werden. Bitte versuche es später noch einmal oder schreibe direkt an " + CONFIG.KONTAKT_MAIL + ". (Technische Meldung: " + (e && e.message ? e.message : "unbekannt") + ")";
    err.hidden = false;
  }
}

const V = {
  start() {
    const z = zitatHeute();
    return `<h1 class="ttl"><svg viewBox="0 0 920 80" role="img" aria-label="Der Fundus für alle, die Impro spielen."><text x="0" y="62" textLength="920" lengthAdjust="spacingAndGlyphs">Der Fundus für alle, die Impro spielen.</text></svg></h1>
    <div class="quote"><span class="tape l"></span><span class="tape r"></span><p>„${esc(z.t)}“</p><div class="qfoot"><span class="meta">— ${esc(z.a)}</span><button class="copybtn" data-quote="1" data-txt="${esc("„" + z.t + "“ – " + z.a)}" aria-label="Zitat kopieren" title="Zitat kopieren"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg></button></div></div>
    <hr class="sep">
    <div class="chests">
      <button class="chest" data-go="kats" aria-label="Übungen"><span class="cbox"><img class="zu" src="/kiste-uebungen.png" alt="Übungen"><img class="auf" src="/kiste-uebungen-offen.png" alt="" aria-hidden="true"></span></button>
      <button class="chest" data-cat="Kennenlernspiele" aria-label="Kennenlernspiele"><span class="cbox"><img class="zu" src="/kiste-kennenlernen.png" alt="Kennenlernspiele"><img class="auf" src="/kiste-kennenlernen-offen.png" alt="" aria-hidden="true"></span></button>
      <button class="chest" data-go="vorgaben" aria-label="Vorgaben"><span class="cbox"><img class="zu" src="/kiste-vorgaben.png" alt="Vorgaben"><img class="auf" src="/kiste-vorgaben-offen.png" alt="" aria-hidden="true"></span></button>
    </div>
    <div class="mtiles">
      <button class="tile" data-go="kats"><h3>Übungen</h3><p>Warm-ups, Szenen und Spiele</p></button>
      <button class="tile" data-cat="Kennenlernspiele"><h3>Kennenlernen</h3><p>Spiele für neue Gruppen</p></button>
      <button class="tile" data-go="vorgaben"><h3>Vorgaben</h3><p>Orte, Gefühle, Berufe und mehr</p></button>
    </div>
    <div class="probekachel"><button class="tile" data-go="proben"><h3>Eigene Probe zusammenstellen</h3><p>Übungen für deine nächste Probe auswählen und speichern</p></button></div>
    ${genHTML()}
    <div class="startbtns">
      <button class="tile" data-go="impro"><h3>Was ist Impro?</h3><p>Eine kurze Einführung.</p></button>
      <button class="tile" data-go="einreichen"><h3>Idee einreichen</h3><p>Es gibt eine Übung oder eine Vorgabe, die noch nicht hier auf der Website steht, dann schick sie uns gerne.</p></button>
      <button class="tile" data-pdf="1"><h3>Eigene Spielliste erstellen</h3><p>Stell die Übungen und Vorgaben individuell zusammen und speichere sie als PDF, für deine nächste Probe.</p></button>
    </div>`;
  },

  kats() {
    return `<div class="pagehead"><h1>Übungen</h1></div><div class="grid tgrid kgrid">${CATS.map(c => `<button class="vgtile" data-cat="${esc(c.id)}"><h3>${esc(c.name)}</h3></button>`).join("")}</div>`;
  },

  kat() {
    const c = catOf(S.cat);
    const l = ITEMS.filter(i => i.cat === c.id && (S.level === "alle" || i.level === S.level));
    return `<div class="crumb"><button data-go="kats">Übungen</button><span>›</span><span>${esc(c.name)}</span></div>
    <div class="pagehead"><h1>${esc(c.name)}</h1></div>
    ${levelChips()}
    <div class="list">${l.length ? l.map(i => card(i, true)).join("") : '<div class="empty">Für diese Auswahl gibt es noch nichts.</div>'}</div>`;
  },

  item() {
    const i = ITEMS.find(x => x.id === S.id), c = catOf(i.cat);
    const pr = S.von ? probenLesen().find(x => x.id === S.von) : null;
    return `${pr ? `<div class="crumb"><button data-go="proben">Meine Proben</button><span>›</span><button data-probe="${esc(pr.id)}">${esc(pr.name)}</button></div>` : `<div class="crumb"><button data-go="kats">Übungen</button><span>›</span><button data-cat="${esc(c.id)}">${esc(c.name)}</button></div>`}
    <article class="detail"><div class="pagehead"><span><span class="pill red">${esc(c.name)}</span></span><h1>${esc(i.title)}</h1></div>
    <div class="facts"><div class="fact"><span>Dauer</span><strong>${esc(i.dauer || "–")}</strong></div><div class="fact"><span>Niveau</span><strong>${esc(i.level || "–")}</strong></div></div>
    ${i.eig.length ? `<div class="taglist">${i.eig.map(e => `<span>${esc(e)}</span>`).join("")}</div>` : ""}
    <div class="row sharerow"><button class="btn" data-share="${esc(i.id)}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg> Teilen</button></div>
    ${i.ab ? `<section class="prose"><h2>So geht's</h2>${prose(i.ab)}</section>` : `<div class="tip"><strong>Hier fehlt noch eine Beschreibung.</strong> Du kennst das Spiel? <button class="linkbtn" data-go="einreichen">Beschreibung einreichen</button></div>`}
    </article>
    <div class="row">${pr ? `<button class="btn" data-probe-back="${esc(pr.id)}">← Zurück zur Probe</button>` : `<button class="btn" data-cat="${esc(c.id)}">← Zurück zur Liste</button>`}</div>`;
  },

  vorgaben() {
    if (!S.vcat) {
      return `<div class="pagehead"><h1>Vorgaben</h1></div><div class="grid tgrid">${Object.keys(VORG).map(k => `<button class="vgtile" data-v="${esc(k)}"><h3>${esc(k)}</h3></button>`).join("")}</div>`;
    }
    const list = VORG[S.vcat] || [];
    return `<div class="crumb"><button data-go="vorgaben">Vorgaben</button><span>›</span><span>${esc(S.vcat)}</span></div>
    <div class="pagehead"><h1>${esc(S.vcat)}</h1></div>
    <div class="chips mob" role="group" aria-label="Vorgaben-Bereich">${Object.keys(VORG).map(k => `<button class="chip" aria-pressed="${S.vcat === k}" data-v="${esc(k)}">${esc(k)}</button>`).join("")}</div>
    <div class="vcols">${list.map(v => `<div class="vitem">${esc(v.t)}${v.h ? `<br><span class="meta">${esc(v.h)}</span>` : ""}</div>`).join("")}</div>`;
  },

  proben() {
    const l = probenLesen().slice().sort((a, b) => String(b.datum).localeCompare(String(a.datum)));
    return `<div class="pagehead"><h1>Meine Proben</h1><p>Stell für deine nächste Probe Übungen zusammen und speichere sie. Die Vorgaben sind immer alle mit dabei.</p></div>
    <button class="tile pbneu" data-go="probeNeu"><h3>Neue Probe zusammenstellen</h3><p>Übungen auswählen und speichern</p></button>
    <h2 class="pbh">Gespeicherte Proben</h2>
    ${l.length ? `<div class="pblist">${l.map(p => `<button class="tile" data-probe="${esc(p.id)}"><h3>${esc(p.name)}</h3><p>${esc(datumDe(p.datum))} · ${p.ids.filter(id => ITEMS.some(i => i.id === id)).length} Übungen</p></button>`).join("")}</div>` : `<div class="empty">Noch keine Probe gespeichert.</div>`}
    <p class="note">Deine Proben werden nur auf diesem Gerät gespeichert.</p>`;
  },

  probeNeu() {
    if (!S.pb) S.pb = { step: 1, sel: [], name: "", edit: null, q: "" };
    const b = S.pb, sel = new Set(b.sel);
    if (b.step === 2) {
      const l = ITEMS.filter(i => sel.has(i.id));
      return `<div class="pagehead"><h1>Probe speichern</h1></div>
      <div class="field"><label for="pbname">Name der Probe</label><input id="pbname" value="${esc(b.name || ("Probe am " + datumDe(heuteIso())))}" maxlength="60" autocomplete="off"></div>
      <h2 class="pbh">${l.length} ${l.length === 1 ? "Übung" : "Übungen"}</h2>
      <ul class="pbsum">${l.map(i => `<li>${esc(i.title)}</li>`).join("")}</ul>
      <div class="row pbrow2"><button class="btn" data-pb-zurueck="1">← Übungen ändern</button><button class="btn red" data-pb-speichern="1">Speichern</button></div>`;
    }
    const q = (b.q || "").toLowerCase();
    const gr = CATS.map(c => {
      const l = ITEMS.filter(i => i.cat === c.id && !i.draft);
      if (!l.length) return "";
      const n = l.filter(i => sel.has(i.id)).length;
      return `<details class="pbgrp" data-pbg="${esc(c.id)}"${q ? " open" : ""}><summary>${esc(c.name)} <span class="meta" data-pbc="${esc(c.id)}">${n} von ${l.length}</span></summary>
        <label class="pbrow"><input type="checkbox" data-pb-all="${esc(c.id)}"${n === l.length ? " checked" : ""}> <b>Alle auswählen</b></label>
        ${l.map(i => `<label class="pbrow" data-t="${esc(i.title.toLowerCase())}"><input type="checkbox" data-pb="${esc(i.id)}"${sel.has(i.id) ? " checked" : ""}> <span>${esc(i.title)}${i.level ? ` <span class="meta">${esc(i.level)}</span>` : ""}</span></label>`).join("")}
      </details>`;
    }).join("");
    return `<div class="pagehead"><h1>${b.edit ? "Übungen ändern" : "Übungen auswählen"}</h1><p>Wähle die Übungen für deine Probe aus. Die Vorgaben sind immer alle dabei.</p></div>
    <div class="field"><input id="pbq" type="search" placeholder="Übung suchen …" value="${esc(b.q || "")}" autocomplete="off"></div>
    <div id="pbliste">${gr}</div>
    <div class="pbbar"><span id="pbN">${sel.size} ausgewählt</span><button class="btn red" id="pbWeiter" data-pb-weiter="1"${sel.size ? "" : " disabled"}>Weiter</button></div>`;
  },

  probe() {
    const p = probenLesen().find(x => x.id === S.pid);
    if (!p) return `<div class="pagehead"><h1>Diese Probe gibt es nicht</h1><p>Proben werden nur auf dem Gerät gespeichert, auf dem sie erstellt wurden.</p></div><div class="row"><button class="btn red" data-go="proben">Meine Proben</button></div>`;
    const l = p.ids.map(id => ITEMS.find(i => i.id === id)).filter(Boolean);
    return `<div class="crumb"><button data-go="proben">Meine Proben</button><span>›</span><span>${esc(p.name)}</span></div>
    <div class="pagehead"><h1>${esc(p.name)}</h1><p>${esc(datumDe(p.datum))} · ${l.length} ${l.length === 1 ? "Übung" : "Übungen"}</p></div>
    <div class="grid tgrid pgrid">${l.map(i => { const c = catOf(i.cat); return `<button class="vgtile" data-item="${esc(i.id)}" data-von="${esc(p.id)}"><h3>${esc(i.title)}</h3>${c ? `<span class="meta">${esc(c.name)}</span>` : ""}</button>`; }).join("")}</div>
    <button class="tile pbvorg" data-go="vorgaben"><h3>Vorgaben</h3><p>Orte, Gefühle, Berufe und mehr. Alle sind immer dabei.</p></button>
    <div class="row"><button class="btn" data-probe-edit="${esc(p.id)}">Übungen ändern</button><button class="btn del" data-probe-del="${esc(p.id)}">Probe löschen</button></div>`;
  },

  kontakt() {
    if (S.kSent) return `<div class="pagehead"><h1>Danke!</h1><p>Deine Nachricht ist angekommen. Ich melde mich so schnell wie möglich.</p></div><button class="btn red" data-kneu="1">Neue Nachricht schreiben</button>`;
    return `<div class="pagehead"><h1>Kontakt</h1><p>Schreib mir eine Nachricht. Felder mit * sind Pflichtfelder.</p></div>
    <form id="kf" novalidate>
      <div class="row2">
        <div class="field"><label for="k-vn">Vorname *</label><input id="k-vn" autocomplete="given-name"></div>
        <div class="field"><label for="k-nn">Nachname</label><input id="k-nn" autocomplete="family-name"></div>
      </div>
      <div class="field"><label for="k-mail">E-Mail *</label><input id="k-mail" type="email" autocomplete="email"></div>
      <div class="field"><label for="k-tel">Handynummer</label><input id="k-tel" type="tel" autocomplete="tel"></div>
      <div class="field"><label for="k-betreff">Betreff *</label><input id="k-betreff"></div>
      <div class="field"><label for="k-text">Nachricht * <small>(mindestens 20 Zeichen)</small></label><textarea id="k-text"></textarea></div>
      <p class="err" id="k-err" hidden></p>
      <button class="btn red block" type="submit">Nachricht senden</button>
    </form>`;
  },

  alle() {
    const q = (S.aq || "").toLowerCase();
    const l = ITEMS.filter(i => (S.level === "alle" || i.level === S.level) && (i.title + " " + i.ab + " " + i.cat).toLowerCase().includes(q));
    return `<div class="pagehead"><h1>Alle Übungen</h1><p>${l.length} von ${ITEMS.length} Übungen</p></div>
    ${levelChips()}
    <div class="list">${l.length ? l.map(card).join("") : '<div class="empty">Keine Übung gefunden.</div>'}</div>`;
  },

  suche() {
    if (!S.q) return `<div class="pagehead"><h1>Suche</h1><p>Gib oben einen Suchbegriff ein, um Übungen und Vorgaben zu finden.</p></div><div class="row"><button class="btn" data-go="alle">Alle Übungen ansehen</button></div>`;
    const q = S.q.toLowerCase();
    const l = ITEMS.filter(i => (i.title + " " + i.ab).toLowerCase().includes(q));
    const vs = Object.entries(VORG).flatMap(([k, a]) => a.filter(v => v.t.toLowerCase().includes(q)).map(v => [k, v.t]));
    return `<div class="pagehead"><h1>Suche: „${esc(S.q)}“</h1><p>${l.length} Übungen · ${vs.length} Vorgaben</p></div>
    <div class="list">${l.length ? l.map(card).join("") : '<div class="empty">Nichts gefunden. Vielleicht magst du es einreichen?</div>'}</div>
    ${vs.length ? `<h2>Vorgaben</h2><div class="taglist">${vs.map(([k, t]) => `<span><span class="meta">${esc(k)}</span> ${esc(t)}</span>`).join("")}</div>` : ""}`;
  },

  nichtda() {
    return `<div class="pagehead"><h1>Diese Seite gibt es nicht</h1><p>Vielleicht wurde die Übung umbenannt oder entfernt. Hier geht es weiter:</p></div><div class="row"><button class="btn red" data-go="start">Zur Startseite</button><button class="btn" data-go="kats">Alle Übungen</button><button class="btn" data-go="vorgaben">Vorgaben</button></div>`;
  },

  wuerfel() {
    return `<div class="pagehead"><h1>Szenenwürfel</h1><p>Würfle eine zufällige Kombination aus Ort, Beziehung, Gefühl und Tätigkeit.</p></div>${genHTML()}`;
  },

  impro() { return "<div class=\"pagehead\"><h1>Was ist eigentlich Impro?</h1></div><div class=\"prose\"><p>Improvisationstheater, kurz Improtheater, ist eine Form des Theaters, bei der nichts vorher geprobt wird. Die Szenen entstehen spontan auf der Bühne. Meist bekommen die Spielenden einen Vorschlag aus dem Publikum, zum Beispiel einen Ort, eine Beziehung oder ein Gefühl. Dieser Vorschlag ist der Ausgangspunkt für die Szenen. Oft begleitet eine Musikerin oder ein Musiker das Spiel, und die Musik entsteht ebenfalls improvisiert.</p><p><strong>Wie entstehen Geschichten?</strong><br>Gute Szenen entstehen aus dem Zuhören und Aufeinander-Reagieren. Die Spielenden lassen sich gegenseitig inspirieren, statt einem Plan zu folgen. Dafür braucht es Mut zum Scheitern, Präsenz im Moment und die Bereitschaft, die eigene Rolle immer wieder neu zu finden.</p><p><strong>Formen des Improvisationstheaters</strong><br>Man unterscheidet Kurzformen und Langformen. Kurzformen bestehen aus kleinen Szenen von wenigen Minuten, die oft als Spiele aufgebaut sind. Dazu gehört der Theatersport, bei dem zwei Mannschaften gegeneinander antreten und das Publikum entscheidet, wer gewinnt. Langformen dauern mindestens 15 bis 20 Minuten. Ein bekanntes Beispiel ist der Harold: Aus einem Thema aus dem Publikum entsteht eine verwobene Collage aus mehreren Szenen mit vielschichtigen Figuren. Langformen wirken oft ernsthafter, humorvolle Momente sind aber erlaubt.</p><p><strong>Herkunft</strong><br>Die Wurzeln reichen bis in die Commedia dell'Arte und das antike Theater zurück. Das moderne Improvisationstheater entstand im 20. Jahrhundert, unter anderem durch die Studentengruppe „The Compass“ in Chicago und durch Keith Johnstone, der das Theatersport-Konzept entwickelte. In Deutschland begann die Szene vor rund 25 Jahren.</p><p><strong>Impro als Lebenshaltung</strong><br>Viele Spielende sehen im Improtheater mehr als ein Hobby. Die Haltung dahinter, also Offenheit, Neugier und ein entspannter Umgang mit Fehlern, wirkt oft auch im Alltag.</p><p><strong>Mitmachen</strong><br>Wer anfangen möchte, findet in Workshops den besten Einstieg. Im improwiki gibt es über 756 Spiele und Übungen, dazu ein Gruppenverzeichnis und einen Terminkalender: improwiki.com/de/wiki</p></div>"; },
  ueber() {
    const links = [
      ["Was ist der Impro-Fundus?", "Der Impro-Fundus ist eine Sammlung von Übungen, Spielen und Vorgaben für Improtheater. Alles ist nach Kategorien geordnet, damit du schnell findest, was du für deine Probe oder deinen Workshop brauchst."],
      ["Was kostet die Nutzung?", "Nichts. Der Impro-Fundus ist kostenlos und ohne Anmeldung nutzbar. Er freut sich aber über jede Spende, damit er auch weiterhin werbefrei bleiben kann.", true],
      ["Gibt es Werbung?", "Nein. Auf dieser Seite gibt es keine Werbung. Damit das so bleibt, freut sich der Fundus über jede Spende.", true],
      ["Wer steckt hinter dem Fundus?", "Ich bin Leon. Ich spiele seit über 20 Jahren Theater und seit über 10 Jahren Improvisationstheater. Außerdem leite ich eine Improvisationstheatergruppe im Theater Brand in Aachen-Brand. Den Fundus habe ich aus Freude am Impro-Theater aufgebaut, damit alle Impro-Begeisterten und alle, die es noch werden wollen, davon profitieren können."],
      ["Für wen ist die Seite gedacht?", "Für alle, die Improtheater spielen: Anfängerinnen und Anfänger, erfahrene Spielerinnen und Spieler, Gruppenleitungen, Workshop-Leitungen und Lehrende."],
      ["Möchtest du den Fundus finanziell unterstützen?", "Das freut mich sehr. Der Fundus ist kostenlos, aber Domain, Hosting und neue Inhalte kosten Zeit und Geld. Die Spendenmöglichkeit wird noch eingerichtet.", true],
      ["Hast du Lust, beim Fundus mitzuarbeiten?", "Sehr gern. Du kannst Übungen und Vorgaben einreichen, Fehler melden oder Ideen für neue Inhalte schicken. Auch beim Prüfen, Schreiben oder Gestalten bin ich dankbar für Unterstützung. Kontaktiere mich einfach. Das geht über das Formular unter {{KONTAKT}}."]
    ];
    const rechts = [
      ["Was passiert mit meinen eingereichten Übungen und Vorschlägen?", "Jeder Vorschlag wird von mir gelesen und geprüft. Passt er zum Fundus, wird er veröffentlicht oder vorher überarbeitet. Nicht jeder Vorschlag wird übernommen."],
      ["Bekomme ich eine Rückmeldung zu meinen Vorschlägen?", "Ja, wenn du in deiner Nachricht eine Mailadresse oder deinen Namen angibst, melde ich mich bei dir, sobald dein Vorschlag geprüft ist."],
      ["Kann ich mit meinem Namen genannt werden oder bleibe ich anonym?", "Beides ist möglich. Wenn du möchtest, nenne ich dich bei der Veröffentlichung mit deinem Vornamen. Ohne Angabe bleibt dein Beitrag anonym."],
      ["Wohin wende ich mich bei Fragen, Fehlern oder anderen Anliegen?", "Am besten über das Formular unter {{KONTAKT}}. Schreib dazu, worum es geht. Wenn du einen Fehler gefunden hast, nenne bitte die Seite, auf der du ihn gesehen hast."],
      ["Welche Daten werden gespeichert, wenn ich etwas einreiche?", "Wenn du einen Vorschlag absendest, wird er direkt aus dem Formular an mich geschickt. Mehr dazu steht in der Datenschutzerklärung.", "datenschutz"],
      ["Wer darf Inhalte veröffentlichen oder ändern?", "Nur ich. Eingereichte Vorschläge übernehme ich erst nach Prüfung."]
    ];
    const faq = (f) => `<details class="faq"><summary>${esc(f[0])}</summary><div class="faqa"><p>${esc(f[1]).replace("{{KONTAKT}}", '<button class="linkbtn" data-go="kontakt">Kontakt</button>')}</p>${f[2] === true ? `<p><button class="linkbtn" data-go="spenden">Zur Unterstützung</button></p>` : typeof f[2] === "string" ? `<p><button class="linkbtn" data-go="${esc(f[2])}">Zur Datenschutzerklärung</button></p>` : ""}</div></details>`;
    return `<div class="pagehead"><h1>Alles über den Fundus</h1></div>
      <div class="prose"><p>Der Impro-Fundus ist eine kostenlose, werbefreie Sammlung für alle, die Improtheater spielen. Hier findest du Warm-ups, Übungen, Szenenspiele und Vorgaben, nach Kategorien geordnet. Du kannst eigene Ideen einreichen und die Seite unterstützen.</p></div>
      <div class="faqwrap"><div class="faqcol">${links.map(faq).join("")}</div><div class="faqcol">${rechts.map(faq).join("")}</div></div>`;
  },
  impressum() { return "<div class=\"pagehead\"><h1>Impressum</h1></div><div class=\"prose\"><p>Angaben gemäß § 5 DDG</p><p>Leon E.<br>Marktplatz 13<br>52078 Aachen<br>Deutschland</p><p>Kontakt: leon@impro-fundus.de</p><p>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: Leon E.</p><p>Der Impro-Fundus ist ein privates, nicht kommerzielles Angebot. Es gibt keinen Shop, keine Anmeldung für Besucher und keine Verträge. Die Nutzung ist kostenlos.</p><p><strong>Haftung für Inhalte</strong><br>Die Inhalte werden sorgfältig erstellt. Für Vollständigkeit, Richtigkeit und Aktualität wird keine Gewähr übernommen. Verpflichtungen zur Entfernung oder Sperrung von Informationen nach den allgemeinen Gesetzen bleiben unberührt.</p><p><strong>Haftung für Links</strong><br>Die Seite enthält Links zu fremden Websites. Für deren Inhalte ist der jeweilige Anbieter verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar. Bei Hinweisen auf Verstöße wird der Link entfernt.</p><p><strong>Urheberrecht</strong><br>Die Texte und die Gestaltung dieser Seite sind urheberrechtlich geschützt. Die Nutzungsbedingungen regeln, wie Inhalte verwendet werden dürfen.</p><p><strong>Verbraucherstreitbeilegung</strong><br>Der Betreiber ist nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p><p>Stand: 8. November 2026</p></div>"; },
  datenschutz() { return "<div class=\"pagehead\"><h1>Datenschutz</h1></div><div class=\"prose\"><p><strong>Verantwortlich</strong><br>Leon E., Marktplatz 13, 52078 Aachen, leon@impro-fundus.de</p><p><strong>Hosting</strong><br>Die Seite wird über GitHub Pages bereitgestellt (GitHub Inc., USA). Beim Aufruf verarbeitet der Anbieter technisch notwendige Daten wie IP-Adresse, Zeitpunkt und aufgerufene Seite, um die Seite auszuliefern. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem stabilen Betrieb). Informationen: https://docs.github.com/site-policy/privacy-policies/github-privacy-statement</p><p><strong>Inhalte aus der Google-Tabelle</strong><br>Übungen und Vorgaben werden über ein Google Apps Script geladen, das auf eine Google-Tabelle zugreift. Dabei wird die IP-Adresse an Google übertragen. Personenbezogene Daten werden dabei nicht gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.</p><p><strong>Kontaktformular und Vorschläge</strong><br>Beim Absenden werden deine Angaben über das Google Apps Script des Fundus an die E-Mail-Adresse des Betreibers geschickt (dabei wird deine IP-Adresse an Google übertragen). Sie werden nicht auf der Website gespeichert. Name und Mailadresse bei Vorschlägen sind freiwillig; im Kontaktformular brauchen wir die Adresse, um zu antworten. Für die E-Mail-Dienste wird ein Dienstleister eingesetzt. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Bearbeitung deiner Anfrage) bzw. lit. a DSGVO (Einwilligung bei Vorschlägen).</p><p><strong>Spenden</strong><br>Wenn du auf den PayPal-Knopf klickst, verlässt du diese Seite. Ab dann gelten die Datenschutzbestimmungen von PayPal. Auf dieser Website werden dazu keine Daten gespeichert.</p><p><strong>Google Fonts</strong><br>Die Schrift Caveat wird von Google geladen. Dabei wird deine IP-Adresse an Google übertragen. Informationen: https://policies.google.com/privacy</p><p><strong>Reichweitenmessung</strong><br>Um zu sehen, wie oft der Fundus genutzt wird, wird bei jedem Seitenaufruf nur die aufgerufene Seite und das Datum gezählt (über das Google Apps Script des Fundus). Dabei werden keine Cookies gesetzt, keine IP-Adressen und keine Kennungen gespeichert, und Besucher werden nicht wiedererkannt. Wie beim Laden der Inhalte wird deine IP-Adresse technisch an Google übertragen, von uns aber nicht gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, die Nutzung des Angebots zu verstehen).</p><p><strong>Cookies und Tracking</strong><br>Die Seite setzt keine Cookies und bindet keine Analyse- oder Werbedienste von Dritten ein.</p><p><strong>Deine Rechte</strong><br>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15 bis 21 DSGVO). Wende dich dafür an leon@impro-fundus.de. Beschwerden kannst du bei der Landesbeauftragten für Datenschutz und Informationsfreiheit Nordrhein-Westfalen einreichen (ldi.nrw.de).</p><p>Stand: 10. November 2026</p></div>"; },
  nutzung() { return "<div class=\"pagehead\"><h1>Nutzungsbedingungen</h1></div><div class=\"prose\"><p><strong>1. Geltungsbereich</strong><br>Diese Bedingungen gelten für die Nutzung der Website impro-fundus.de.</p><p><strong>2. Kostenlose Nutzung</strong><br>Die Übungen, Spiele und Vorgaben sowie die App dürfen kostenlos genutzt werden, zum Beispiel in Gruppen, Workshops und Proben. Auch der PDF-Export ist kostenlos.</p><p><strong>3. Keine kommerzielle Nutzung</strong><br>Die Inhalte dürfen nicht verkauft und nicht zu kommerziellen Zwecken verwendet werden.</p><p><strong>4. Eingereichte Vorschläge</strong><br>Mit dem Einreichen eines Vorschlags erlaubst du dem Betreiber, ihn zu überarbeiten, unverändert oder verändert zu übernehmen und zu veröffentlichen. Der Betreiber ist nicht verpflichtet, Vorschläge zu veröffentlichen. Dein Name wird nur genannt, wenn du dem im Formular zustimmst.</p><p><strong>5. Verantwortung beim Spielen</strong><br>Impro ist körperliche und emotionale Aktivität. Übungen werden auf eigene Verantwortung durchgeführt. Gruppenleitungen achten auf die Sicherheit und das Wohlbefinden der Teilnehmenden.</p><p><strong>6. Änderungen</strong><br>Der Betreiber kann Inhalte und diese Bedingungen jederzeit ändern.</p><p><strong>7. Anwendbares Recht</strong><br>Es gilt deutsches Recht.</p><p><strong>Kontakt</strong><br>leon@impro-fundus.de</p><p>Stand: 8. November 2026</p></div>"; },

  einreichen() {
    if (S.sent) return `<div class="pagehead"><h1>Danke für deinen Vorschlag!</h1></div><div class="notice"><strong>Dein Vorschlag ist angekommen.</strong><span>Ich lese ihn und melde mich, wenn du eine Mailadresse angegeben hast.</span></div><div class="row"><button class="btn" data-again>Noch etwas einreichen</button></div>`;
    const opts = CATS.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
    const vopts = Object.keys(VORG).map(k => `<option>${esc(k)}</option>`).join("");
    const offen = false;
    return `<div class="pagehead"><h1>Vorschlag einreichen</h1></div>
    ${offen ? '<div class="note">Das Einreichen ist gerade noch nicht eingerichtet.</div>' : ""}
    <form id="f" novalidate>
     <div class="field"><label for="f-kind">Was möchtest du einreichen?</label><select id="f-kind"><option>Übung</option><option>Vorgabe</option><option>Zitat</option></select></div>
     <div class="field"><label for="f-title" id="l-title">Name</label><input id="f-title" placeholder="z. B. Gefühls-Staffel"></div>
     <div class="field" id="wrap-cat"><label for="f-cat">Bereich</label><select id="f-cat">${opts}</select></div>
     <div class="field" id="wrap-vcat" hidden><label for="f-vcat">Art der Vorgabe</label><select id="f-vcat">${vopts}</select></div>
     <div class="field"><label for="f-text" id="l-text">Beschreibung und Ablauf</label><textarea id="f-text" placeholder="Wie läuft es ab? Was ist die Regel?"></textarea></div>
     <div class="two" id="wrap-meta"><div class="field"><label for="f-players">Anzahl Personen</label><input id="f-players" placeholder="z. B. 2–4"></div><div class="field"><label for="f-level">Niveau</label><select id="f-level"><option>Einsteiger</option><option>Fortgeschritten</option></select></div></div>
     <div class="two"><div class="field"><label for="f-name">Dein Name <small>(freiwillig)</small></label><input id="f-name"></div><div class="field"><label for="f-mail">E-Mail für Rückfragen <small>(freiwillig)</small></label><input id="f-mail" type="email"></div></div>
     <label class="check"><input type="checkbox" id="f-namepub"><span>Mein Name darf bei der Veröffentlichung genannt werden.</span></label>
     <label class="check"><input type="checkbox" id="f-ok"><span>Ich bin einverstanden, dass mein Vorschlag auf der Website veröffentlicht werden darf.</span></label>
     <input type="text" id="f-web" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
     <p class="err" id="f-err" hidden></p>
     <button class="btn red" type="submit" ${offen ? "disabled" : ""}>Vorschlag absenden</button>
    </form>`;
  },

  spenden() {
    const sp = S.sp;
    const schritte = ["Deine Spende", "Deine Angaben", "Zahlungsart", "Prüfen und spenden"];
    const kopf = `<ol class="spsteps">${schritte.map((t, i) => `<li class="${i + 1 < sp.step ? "done" : i + 1 === sp.step ? "on" : ""}"><span>${i + 1 < sp.step ? "✓" : i + 1}</span>${t}</li>`).join("")}</ol>`;
    const zweckName = sp.zweck === "gruppe" ? "Impro-Gruppe des Theater Brand" : "Impro-Fundus";
    let body = "";
    if (sp.danke) {
      body = `<div class="notice"><strong>Danke für deine Unterstützung!</strong><span>PayPal hat sich in einem neuen Fenster geöffnet. Dort ist ${euro(sp.betrag)} schon eingetragen. Schließe die Zahlung dort ab.</span>${sp.zweck === "gruppe" ? '<span>Schreib bei PayPal als Mitteilung bitte „Theatergruppe“, damit die Spende richtig ankommt.</span>' : ""}<div class="row"><a class="btn red" href="${spLink()}" target="_blank" rel="noopener">PayPal erneut öffnen</a><button class="btn" data-sp-neu>Neue Spende</button></div></div>`;
    } else if (sp.step === 1) {
      body = `<h2>Wofür möchtest du spenden?</h2>
        <div class="chips" role="group" aria-label="Zweck"><button class="chip" data-sp-zweck="fundus" aria-pressed="${sp.zweck === "fundus"}">Impro-Fundus</button><button class="chip" data-sp-zweck="gruppe" aria-pressed="${sp.zweck === "gruppe"}">Impro-Gruppe des Theater Brand</button></div>
        <h2>Wie viel möchtest du geben?</h2>
        <div class="chips" role="group" aria-label="Betrag">${[5, 10, 15, 25, 50].map(b => `<button class="chip" data-sp-betrag="${b}" aria-pressed="${sp.betrag === b}">${b} €</button>`).join("")}</div>
        <div class="field spbetrag"><label for="spN">Oder gib einen eigenen Betrag ein (in Euro)</label><input id="spN" type="number" inputmode="decimal" min="1" max="10000" step="1" placeholder="z. B. 30" value="${[5, 10, 15, 25, 50].includes(sp.betrag) ? "" : sp.betrag}"></div>
        <p class="meta">Einmalige Spende über PayPal. Der Fundus ist kein eingetragener Verein, deshalb gibt es keine Spendenquittung.</p>
        <div class="row"><button class="btn red" data-sp-step="2">Weiter →</button></div>`;
    } else if (sp.step === 2) {
      body = `<p>Alle Angaben sind freiwillig. Lass die Felder leer, wenn du anonym spenden möchtest. Wenn du Namen und E-Mail angibst, kann ich mich bei dir bedanken.</p>
        <div class="spform"><div class="field"><label for="spName">Name <small>(freiwillig)</small></label><input id="spName" autocomplete="name" value="${esc(sp.name)}"></div>
        <div class="field"><label for="spMail">E-Mail <small>(freiwillig)</small></label><input id="spMail" type="email" autocomplete="email" value="${esc(sp.mail)}"></div>
        <div class="field"><label for="spText">Nachricht <small>(freiwillig)</small></label><textarea id="spText">${esc(sp.text)}</textarea></div></div>
        <p class="err" id="spErr" hidden></p>
        <div class="row"><button class="btn" data-sp-step="1">← Zurück</button><button class="btn red" data-sp-step="3">Weiter →</button></div>`;
    } else if (sp.step === 3) {
      body = `<h2>Zahlungsart</h2>
        <div class="chips" role="group" aria-label="Zahlungsart"><button class="chip" aria-pressed="true">PayPal</button></div>
        <p class="meta">Die Zahlung läuft sicher über PayPal. Auf dieser Website werden keine Konto- oder Kartendaten eingegeben oder gespeichert.</p>
        <div class="row"><button class="btn" data-sp-step="2">← Zurück</button><button class="btn red" data-sp-step="4">Weiter zur Prüfung →</button></div>`;
    } else {
      body = `<h2>Bitte prüfe deine Angaben</h2>
        <dl class="spsum"><dt>Betrag</dt><dd>${euro(sp.betrag)} (einmalig)</dd><dt>Für</dt><dd>${zweckName}</dd><dt>Name</dt><dd>${sp.name ? esc(sp.name) : "anonym"}</dd>${sp.mail ? `<dt>E-Mail</dt><dd>${esc(sp.mail)}</dd>` : ""}<dt>Zahlungsart</dt><dd>PayPal</dd></dl>
        ${sp.zweck === "gruppe" ? '<p class="meta">Schreib bei PayPal als Mitteilung bitte „Theatergruppe“.</p>' : ""}
        <div class="row"><button class="btn" data-sp-step="3">← Zurück</button><button class="btn red" data-sp-go>Jetzt mit PayPal spenden</button></div>`;
    }
    return `<div class="pagehead"><h1>Den Fundus unterstützen</h1><p>Der Impro-Fundus ist kostenlos und werbefrei. Mit einer Spende hilfst du, dass das so bleibt.</p></div>
      ${kopf}<section class="spbox">${body}</section>
      <details class="spinfo"><summary>Wofür wird die Spende verwendet?</summary><div class="prose"><ul><li>Domain und Hosting von impro-fundus.de</li><li>Den Fundus werbefrei halten</li><li>Kosten für neue Funktionen, zum Beispiel die Verwaltung der Admins</li><li>Fotos und Grafiken für die Seite</li><li>Materialien für Anfänger-Workshops</li><li>Einen Puffer für die jährliche Verlängerung der Domain</li><li>Ein neues Projekt, das gerade in Planung ist</li><li>Eine freie Spende ohne Zweck: Danke für die Arbeit</li></ul></div></details>
      <div class="prose"><p><strong>Spenden für die Improvisationstheatergruppe:</strong> Wenn du oben „Impro-Gruppe des Theater Brand“ wählst, kommt sie der Improvisationstheatergruppe des Theater Brand in Aachen-Brand zugute.</p></div>`;
  }
};

function sideHTML() {
  if (!LOADED) return "";
  const b = (on, attrs, label, extra = "") => `<button class="navbtn${on ? " on" : ""}" ${attrs}><span>${label}</span>${extra}</button>`;
  if (["kats", "kat", "item", "alle"].includes(S.view)) {
    const act = S.view === "item" ? ((ITEMS.find(x => x.id === S.id) || {}).cat) : S.cat;
    return sideTop() + `<div class="lbl">Übungen</div>` + CATS.map(c => b(act === c.id, `data-cat="${esc(c.id)}"`, esc(c.name), `<span class="count">${ITEMS.filter(i => i.cat === c.id).length}</span>`)).join("") + `<button class="sidechest" data-go="einreichen" data-kind="Übung" aria-label="Weitere Übungen einreichen"><img src="/kiste-neue-uebung.png" alt="Weitere Übungen einreichen"></button>`;
  }
  if (S.view === "vorgaben") {
    return `<div class="lbl">Vorgaben</div>` + Object.keys(VORG).map(k => b(S.vcat === k, `data-v="${esc(k)}"`, esc(k), `<span class="count">${VORG[k].length}</span>`)).join("") + `<button class="sidechest" data-go="einreichen" data-kind="Vorgabe" aria-label="Neue Vorgaben einreichen"><img src="/kiste-neue-vorgabe.png" alt="Neue Vorgaben einreichen"></button>`;
  }
  return "";
}

function topnavHTML() {
  const act = v => (S.view === v ? "on" : "");
  const ueAct = ["kats", "kat", "item"].includes(S.view) ? "on" : "";
  const ue = CATS.map(c => `<button data-cat="${esc(c.id)}">${esc(c.name)}</button>`).join("");
  const vo = Object.keys(VORG).map(k => `<button data-v="${esc(k)}">${esc(k)}</button>`).join("");
  return `<button class="${act("start")}" data-go="start">Start</button><div class="dd"><button class="${ueAct}" data-go="kats">Übungen ▾</button><div class="ddmenu">${ue}</div></div>`
    + `<div class="dd"><button class="${act("vorgaben")}" data-go="vorgaben">Vorgaben ▾</button><div class="ddmenu">${vo}</div></div>`
    + `<button class="${act("kontakt")}" data-go="kontakt">Kontakt</button>`
    + `<button class="${act("einreichen")}" data-go="einreichen">Eigene Idee einreichen</button>`;
}

const ZITATE = [
  { t: "Die ganze Welt ist eine Bühne, und alle Männer und Frauen nur Spieler.", a: "William Shakespeare, Wie es euch gefällt" },
  { t: "Versuch es. Scheitere. Scheitere besser.", a: "Samuel Beckett" },
  { t: "Der Mensch spielt nur, wo er in voller Bedeutung des Worts Mensch ist, und er ist nur da ganz Mensch, wo er spielt.", a: "Friedrich Schiller, Briefe über die ästhetische Erziehung" }
];
const zitatHeute = () => {
  const d = new Date();
  const tag = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const l = ZIT.length ? ZIT : ZITATE;
  return l[tag % l.length];
};

const footHTML = () => `<footer class="foot"><button data-go="ueber">Alles über den Fundus</button><button data-go="spenden">Fundus unterstützen</button><button data-go="impressum">Impressum</button><button data-go="datenschutz">Datenschutz</button><button data-go="nutzung">Nutzungsbedingungen</button></footer>`;

// Verlinkt Namen aus dem Fundus (Kategorien, Vorgaben, Übungen) und den Theater Brand im sichtbaren Text
function linkify(root) {
  const c = [{ t: "Theater Brand", href: CONFIG.THEATER_BRAND_URL }];
  CATS.forEach(x => c.push({ t: x.name, key: "cat", val: x.id }));
  Object.keys(VORG).forEach(k => c.push({ t: k, key: "v", val: k }));
  ITEMS.filter(i => i.ab && i.title && i.title.length >= 4 && !(S.view === "item" && i.id === S.id))
    .forEach(i => c.push({ t: i.title, key: "item", val: i.id }));
  c.sort((a, b) => b.t.length - a.t.length);
  const map = new Map(c.map(x => [x.t, x]));
  const re = new RegExp("(?<!\\p{L})(" + c.map(x => x.t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(?!\\p{L})", "gu");
  const skip = "a,button,h1,h2,h3,h4,script,style,textarea,input,select,option,label,.crumb";
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => {
    if (!n.parentElement || n.parentElement.closest(skip)) return;
    const parts = n.textContent.split(re);
    if (parts.length < 2) return;
    const frag = document.createDocumentFragment();
    parts.forEach((p, idx) => {
      if (idx % 2 === 0) { if (p) frag.append(p); return; }
      const x = map.get(p);
      let el;
      if (x.href) { el = document.createElement("a"); el.href = x.href; el.target = "_blank"; el.rel = "noopener"; }
      else { el = document.createElement("button"); el.type = "button"; el.dataset[x.key] = x.val; }
      el.className = "linkbtn";
      el.textContent = p;
      frag.append(el);
    });
    n.parentNode.replaceChild(frag, n);
  });
}

function render() {
  const sh = sideHTML();
  $("#side").innerHTML = sh;
  $("#side").hidden = !sh;
  $("#topnav").innerHTML = topnavHTML();
  $("#drawer").innerHTML = navHTML();
  $("#bottom").innerHTML = bottomHTML();
  if (!LOADED) {
    if ($("#main").dataset.statisch) return;   /* die fertig gebaute Seite bleibt stehen, bis die Daten da sind */
    $("#main").innerHTML = `<div class="inner">${FEHLER ? `<div class="empty">${esc(FEHLER)}</div>` : '<div class="empty">Lade Übungen und Vorgaben …</div>'}</div>`;
    return;
  }
  const fn = V[S.view] || V.start;
  delete $("#main").dataset.statisch;
  $("#main").classList.toggle("home", S.view === "start");
  $("#main").innerHTML = `<div class="inner">${fn()}${footHTML()}</div>`;
  linkify($("#main"));
  $("#main").classList.toggle("withdice", false);
  document.querySelectorAll("#dicebar, .dbubble").forEach(x => x.remove());
  if (S.view !== "start") document.body.insertAdjacentHTML("beforeend", `<button class="dbubble${S.diceOpen ? " on" : ""}" data-dicedlg aria-label="${S.diceOpen ? "Szenenwürfel schließen" : "Szenenwürfel öffnen"}" aria-expanded="${!!S.diceOpen}" title="Szenenwürfel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none"/></svg></button>`);
  if (S.diceOpen && !$("#dlg").hidden) $("#dlgBox").innerHTML = dicePop();
  document.body.classList.toggle("diceopen", !!S.diceOpen);
  document.body.classList.toggle("probemodus", inProbe());
  kopfHoehe();
  if (S.view === "einreichen" && !S.sent) bindForm();
  seiteAktualisieren();
  zaehlen();
  window.FERTIG = true;
}

function bindForm() {
  const k = $("#f-kind");
  if (S.kind) { k.value = S.kind; S.kind = null; }
  const sync = () => {
    const v = k.value === "Vorgabe", z = k.value === "Zitat";
    $("#wrap-cat").hidden = v || z; $("#wrap-meta").hidden = v || z; $("#wrap-vcat").hidden = !v;
    $("#l-title").innerHTML = z ? "Von wem stammt das Zitat? <small>(freiwillig)</small>" : "Name";
    $("#f-title").placeholder = z ? "z. B. Keith Johnstone" : "z. B. Gefühls-Staffel";
    $("#l-text").textContent = z ? "Das Zitat" : "Beschreibung und Ablauf";
    $("#f-text").placeholder = z ? "Das Zitat, möglichst wortgetreu" : "Wie läuft es ab? Was ist die Regel?";
  };
  k.onchange = sync; sync();
  const f = $("#f");
  if (!f) return;
  f.onsubmit = async e => {
    e.preventDefault();
    const t = $("#f-title").value.trim(), x = $("#f-text").value.trim(), err = $("#f-err");
    const show = m => { err.textContent = m; err.hidden = false; };
    const istZitat = k.value === "Zitat";
    if (istZitat ? !x : (!t || !x)) return show(istZitat ? "Bitte gib das Zitat ein." : "Bitte gib einen Namen und eine Beschreibung ein.");
    if (!$("#f-ok").checked) return show("Bitte bestätige, dass der Vorschlag veröffentlicht werden darf.");
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true; err.hidden = true;
    try {
      const r = await apiPost({
        action: "idee", art: k.value, titel: t, text: x,
        kat: istZitat ? "" : k.value === "Vorgabe" ? $("#f-vcat").value : $("#f-cat").value,
        tn: $("#f-players").value.trim(), level: $("#f-level").value,
        nameNennen: !!($("#f-namepub") && $("#f-namepub").checked),
        name: $("#f-name").value.trim(), mail: $("#f-mail").value.trim(), web: $("#f-web").value
      });
      if (!r.ok) { btn.disabled = false; return show(r.msg || "Der Vorschlag konnte nicht gesendet werden."); }
      S.sent = true; render();
    } catch (ex) {
      btn.disabled = false;
      show("Der Vorschlag konnte gerade nicht gesendet werden. Bitte versuche es später noch einmal. (Technische Meldung: " + (ex && ex.message ? ex.message : ex) + ")");
    }
  };
}

document.addEventListener("click", e => {
  if (e.target.closest("#menuBtn")) { openDrawer(); return; }
  if (e.target.id === "dlg") { closeDlg(); return; }
  const t = e.target.closest("button, a[data-go], a[data-cat], a[data-item], a[data-v]");
  if (!t) return;
  if (t.tagName === "A") {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;   /* in neuem Tab öffnen: Browser machen lassen */
    e.preventDefault();
  }
  const d = t.dataset;
  if (d.dlgClose !== undefined) { closeDlg(); return; }
  if (d.back !== undefined) { zurueck(); return; }
  if (t.closest("#drawer") && d.pdf !== undefined) closeDrawer();
  if (d.spZweck !== undefined) { S.sp.zweck = d.spZweck; render(); return; }
  if (d.spBetrag !== undefined) { spBetrag(d.spBetrag); render(); return; }
  if (d.spStep !== undefined) {
    spAngabenMerken();
    const z = Number(d.spStep);
    if (z === 3 && S.sp.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(S.sp.mail)) { const er = $("#spErr"); er.textContent = "Bitte prüfe deine E-Mail-Adresse oder lass das Feld leer."; er.hidden = false; return; }
    S.sp.step = z; render(); window.scrollTo(0, 0); return;
  }
  if (d.spNeu !== undefined) { S.sp = { step: 1, betrag: 10, zweck: S.sp.zweck, name: "", mail: "", text: "", danke: false }; render(); return; }
  if (d.spGo !== undefined) {
    window.open(spLink(), "_blank", "noopener");
    if (S.sp.name && S.sp.mail) {
      apiPost({ action: "kontakt", vorname: S.sp.name, nachname: "", mail: S.sp.mail, telefon: "", betreff: "Spende über PayPal: " + euro(S.sp.betrag),
        text: "Es wurde eine Spende über PayPal gestartet.\nBetrag: " + euro(S.sp.betrag) + "\nFür: " + (S.sp.zweck === "gruppe" ? "Impro-Gruppe des Theater Brand" : "Impro-Fundus") + (S.sp.text ? "\n\nNachricht:\n" + S.sp.text : "") }).catch(() => {});
    }
    S.sp.danke = true; render(); window.scrollTo(0, 0); return;
  }
  if (d.level !== undefined) { S.level = S.level === d.level ? "alle" : d.level; render(); return; }
  if (d.share !== undefined) { teilenOeffnen(d.share); return; }
  if (d.shArt !== undefined) { TEILEN.art = d.shArt; $("#dlgBox").innerHTML = teilenHTML(); return; }
  if (d.shDo !== undefined) { teilenTun(d.shDo); return; }
  if (d.pdf !== undefined) { pdfDialog(); return; }
  if (d.probe !== undefined) { go("probe", { pid: d.probe }); return; }
  if (d.probeBack !== undefined) { if (history.state && history.state.n > 0) history.back(); else go("probe", { pid: d.probeBack }); return; }
  if (d.probeEdit !== undefined) {
    const p = probenLesen().find(x => x.id === d.probeEdit); if (!p) return;
    S.pb = { step: 1, sel: p.ids.filter(id => ITEMS.some(i => i.id === id)), name: p.name, edit: p.id, q: "" };
    go("probeNeu"); return;
  }
  if (d.probeDel !== undefined) {
    const p = probenLesen().find(x => x.id === d.probeDel); if (!p) return;
    if (!confirm("Die Probe „" + p.name + "“ wirklich löschen?")) return;
    probenSchreiben(probenLesen().filter(x => x.id !== p.id)); go("proben", {}, true); return;
  }
  if (d.pbWeiter !== undefined) { if (S.pb && S.pb.sel.length) { S.pb.step = 2; render(); window.scrollTo(0, 0); } return; }
  if (d.pbZurueck !== undefined) { if (S.pb) { S.pb.name = ($("#pbname") || {}).value || S.pb.name; S.pb.step = 1; render(); window.scrollTo(0, 0); } return; }
  if (d.pbSpeichern !== undefined) { probeSpeichern(); return; }
  if (d.go) { if (d.kind) S.kind = d.kind; if (d.go === "probeNeu") S.pb = null; go(d.go); return; }
  if (d.cat !== undefined) { go("kat", { cat: d.cat }); return; }
  if (d.item) { go("item", { id: d.item, von: d.von || null }); return; }
  if (d.v) { go("vorgaben", { vcat: d.v, vprop: "alle" }); return; }
  if (d.vp) { S.vprop = d.vp; render(); return; }
  if (d.dicedlg !== undefined) {
    if (S.diceOpen) { closeDlg(); render(); return; }
    S.diceOpen = true; S.draw = S.draw || draw(); openDlg(dicePop()); render(); return;
  }
  if (d.dtog !== undefined) { S.dpick = S.dpick === +d.dtog ? null : +d.dtog; render(); return; }
  if (d.dset !== undefined) { const ks = diceKeys().slice(); ks[+d.dset] = d.val; S.dice = ks; S.dpick = null; S.draw = draw(); render(); return; }
  if (d.kneu !== undefined) { S.kSent = false; render(); return; }
  if (d.roll !== undefined) { S.draw = draw(); render(); return; }
  if (d.again !== undefined) { S.sent = false; render(); return; }
  if (d.quote !== undefined) {
    const ok = () => { t.title = "Kopiert"; t.classList.add("done"); setTimeout(() => { t.title = "Zitat kopieren"; t.classList.remove("done"); }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(t.dataset.txt).then(ok, () => { t.title = "Bitte markieren und kopieren"; });
    return;
  }
  if (d.copy !== undefined) {
    const txt = $("#iban").textContent;
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => $("#copied").textContent = "Kopiert", () => $("#copied").textContent = "Bitte markieren und kopieren");
    return;
  }
});
document.addEventListener("change", e => {
  if (e.target.classList && e.target.classList.contains("dsel")) {
    const ks = diceKeys().slice();
    ks[+e.target.dataset.die] = e.target.value;
    S.dice = ks;
    S.draw = draw();
    render();
    return;
  }
  if (e.target.id === "lvl") { S.level = e.target.value; render(); }
  if (e.target.id === "pp") { S.p = e.target.value; render(); }
});
document.addEventListener("focusin", e => {
  if (e.target.id === "allq" && S.view !== "alle") { go("alle"); $("#allq").focus(); }
});
document.addEventListener("input", e => {
  if (e.target.id !== "allq") return;
  S.aq = e.target.value;
  if (S.view === "alle") $("#main").innerHTML = `<div class="inner">${V.alle()}${footHTML()}</div>`;
});
document.addEventListener("submit", e => {
  if (e.target.id === "kf") { e.preventDefault(); kontaktSenden(); }
});
$("#scrim").onclick = closeDrawer;
/* Suche mit Vorschlägen: schon beim Tippen erscheint unter dem Suchfeld eine Auswahl */
const SG = { inp: null, idx: -1 };
const SG_MAX_UEB = 6, SG_MAX_VOR = 4;
function suggHl(t, q) {
  const i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return esc(t);
  return esc(t.slice(0, i)) + "<b>" + esc(t.slice(i, i + q.length)) + "</b>" + esc(t.slice(i + q.length));
}
function suggHide() { const b = $("#sugg"); if (b) b.hidden = true; SG.idx = -1; }
function suggZeigen(inp) {
  const q = inp.value.trim();
  S.q = q;
  if (!q) { suggHide(); return; }
  const ql = q.toLowerCase();
  const rang = i => { const t = i.title.toLowerCase(); return t.startsWith(ql) ? 0 : t.includes(ql) ? 1 : 2; };
  const ueb = ITEMS.filter(i => (i.title + " " + (i.ab || "")).toLowerCase().includes(ql)).sort((a, b) => rang(a) - rang(b));
  const vor = Object.entries(VORG).flatMap(([k, a]) => a.filter(v => v.t.toLowerCase().includes(ql)).map(v => [k, v.t]));
  let h = "";
  if (ueb.length) {
    h += `<div class="sh">Übungen</div>` + ueb.slice(0, SG_MAX_UEB).map(i => `<button type="button" data-sitem="${esc(i.id)}"><span class="st">${suggHl(i.title, q)}</span><span class="sm">${esc(katLabel(i.cat))}</span></button>`).join("");
  }
  if (vor.length) {
    h += `<div class="sh">Vorgaben</div>` + vor.slice(0, SG_MAX_VOR).map(([k, t]) => `<button type="button" data-svorg="${esc(k)}"><span class="st">${suggHl(t, q)}</span><span class="sm">${esc(k)}</span></button>`).join("");
  }
  if (!h) h = `<div class="sleer">Nichts gefunden.</div>`;
  else h += `<button type="button" class="sall" data-sall="1">Alle ${ueb.length + vor.length} Ergebnisse anzeigen</button>`;
  let box = $("#sugg");
  if (!box) { box = document.createElement("div"); box.id = "sugg"; box.setAttribute("role", "listbox"); document.body.appendChild(box); }
  box.innerHTML = h; SG.inp = inp; SG.idx = -1;
  const r = inp.getBoundingClientRect(), w = Math.min(Math.max(r.width, 280), 520);
  box.style.width = Math.min(w, innerWidth - 16) + "px";
  box.style.left = Math.max(8, Math.min(r.left, innerWidth - Math.min(w, innerWidth - 16) - 8)) + "px";
  box.style.top = (r.bottom + 6) + "px";
  box.hidden = false;
}
function suggWaehlen(b) {
  const d = b.dataset;
  const leeren = () => { S.q = ""; document.querySelectorAll(".qin,.dq").forEach(x => x.value = ""); suggHide(); };
  if (d.sitem) { leeren(); go("item", { id: d.sitem }); }
  else if (d.svorg) { leeren(); go("vorgaben", { vcat: d.svorg }); }
  else if (d.sall) { suggHide(); go("suche"); }
}
document.addEventListener("input", e => {
  const t = e.target;
  if (!t.classList || !(t.classList.contains("qin") || t.classList.contains("dq"))) return;
  if (S.view === "suche" && t.classList.contains("qin")) {
    S.q = t.value.trim();
    suggHide();
    if (S.q) go("suche"); else go("start");
    return;
  }
  suggZeigen(t);
});
document.addEventListener("keydown", e => {
  const t = e.target;
  if (!t.classList || !(t.classList.contains("qin") || t.classList.contains("dq"))) return;
  const box = $("#sugg"), offen = box && !box.hidden;
  const bs = offen ? [...box.querySelectorAll("button")] : [];
  if (e.key === "Escape") { suggHide(); return; }
  if (offen && (e.key === "ArrowDown" || e.key === "ArrowUp") && bs.length) {
    e.preventDefault();
    SG.idx = e.key === "ArrowDown" ? (SG.idx + 1) % bs.length : (SG.idx <= 0 ? bs.length - 1 : SG.idx - 1);
    bs.forEach((b, i) => b.classList.toggle("on", i === SG.idx));
    bs[SG.idx].scrollIntoView({ block: "nearest" });
    return;
  }
  if (e.key !== "Enter") return;
  if (offen && SG.idx >= 0 && bs[SG.idx]) { e.preventDefault(); suggWaehlen(bs[SG.idx]); return; }
  S.q = t.value.trim();
  suggHide();
  if (S.q && t.classList.contains("qin")) go("suche");
});
document.addEventListener("click", e => {
  const sb = e.target.closest("#sugg button");
  if (sb) { e.stopPropagation(); suggWaehlen(sb); return; }
  if (!e.target.closest("#sugg") && !e.target.closest(".qin,.dq")) suggHide();
}, true);
window.addEventListener("resize", suggHide);

/* ===== Besucherzähler: zählt nur, welche Seite aufgerufen wurde (ohne Cookies, ohne Kennung, ohne IP-Adresse) ===== */
let ZULETZT_GEZAEHLT = null;
function zaehlen() {
  if (S.view === "nichtda") return;
  const pfad = pfadFuer().split("?")[0].replace(/^\/proben\/(?!neu\/)[^/]+\/$/, "/proben/probe/");
  if (pfad === ZULETZT_GEZAEHLT) return;
  const art = ZULETZT_GEZAEHLT === null ? "besuch" : "aufruf";
  ZULETZT_GEZAEHLT = pfad;
  try {
    if (!/(^|\.)impro-fundus\.de$/.test(location.hostname)) return;   /* Tests und Vorschauen nicht mitzählen */
    if (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless/i.test(navigator.userAgent)) return;
    if (localStorage.getItem("fundus-nicht-zaehlen")) return;   /* gesetzt, wenn man in der Verwaltung angemeldet war */
    fetch(CONFIG.API, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "zaehle", pfad, art }) }).catch(() => {});
  } catch (e) {}
}

/* ===== Titel, Beschreibung und Seitenliste (auch für die fertig gebauten Seiten) ===== */
const kurz = (t, n) => {
  t = String(t || "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const c = t.slice(0, n - 1), l = c.lastIndexOf(" ");
  return (l > n * 0.6 ? c.slice(0, l) : c).replace(/[ ,;:.\-–]+$/, "") + "…";
};
function seiteInfo(s = S) {
  const N = "Impro-Fundus", offen = ITEMS.filter(i => !i.draft);
  let titel = N, beschr = "", robots = "index,follow,max-image-preview:large", krumen = null;
  const kr = (...l) => l.map(([name, pfad]) => ({ name, pfad }));
  const katen = CATS.map(c => c.name).join(", ");
  switch (s.view) {
    case "start":
      titel = "Impro-Fundus – Improtheater Übungen, Spiele und Vorgaben";
      beschr = "Impro-Fundus: kostenlose Sammlung mit Improtheater-Übungen, Warm-ups, Kennenlernspielen, Szenenspielen und Vorgaben. Zum Spielen, Üben und Anleiten von Impro-Gruppen."; break;
    case "kats":
      titel = "Improtheater-Übungen und Spiele – " + N;
      beschr = kurz(`${offen.length} Improtheater-Übungen mit Anleitung, sortiert nach Kategorien: ${katen}. Kostenlos für Proben, Workshops und Gruppen.`, 160);
      krumen = kr(["Übungen", "/uebungen/"]); break;
    case "kat": {
      const c = catOf(s.cat) || { name: "Übungen" }, l = offen.filter(i => i.cat === s.cat);
      titel = `${c.name} für Improtheater – ${N}`;
      beschr = kurz(`${l.length} ${c.name} für Improtheater mit Anleitung${l.length ? ": " + l.slice(0, 4).map(i => i.title).join(", ") + " und mehr" : ""}. Kostenlos im Impro-Fundus.`, 160);
      krumen = kr(["Übungen", "/uebungen/"], [c.name, pfadFuer(s)]); break;
    }
    case "item": {
      const i = ITEMS.find(x => x.id === s.id) || { title: "Übung", cat: "", ab: "" }, c = catOf(i.cat);
      titel = `${i.title} – Improtheater-Übung | ${N}`;
      const kopf = `${i.title} (${c ? c.name : "Übung"}${i.level ? ", " + i.level : ""}): `;
      beschr = i.ab ? kurz(kopf + i.ab, 160) : kurz(`Improtheater-Übung „${i.title}“ aus dem Impro-Fundus, Kategorie ${c ? c.name : "Übungen"}.`, 160);
      krumen = kr(["Übungen", "/uebungen/"], ...(c ? [[c.name, "/uebungen/" + slug(c.name) + "/"]] : []), [i.title, pfadFuer(s)]); break;
    }
    case "alle":
      titel = "Alle Improtheater-Übungen von A bis Z – " + N;
      beschr = kurz(`Alle ${offen.length} Übungen des Impro-Fundus auf einer Seite: Warm-ups, Kennenlernspiele, 2er-, 3er- und Gruppenübungen für Improtheater.`, 160); break;
    case "vorgaben":
      if (s.vcat) {
        const l = VORG[s.vcat] || [];
        titel = `Impro-Vorgaben: ${s.vcat} – ${N}`;
        beschr = kurz(`${l.length} Vorgaben zum Thema ${s.vcat} für Improtheater-Szenen${l.length ? ", zum Beispiel: " + l.slice(0, 3).map(v => "„" + v.t + "“").join(", ") : ""}.`, 160);
        krumen = kr(["Vorgaben", "/vorgaben/"], [s.vcat, pfadFuer(s)]);
      } else {
        titel = "Vorgaben für Improtheater-Szenen – " + N;
        beschr = kurz(`Vorgaben für Improtheater-Szenen: ${Object.keys(VORG).join(", ")}. Dazu ein Szenenwürfel, der Ort, Beziehung, Gefühl und Tätigkeit auswürfelt.`, 160);
        krumen = kr(["Vorgaben", "/vorgaben/"]);
      }
      break;
    case "impro": titel = "Was ist Improtheater? Eine kurze Einführung – " + N; beschr = "Was ist Improtheater? Eine kurze, verständliche Einführung in das Theater ohne Drehbuch: wie Szenen entstehen und worauf es beim Spielen ankommt."; break;
    case "ueber": titel = "Alles über den Impro-Fundus – häufige Fragen"; beschr = "Wer steckt hinter dem Impro-Fundus, was kostet er, wie kannst du Übungen einreichen und was passiert mit deinen Vorschlägen? Antworten auf häufige Fragen."; break;
    case "kontakt": titel = "Kontakt – " + N; beschr = "Schreib uns eine Nachricht: Fragen, Fehler, Ideen oder Feedback zum Impro-Fundus."; break;
    case "spenden": titel = "Den Impro-Fundus unterstützen – Spenden"; beschr = "Der Impro-Fundus ist kostenlos und werbefrei. Mit einer Spende hilfst du, Domain, Hosting und neue Inhalte zu finanzieren."; break;
    case "einreichen": titel = "Übung, Vorgabe oder Zitat einreichen – " + N; beschr = "Du kennst eine Improtheater-Übung, Vorgabe oder ein Zitat, das im Impro-Fundus noch fehlt? Reiche es hier ein."; break;
    case "impressum": titel = "Impressum – " + N; beschr = "Impressum und Anbieterkennzeichnung des Impro-Fundus."; break;
    case "datenschutz": titel = "Datenschutzerklärung – " + N; beschr = "Datenschutzerklärung des Impro-Fundus: Welche Daten beim Besuch und beim Einreichen von Vorschlägen verarbeitet werden."; break;
    case "nutzung": titel = "Nutzungsbedingungen – " + N; beschr = "Nutzungsbedingungen für die Website impro-fundus.de."; break;
    case "proben": titel = "Meine Proben – " + N; beschr = "Stelle Übungen für deine nächste Impro-Probe zusammen und speichere sie."; robots = "noindex,follow"; break;
    case "probeNeu": titel = "Neue Probe zusammenstellen – " + N; beschr = "Wähle die Übungen für deine nächste Impro-Probe aus."; robots = "noindex,follow"; break;
    case "probe": titel = "Probe – " + N; beschr = "Die Übungen deiner Probe."; robots = "noindex,follow"; break;
    case "suche": titel = (s.q ? `Suche: ${s.q} – ` : "Suche – ") + N; beschr = "Suche im Impro-Fundus nach Improtheater-Übungen und Vorgaben."; robots = "noindex,follow"; break;
    default: titel = "Seite nicht gefunden – " + N; beschr = "Diese Seite gibt es nicht."; robots = "noindex,follow";
  }
  let ld = null;
  if (s.view === "start") ld = { "@context": "https://schema.org", "@type": "WebSite", name: N, url: BASIS_URL + "/", inLanguage: "de", description: beschr };
  else if (krumen) ld = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ name: "Start", pfad: "/" }, ...krumen].map((k, n) => ({ "@type": "ListItem", position: n + 1, name: k.name, item: BASIS_URL + k.pfad })) };
  return { titel, beschr, robots, canonical: BASIS_URL + pfadFuer(s), ld };
}
function seiteAktualisieren() {
  if (!LOADED && S.view !== "start" && WARTET) return;
  const i = seiteInfo();
  document.title = i.titel;
  const meta = (sel, tag, attr, val, content) => {
    let el = document.head.querySelector(sel);
    if (!el) { el = document.createElement(tag); el.setAttribute(attr, val); document.head.append(el); }
    return el;
  };
  meta('meta[name="description"]', "meta", "name", "description").setAttribute("content", i.beschr);
  meta('meta[name="robots"]', "meta", "name", "robots").setAttribute("content", i.robots);
  meta('link[rel="canonical"]', "link", "rel", "canonical").setAttribute("href", i.canonical);
}
/* Alle Adressen, die es als eigene Seite gibt (der Generator baut daraus die fertigen Seiten und die Sitemap) */
function alleRouten() {
  const leer = { cat: null, id: null, vcat: null, q: "" };
  const l = Object.keys(SEITEN).map(v => ({ ...leer, view: v }));
  CATS.forEach(c => l.push({ ...leer, view: "kat", cat: c.id }));
  ITEMS.filter(i => !i.draft).forEach(i => l.push({ ...leer, view: "item", id: i.id }));
  Object.keys(VORG).forEach(k => l.push({ ...leer, view: "vorgaben", vcat: k }));
  return l.map(s => pfadFuer(s));
}
/* Für den Generator: Navigationsknöpfe als echte Links, damit Suchmaschinen ihnen folgen können */
function alsLinks(root) {
  root.querySelectorAll("button[data-go],button[data-cat],button[data-item],button[data-v]").forEach(b => {
    const d = b.dataset, leer = { cat: null, id: null, vcat: null, q: "" };
    const st = d.go ? { ...leer, view: d.go } : d.cat !== undefined ? { ...leer, view: "kat", cat: d.cat }
      : d.item ? { ...leer, view: "item", id: d.item } : { ...leer, view: "vorgaben", vcat: d.v };
    const a = document.createElement("a");
    [...b.attributes].forEach(x => { if (x.name !== "type") a.setAttribute(x.name, x.value); });
    a.setAttribute("href", pfadFuer(st));
    while (b.firstChild) a.append(b.firstChild);
    b.replaceWith(a);
  });
}
function statischHolen() {
  const holen = sel => { const c = $(sel).cloneNode(true); alsLinks(c); return c.innerHTML; };
  return { main: holen("#main"), topnav: holen("#topnav"), drawer: holen("#drawer"), info: seiteInfo(), mainClass: $("#main").className };
}

render();
const CACHE_KEY = "fundus-daten-v1";
function cacheLesen() { try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); return c && c.d && c.d.ok ? c.d : null; } catch (e) { return null; } }
function cacheSchreiben(d) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d })); } catch (e) {} }
function laden() {
  const normal = () => fetch(CONFIG.API + "?action=fundus").then(r => { if (!r.ok) throw new Error("http"); return r.json(); });
  /* Schnellstart: zuletzt gemerkte Daten sofort anzeigen, frische Daten im Hintergrund holen */
  let schnell = false, alt = "";
  if (!LOADED) {
    const c = cacheLesen();
    if (c) {
      try {
        setData(c); alt = JSON.stringify(c); schnell = true;
        if (!S.draw) S.draw = draw();
        FEHLER = ""; render();
      } catch (e) { schnell = false; }
    }
  }
  return normal()
    .then(d => {
      if (!d.ok) throw new Error("data");
      cacheSchreiben(d);
      if (schnell && JSON.stringify(d) === alt) return;   /* nichts Neues, nichts neu zeichnen */
      setData(d);
      if (!S.draw) S.draw = draw();
      FEHLER = "";
      render();
    })
    .catch(() => {
      if (schnell) return;   /* gemerkte Daten bleiben sichtbar */
      FEHLER = FEHLER || "Die Liste kann gerade nicht geladen werden. Bitte später noch einmal versuchen.";
      render();
    });
}
laden();

/* Computer: Höhe der festen Kopfzeile messen (sie hängt von der Schrift der Reiter ab) */
function kopfHoehe() {
  const t = document.querySelector(".topwrap");
  if (t && window.matchMedia("(min-width:900px)").matches) document.documentElement.style.setProperty("--hh", t.offsetHeight + "px");
  else document.documentElement.style.removeProperty("--hh");
}
window.addEventListener("resize", kopfHoehe);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(kopfHoehe);
kopfHoehe();

/* ----- Schnittstelle und Fenster ----- */
async function apiPost(obj) {
  const r = await fetch(CONFIG.API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(obj) });
  return r.json();
}
function openDlg(html) {
  $("#dlgBox").innerHTML = html;
  $("#dlg").hidden = false;
}
function closeDlg() { S.diceOpen = false; $("#dlg").hidden = true; $("#dlgBox").innerHTML = ""; }

const dicePop = () => `<div class="dicepop"><h2 style="margin:0 0 10px;font-size:20px">Szenenwürfel</h2>${genHTML()}</div>`;
/* ===== Eigene Proben (werden nur auf diesem Gerät gespeichert) ===== */
function probenLesen() {
  try { const l = JSON.parse(localStorage.getItem("fundus-proben-v1") || "[]"); return Array.isArray(l) ? l.filter(p => p && p.id && Array.isArray(p.ids)) : []; } catch (e) { return []; }
}
function probenSchreiben(l) { try { localStorage.setItem("fundus-proben-v1", JSON.stringify(l)); return true; } catch (e) { return false; } }
function heuteIso() { return new Date().toISOString().slice(0, 10); }
function datumDe(iso) { const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}.${m[2]}.${m[1]}` : ""; }
function pbAktualisieren() {
  const sel = new Set(S.pb.sel), n = sel.size;
  const z = $("#pbN"); if (z) z.textContent = n + " ausgewählt";
  const w = $("#pbWeiter"); if (w) w.disabled = !n;
  CATS.forEach(c => {
    const l = ITEMS.filter(i => i.cat === c.id && !i.draft), k = l.filter(i => sel.has(i.id)).length;
    const el = document.querySelector(`[data-pbc="${CSS.escape(c.id)}"]`); if (el) el.textContent = `${k} von ${l.length}`;
    const all = document.querySelector(`[data-pb-all="${CSS.escape(c.id)}"]`); if (all) all.checked = l.length > 0 && k === l.length;
  });
}
function pbFiltern() {
  const q = (S.pb.q || "").trim().toLowerCase();
  document.querySelectorAll("#pbliste .pbgrp").forEach(g => {
    let sichtbar = 0;
    g.querySelectorAll("label[data-t]").forEach(r => { const ok = !q || r.dataset.t.includes(q); r.hidden = !ok; if (ok) sichtbar++; });
    g.hidden = !sichtbar;
    const alle = g.querySelector("[data-pb-all]"); if (alle) alle.closest("label").hidden = !!q;
    if (q) g.open = true;
  });
}
document.addEventListener("change", e => {
  const el = e.target;
  if (!S.pb || !el.dataset) return;
  if (el.dataset.pb !== undefined) {
    const s = new Set(S.pb.sel);
    if (el.checked) s.add(el.dataset.pb); else s.delete(el.dataset.pb);
    S.pb.sel = [...s]; pbAktualisieren();
  } else if (el.dataset.pbAll !== undefined) {
    const s = new Set(S.pb.sel);
    ITEMS.filter(i => i.cat === el.dataset.pbAll && !i.draft).forEach(i => { if (el.checked) s.add(i.id); else s.delete(i.id); });
    S.pb.sel = [...s];
    el.closest("details").querySelectorAll("[data-pb]").forEach(c => { c.checked = s.has(c.dataset.pb); });
    pbAktualisieren();
  }
});
document.addEventListener("input", e => {
  if (!S.pb) return;
  if (e.target.id === "pbq") { S.pb.q = e.target.value; pbFiltern(); }
  else if (e.target.id === "pbname") S.pb.name = e.target.value;
});
function probeSpeichern() {
  const b = S.pb, name = (($("#pbname") || {}).value || "").trim() || ("Probe am " + datumDe(heuteIso()));
  const l = probenLesen();
  const reihe = ITEMS.filter(i => b.sel.includes(i.id)).map(i => i.id);
  let id = b.edit;
  if (id && l.some(p => p.id === id)) l.forEach(p => { if (p.id === id) { p.name = name; p.ids = reihe; } });
  else { id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); l.push({ id, name, datum: heuteIso(), ids: reihe }); }
  if (!probenSchreiben(l)) { alert("Die Probe konnte auf diesem Gerät nicht gespeichert werden. Eventuell ist der private Modus eingeschaltet."); return; }
  S.pb = null;
  go("probe", { pid: id }, true);
}

/* ===== Eine Übung teilen: als Link oder als ganzer Text (wie in der Spielliste) ===== */
const TEILEN = { id: null, art: "link" };
const personenText = tn => tn ? tn + (String(tn).trim() === "1" ? " Person" : " Personen") : "";
function teilenInhalt(i, art) {
  const c = catOf(i.cat), url = BASIS_URL + pfadFuer({ view: "item", id: i.id });
  if (art === "link") {
    const text = `${i.title} – Impro-Übung aus dem Impro-Fundus`;
    return { url, text, voll: `${text}:\n${url}` };
  }
  const info = [c ? c.name : "", personenText(i.tn), i.dauer, i.level].filter(Boolean).join(" · ");
  const text = `${i.title}\n${info ? info + "\n" : ""}\n${(i.ab || "Beschreibung folgt.").trim()}`;
  return { url, text, voll: `${text}\n\nAus dem Impro-Fundus: ${url}` };
}
function teilenHTML() {
  const i = ITEMS.find(x => x.id === TEILEN.id);
  if (!i) return "";
  const t = teilenInhalt(i, TEILEN.art), nativ = !!navigator.share;
  return `<h2>Übung teilen</h2>
    <p class="meta">${esc(i.title)}</p>
    <div class="shseg" role="group" aria-label="Was möchtest du teilen?"><button data-sh-art="link" aria-pressed="${TEILEN.art === "link"}">Link</button><button data-sh-art="text" aria-pressed="${TEILEN.art === "text"}">Ganzer Text</button></div>
    <pre class="shprev">${esc(t.voll)}</pre>
    <div class="shbtns">${nativ ? `<button class="btn red" data-sh-do="nativ">Teilen …</button>` : ""}<button class="btn${nativ ? "" : " red"}" data-sh-do="wa">WhatsApp</button><button class="btn" data-sh-do="tg">Telegram</button><button class="btn" data-sh-do="mail">E-Mail</button><button class="btn" data-sh-do="kopie">Kopieren</button></div>
    <p class="meta" id="shMsg" role="status"></p>
    <div class="row"><button class="btn" data-dlg-close>Schließen</button></div>`;
}
function teilenOeffnen(id) { TEILEN.id = id; TEILEN.art = "link"; openDlg(teilenHTML()); }
async function teilenTun(aktion) {
  const i = ITEMS.find(x => x.id === TEILEN.id);
  if (!i) return;
  const t = teilenInhalt(i, TEILEN.art), enc = encodeURIComponent, melden = x => { const m = $("#shMsg"); if (m) m.textContent = x; };
  if (aktion === "wa") window.open("https://wa.me/?text=" + enc(t.voll), "_blank", "noopener");
  else if (aktion === "tg") window.open("https://t.me/share/url?url=" + enc(t.url) + "&text=" + enc(t.text), "_blank", "noopener");
  else if (aktion === "mail") location.href = "mailto:?subject=" + enc(i.title + " – Impro-Fundus") + "&body=" + enc(t.voll);
  else if (aktion === "nativ") {
    try { await navigator.share(TEILEN.art === "link" ? { title: i.title, text: t.text, url: t.url } : { title: i.title, text: t.voll }); } catch (e) { /* abgebrochen */ }
  } else if (aktion === "kopie") {
    let ok = false;
    try { await navigator.clipboard.writeText(t.voll); ok = true; }
    catch (e) {
      const ta = document.createElement("textarea");
      ta.value = t.voll; ta.style.cssText = "position:fixed;opacity:0"; document.body.append(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch (e2) {}
      ta.remove();
    }
    melden(ok ? (TEILEN.art === "link" ? "Link kopiert." : "Text kopiert.") : "Das Kopieren hat nicht geklappt. Markiere den Text oben und kopiere ihn von Hand.");
  }
}

function pdfDialog() {
  const grp = (name, cnt, rows) => `<details class="pdfgrp"><summary>${esc(name)} <span class="meta" data-cnt data-max="${cnt}">0 von ${cnt}</span></summary><label class="check pdfall"><input type="checkbox" data-all> <b>Alle auswählen</b></label>${rows}</details>`;
  const ue = CATS.map(c => {
    const l = ITEMS.filter(i => i.cat === c.id && !i.draft);
    return l.length ? grp(c.name, l.length, l.map(i => `<label class="check"><input type="checkbox" name="pu" value="${esc(i.id)}"> ${esc(i.title)}</label>`).join("")) : "";
  }).join("");
  const vo = Object.keys(VORG).map(k => {
    const l = (VORG[k] || []).filter(x => x.entwurf !== "1");
    return l.length ? grp(k, l.length, l.map(x => `<label class="check"><input type="checkbox" name="pv" value="${esc(x.id)}"> ${esc(x.t)}</label>`).join("")) : "";
  }).join("");
  openDlg(`<h2>Eigene Spielliste erstellen</h2>
    <form id="pdfForm" class="dlgform">
      <p class="meta">Klappe die Bereiche auf und wähle die Übungen und Vorgaben aus, die auf deine Liste sollen. Daraus entsteht dein PDF.</p>
      <h3>Übungen</h3>${ue}
      <h3>Vorgaben</h3>${vo}
      <p class="meta" id="pdfm">Dein Browser öffnet danach das Druckfenster. Wähle dort „Als PDF speichern“.</p>
      <div class="row"><button class="btn red" type="submit">PDF erstellen</button><button class="btn" type="button" data-dlg-close>Abbrechen</button><span class="meta" id="pdfc">Noch nichts ausgewählt</span></div>
    </form>`);
  const form = $("#pdfForm");
  const zaehlen = () => {
    form.querySelectorAll(".pdfgrp").forEach(g => {
      const boxes = [...g.querySelectorAll("input[name]")], n = boxes.filter(x => x.checked).length;
      g.querySelector("[data-cnt]").textContent = n + " von " + boxes.length;
      const all = g.querySelector("[data-all]"); all.checked = n === boxes.length && n > 0;
    });
    const u = form.querySelectorAll("input[name=pu]:checked").length, v = form.querySelectorAll("input[name=pv]:checked").length;
    $("#pdfc").textContent = (u || v) ? `${u} ${u === 1 ? "Übung" : "Übungen"}, ${v} ${v === 1 ? "Vorgabe" : "Vorgaben"} gewählt` : "Noch nichts ausgewählt";
  };
  form.addEventListener("change", e => {
    if (e.target.dataset && e.target.dataset.all !== undefined) e.target.closest(".pdfgrp").querySelectorAll("input[name]").forEach(x => x.checked = e.target.checked);
    zaehlen();
  });
  form.onsubmit = e => {
    e.preventDefault();
    const u = new Set([...form.querySelectorAll("input[name=pu]:checked")].map(x => x.value));
    const v = new Set([...form.querySelectorAll("input[name=pv]:checked")].map(x => x.value));
    if (!u.size && !v.size) { $("#pdfm").textContent = "Bitte wähle mindestens eine Übung oder Vorgabe aus."; return; }
    pdfErstellen(u, v);
  };
}
/* PDF der eigenen Spielliste. Gestaltung (Kopfzeile, Schriften, Abstände) hier in PDF_STIL ändern */
const PDF_STIL = {
  rot: "#B02E28", text: "#1F1B17", grau: "#6F665D",
  titel: "Caveat", kategorie: "Indie Flower", name: "Caveat", info: "Coming Soon", fliess: "Architects Daughter"
};
function pdfErstellen(u, v) {
  const w = window.open("", "_blank");
  if (!w) { alert("Bitte erlaube Pop-ups für diese Seite, damit das PDF erstellt werden kann."); return; }
  const z = PDF_STIL;
  const personen = tn => tn ? tn + (String(tn).trim() === "1" ? " Person" : " Personen") : "";
  let body = "";
  CATS.forEach(c => {
    const l = ITEMS.filter(i => i.cat === c.id && u.has(i.id));
    if (!l.length) return;
    body += `<h2>${esc(c.name)}</h2>`;
    l.forEach(i => {
      const info = [personen(i.tn), i.dauer, i.level].filter(Boolean).join(" · ");
      body += `<div class="card"><div class="box"></div><div class="cb"><div class="nm">${esc(i.title)}</div>${info ? `<div class="inf">${esc(info)}</div>` : ""}<div class="tx">${i.ab ? prose(i.ab) : "<p>Beschreibung folgt.</p>"}</div></div></div>`;
    });
  });
  Object.keys(VORG).forEach(k => {
    const l = (VORG[k] || []).filter(x => v.has(x.id));
    if (!l.length) return;
    body += `<h2>Vorgaben: ${esc(k)}</h2><ul class="vl">${l.map(x => `<li><span class="bx"></span><span>${esc(x.t)}${x.h ? ` <span class="hint">(${esc(x.h)})</span>` : ""}</span></li>`).join("")}</ul>`;
  });
  const logo = new URL("/logo.png", location.href).href;
  const datum = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const css = `
@page{size:A4;margin:20mm 20mm 22mm;@bottom-left{content:"impro-fundus.de";font:10pt '${z.info}',cursive;color:${z.grau}}@bottom-right{content:"Seite " counter(page) " von " counter(pages);font:10pt '${z.info}',cursive;color:${z.grau}}}
*{box-sizing:border-box}
body{margin:0;font:11.5pt/1.4 '${z.fliess}',cursive;color:${z.text}}
table.s{width:100%;border-collapse:collapse}
.hd{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;padding-bottom:8px;border-bottom:2px solid ${z.rot}}
.hd img{height:36px;width:auto;display:block}
.hd .t{font:700 30pt '${z.titel}',cursive;color:${z.rot};text-align:center}
.hd .d{font:9.5pt '${z.info}',cursive;color:${z.grau};text-align:right;white-space:nowrap}
.sp{height:24px}
.probe{display:flex;flex-wrap:wrap;gap:12px 24px;margin:0 0 14px}
.probe .fld{display:flex;align-items:flex-end;gap:6px;flex:1 1 200px}
.probe .fld i{flex:1;border-bottom:1px solid #444;height:1.3em}
h2{font:700 19pt '${z.kategorie}',cursive;text-decoration:underline;margin:16px 0 6px;break-after:avoid}
.card{display:flex;gap:10px;align-items:flex-start;padding:0 0 10px;break-inside:avoid}
.box{flex:none;width:15px;height:15px;border:1.5px solid #333;border-radius:3px;margin-top:6px}
.cb{flex:1;min-width:0}
.nm{font:700 20pt/1.15 '${z.name}',cursive}
.inf{font:9.5pt '${z.info}',cursive;color:${z.grau};padding:1px 0 4px}
.tx p{margin:0 0 4px}
.vl{list-style:none;margin:0;padding:0;columns:2;column-gap:22px}
.vl li{display:flex;gap:8px;align-items:flex-start;break-inside:avoid;padding:2px 0}
.bx{flex:none;width:12px;height:12px;border:1.4px solid #333;border-radius:2px;margin-top:4px}
.hint{color:${z.grau}}
.notiz{break-before:page}
.notiz .nl{height:26px;border-bottom:1px solid #bbb}
@media screen{body{padding:20px}}`;
  const probe = ["Probe am", "Ort", "Gruppe"].map(x => `<div class="fld"><span>${x}:</span><i></i></div>`).join("");
  const notiz = `<div class="notiz"><h2>Notizen</h2>${"<div class='nl'></div>".repeat(16)}</div>`;
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Meine Spielliste – Impro-Fundus</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Indie+Flower&family=Architects+Daughter&family=Coming+Soon&display=swap" rel="stylesheet"><style>${css}</style></head><body><table class="s"><thead><tr><td><div class="hd"><div><img src="${logo}" alt=""></div><div class="t">Meine Spielliste</div><div class="d">${datum}</div></div><div class="sp"></div></td></tr></thead><tbody><tr><td><div class="probe">${probe}</div>${body}${notiz}</td></tr></tbody></table><script>(function(){var done=false;function p(){if(done)return;done=true;window.focus();window.print();}var f=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();Promise.race([f.then(function(){return new Promise(function(r){setTimeout(r,300)})}),new Promise(function(r){setTimeout(r,4000)})]).then(p);})();<\/script></body></html>`);
  w.document.close();
}

const euro = n => (Math.round(n * 100) / 100).toLocaleString("de-DE") + " €";
const spLink = () => CONFIG.PAYPAL_URL.replace(/\/+$/, "") + "/" + S.sp.betrag + "EUR";
function spBetrag(n) {
  n = Math.round(Number(n));
  if (!isFinite(n) || n < 1) n = 1;
  if (n > 10000) n = 10000;
  S.sp.betrag = n;
}
function spAngabenMerken() {
  if ($("#spName")) { S.sp.name = $("#spName").value.trim(); S.sp.mail = $("#spMail").value.trim(); S.sp.text = $("#spText").value.trim(); }
}
document.addEventListener("input", e => {
  if (e.target.id !== "spN") return;
  if (e.target.value === "") return;
  spBetrag(e.target.value);
  document.querySelectorAll("[data-sp-betrag]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.spBetrag === S.sp.betrag)));
});
