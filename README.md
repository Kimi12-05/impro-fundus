# impro-theater


## Verwaltung

Die Inhalte (Übungen, Vorgaben, Zitate, Admins, Import/Export) werden nur noch auf der eigenen Verwaltungsseite bearbeitet: `https://impro-fundus.de/verwaltung/` (Datei `verwaltung/index.html`, Anmeldung mit Admin-Name und Passwort). Auf der öffentlichen Website gibt es keine Anmeldung und keinen Bearbeiten-Modus mehr.

## Eigene Adresse für jede Seite

Jede Seite hat eine eigene Adresse, z. B. `/uebungen/`, `/uebungen/3er-uebungen/`, `/uebung/<name>/`, `/vorgaben/<name>/`, `/kontakt/`.
Nur der Szenenwürfel und die Spielliste (PDF) sind Fenster ohne eigene Adresse.

- `site.js` und `site.css` enthalten die ganze Website (Router, Seiten, Design). `tools/vorlage.html` ist das Grundgerüst jeder Seite.
- `tools/seiten_bauen.py` baut daraus für jede Seite eine fertige HTML-Datei (damit Google sie findet) und die `sitemap.xml`.
  Die Seiten unter `uebungen/`, `uebung/`, `vorgaben/` usw., `index.html`, `404.html` und `sitemap.xml` sind erzeugt: nicht von Hand ändern.
- `.github/workflows/seiten-bauen.yml` startet das jede Nacht automatisch (neue Übungen aus dem Sheet erscheinen dann am nächsten Tag
  als eigene Seite) und nach Änderungen an `site.js`, `site.css` oder `tools/`. Manuell: GitHub → Actions → „Seiten neu bauen“ → Run workflow.
- Neue Übungen sind sofort erreichbar (über `404.html`), Google bekommt die fertige Seite aber erst nach dem nächsten Lauf.
- Lokal testen: `python3 tools/seiten_bauen.py --daten daten.json` (braucht `pip install playwright`).
