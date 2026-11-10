#!/usr/bin/env python3
"""
Baut für jede Seite des Impro-Fundus eine fertige HTML-Datei (damit Google jede Übung,
jede Kategorie und jede Vorgaben-Liste als eigene Seite findet) und schreibt die sitemap.xml.

So läuft es:
  1. Die Daten kommen aus dem Google Sheet (über die Impro-Schnittstelle) oder aus einer Datei (--daten).
  2. Ein unsichtbarer Browser (Chromium) öffnet jede Seite der echten Website mit diesen Daten.
  3. Das fertige Ergebnis jeder Seite wird als <adresse>/index.html gespeichert.

Aufruf:   python3 tools/seiten_bauen.py              (Daten aus dem Sheet holen)
          python3 tools/seiten_bauen.py --daten x.json   (Daten aus einer Datei, zum Testen)
"""
import argparse, hashlib, html, http.server, json, os, re, shutil, socketserver, sys, threading, time, urllib.request
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent
GESCHUETZT = {"verwaltung", "app", "tools", ".github", ".git"}
SEO_INTRO = ('<p class="seo-intro">Der Impro-Fundus ist eine kostenlose Sammlung für alle, die Improtheater spielen: '
             'Warm-up-Spiele, Kennenlernspiele, Zweierübungen, Dreierübungen, Gruppenübungen und Vorgaben für Szenen, '
             'dazu ein Szenenwürfel und die Möglichkeit, eine eigene Spielliste als PDF zu erstellen.</p>')
OHNE_JS = '<noscript><p class="seo-intro">Für den Impro-Fundus muss JavaScript eingeschaltet sein.</p></noscript>'


def daten_holen(datei):
    if datei:
        return json.loads(Path(datei).read_text(encoding="utf-8"))
    js = (WURZEL / "site.js").read_text(encoding="utf-8")
    url = re.search(r'API:\s*"([^"]+)"', js).group(1) + "?action=fundus"
    letzter = None
    for versuch in range(4):
        try:
            with urllib.request.urlopen(url, timeout=90) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # noqa
            letzter = e
            time.sleep(5 * (versuch + 1))
    sys.exit(f"Daten konnten nicht geladen werden: {letzter}")


class Handler(http.server.SimpleHTTPRequestHandler):
    """Liefert Dateien (mit Endung) aus dem Projektordner, alles andere ist die leere Vorlage."""
    vorlage = ""

    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(WURZEL), **k)

    def log_message(self, *a):
        pass

    def do_GET(self):
        pfad = self.path.split("?")[0]
        if "." in pfad.rsplit("/", 1)[-1]:
            return super().do_GET()
        body = Handler.vorlage.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def seite_bauen(vorlage, version, info, teile, home=False, lade=False):
    esc = lambda t: html.escape(t, quote=True)
    ld = ""
    if info.get("ld"):
        ld = '<script type="application/ld+json">' + json.dumps(info["ld"], ensure_ascii=False).replace("</", "<\\/") + "</script>"
    main = teile["main"]
    if home:
        main = main.rstrip()
        main = (main[:-len("</div>")] if main.endswith("</div>") else main) + SEO_INTRO + OHNE_JS + "</div>"
    cls = teile.get("mainClass", "").strip()
    attr = (f' class="{esc(cls)}"' if cls else "") + (' data-statisch="lade"' if lade else ' data-statisch="1"')
    ers = {
        "{{TITEL}}": esc(info["titel"]), "{{BESCHREIBUNG}}": esc(info["beschr"]), "{{CANONICAL}}": esc(info["canonical"]),
        "{{ROBOTS}}": esc(info["robots"]), "{{JSONLD}}": ld, "{{VERSION}}": version,
        "{{TOPNAV}}": teile["topnav"], "{{DRAWER}}": teile["drawer"], "{{MAINATTR}}": attr, "{{MAIN}}": main,
    }
    out = vorlage
    for k, v in ers.items():
        out = out.replace(k, v)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--daten", help="JSON-Datei statt Abruf aus dem Sheet")
    args = ap.parse_args()

    daten = daten_holen(args.daten)
    if not daten.get("ok") or len(daten.get("uebungen", [])) < 10:
        sys.exit("Abbruch: Die Daten sehen unvollständig aus. Es wurde nichts verändert.")

    version = hashlib.sha1(b"".join((WURZEL / f).read_bytes() for f in ("site.js", "site.css", "tools/vorlage.html"))).hexdigest()[:10]
    roh = (WURZEL / "tools" / "vorlage.html").read_text(encoding="utf-8")
    leer = {"{{TITEL}}": "Impro-Fundus", "{{BESCHREIBUNG}}": "", "{{CANONICAL}}": "https://impro-fundus.de/", "{{ROBOTS}}": "noindex",
            "{{JSONLD}}": "", "{{VERSION}}": version, "{{TOPNAV}}": "", "{{DRAWER}}": "", "{{MAINATTR}}": "", "{{MAIN}}": ""}
    start = roh
    for k, v in leer.items():
        start = start.replace(k, v)
    Handler.vorlage = start

    from playwright.sync_api import sync_playwright
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), Handler)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    basis = f"http://127.0.0.1:{port}"
    antwort = json.dumps(daten, ensure_ascii=False)

    seiten = {}   # pfad -> (info, teile)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1400, "height": 900}, locale="de-DE")
        ctx.add_init_script("(()=>{let s=12345;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;})()")
        ctx.route("**/script.google.com/**", lambda r: r.fulfill(status=200, content_type="application/json", body=antwort))
        ctx.route("**/script.googleusercontent.com/**", lambda r: r.fulfill(status=200, content_type="application/json", body=antwort))
        ctx.route(re.compile(r"https://fonts\.(googleapis|gstatic)\.com/.*"), lambda r: r.abort())
        page = ctx.new_page()
        fehler = []
        page.on("pageerror", lambda e: fehler.append(str(e)))

        def oeffnen(pfad):
            page.goto(basis + pfad)
            page.wait_for_function("window.FERTIG === true", timeout=30000)

        oeffnen("/")
        pfade = page.evaluate("alleRouten()")
        for pf in pfade:
            oeffnen(pf)
            teile = page.evaluate("statischHolen()")
            seiten[pf] = (teile["info"], teile)
        # Seite für unbekannte Adressen (GitHub Pages zeigt sie bei Fehler 404)
        oeffnen("/diese-seite-gibt-es-nicht/")
        t404 = page.evaluate("statischHolen()")
        browser.close()
    srv.shutdown()
    if fehler:
        sys.exit("Abbruch: JavaScript-Fehler beim Bauen: " + "; ".join(fehler[:3]))
    if len(seiten) < 15:
        sys.exit("Abbruch: zu wenige Seiten gefunden.")

    # alte fertige Seiten entfernen (z. B. gelöschte Übungen), dann neu schreiben
    for d in {pf.strip("/").split("/")[0] for pf in seiten if pf != "/"}:
        if d and d not in GESCHUETZT and (WURZEL / d).is_dir():
            shutil.rmtree(WURZEL / d)
    eintraege = []
    for pf, (info, teile) in seiten.items():
        out = seite_bauen(roh, version, info, teile, home=(pf == "/"))
        ziel = WURZEL / pf.strip("/") / "index.html" if pf != "/" else WURZEL / "index.html"
        ziel.parent.mkdir(parents=True, exist_ok=True)
        ziel.write_text(out, encoding="utf-8")
        if info["robots"].startswith("index"):
            eintraege.append(pf)
    info404 = {"titel": "Seite wird geladen – Impro-Fundus", "beschr": "Impro-Fundus", "robots": "noindex,follow", "canonical": "https://impro-fundus.de/", "ld": None}
    t404 = dict(t404, main='<div class="inner"><div class="empty">Einen Moment …</div></div>', mainClass="")
    (WURZEL / "404.html").write_text(seite_bauen(roh, version, info404, t404, lade=True), encoding="utf-8")

    def prio(pf):
        if pf == "/": return "1.0"
        if pf.startswith(("/uebungen/", "/vorgaben/")): return "0.8"
        if pf.startswith("/uebung/"): return "0.6"
        return "0.4"
    xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for pf in sorted(eintraege, key=lambda x: (-float(prio(x)), x)):
        xml.append(f"  <url><loc>https://impro-fundus.de{html.escape(pf)}</loc><priority>{prio(pf)}</priority></url>")
    xml.append("</urlset>")
    (WURZEL / "sitemap.xml").write_text("\n".join(xml) + "\n", encoding="utf-8")
    print(f"Fertig: {len(seiten)} Seiten gebaut, {len(eintraege)} in der Sitemap.")


if __name__ == "__main__":
    main()
