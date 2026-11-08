/* ===================================================
   IMPRO-GRUPPE – Backend + Website (Google Apps Script)
   =================================================== */

const TABELLEN = {
  Mitglieder:  ['id','vorname','nachname','seit','gruppenleiter','aktiv','pinHash','mail','tel','chatTyp','chatWert','notiz','bild'],
  Proben:      ['id','datum','start','ende','ausgefallen','grund','anwesend','plan'],
  Status:      ['probeId','mitgliedId','status','zeit'],
  Spiele:      ['id','titel','kat','art','tn','dauer','level','ablauf','eig'],
  Wuensche:    ['probeId','mitgliedId','spielId','wunsch'],
  Vorschlaege: ['id','typ','kategorie','titel','beschr','von','datum'],
  Einstellungen: ['key','wert']
};
const LEITER_MAIL = 'eckervogt@outlook.de';
// ADMIN-ZUGANG FÜR DIE FUNDUS-SEITE: hier dein Passwort eintragen, dann Funktion adminEinrichten ausführen
const ADMIN_NAME = 'Admin';
const ADMIN_PASSWORT = 'DEIN-PASSWORT';
// Weitere Admins: Namen und Passwort hier eintragen, dann die passende Funktion unten ausführen
const ADMIN_NEU_NAME = 'NAME-DES-NEUEN-ADMINS';
const ADMIN_NEU_PASSWORT = 'PASSWORT-DES-NEUEN-ADMINS';
const ADMIN_ENTFERNEN_NAME = 'NAME-DES-ADMINS-ZUM-ENTFERNEN';
const BILD_KEYS = ['kachelUebungen','kachelVorgaben','kachelProben','iconMaps','iconWhatsapp'];
const PROBE_START = '19:30', PROBE_ENDE = '22:00';
const SPERRE_MIN = 5, MAX_FEHLER = 5;


/* ---------- Startdaten (echte Übungen und Vorgaben aus der Theater-Brand-App) ---------- */
// Übung: [Titel, Kategorie, Teilnehmer, Level, Ablauf]
const START_UEBUNGEN = [["Grommolo Übersetzer", "3er", "3", "Fortgeschritten", "Eine Person spricht ganz normales Deutsch.\n\nDie zweite Person kommt aus dem Gromolo-Land und spricht nur Gromolo (eine frei erfundene Fantasiesprache).\n\nDie dritte Person ist der Übersetzer und übersetzt hin und her.\n\nIhr spielt zusammen eine improvisierte Szene. Der Gromolo-Sprecher nutzt viel Mimik und Gestik."], ["Grommolo Switch", "2er", "2", "Fortgeschritten", "Zwei Spieler beginnen eine normale Szene mit deutsch. Wenn der Spielleiter ein Zeichen gibt, also z.B. klatscht, müssen sie sofort, also ohne Unterbrechung/Sprechpause in Gromolo (Kauderwelsch) wechseln. Klatscht der Spielleiter nach wenigen Sekunden erneut, geht es wieder zurück auf deutsch usw. immer hin und her. Diese Wechsel müssen wie selbstverständlich im Sprechfluss und ohne jegliche Hervorhebung passieren.\n\nDer Switch kann beliebig oft stattfinden, die Dauer der Gromolo/deutsch-Parts darf unterschiedlich lang sein. Auch während der Gromolophase muss die Szene weiterlaufen. Wichtig ist auch, dass die einzelnen Phasen (deutsch/Gromolo) nicht zu lang sind und gegen Ende der Szene zunehmend kürzer werden."], ["Drei Tote", "3er", "3", "Fortgeschritten", "Drei (oder vier) Spieler stellen sich in einer Reihe auf die Bühne und für jeden wird vom Publikum eine Todesart abgefragt. Die Spieler stellen nun die Toten dar, die erzählen, wie es zu ihrem Tod gekommen ist. Ziel ist, dass alle zur gleichen Zeit am gleichen Ort sterben.\n\nAlle Spieler drehen sich jetzt um und stehen mit dem Rücken zum Publikum. Der Erste dreht sich um und stellt seine Figur kurz vor. Dann dreht er sich wieder um und der nächste stellt sich vor bis alle einmal durch sind. In dieser ersten Runde soll einfach nur der Charakter der Figur definiert werden. Die Figuren können miteinander verwandt sein, sie können aber auch völlig unabhängig voneinander sein.\n\nIn der zweiten Runde wird der Ort eingeführt, es drehen sich wieder alle nacheinander um und erzählen. Der erste Spieler führt mit seiner Erzählung den Ort ein, die anderen übernehmen den Ort. Im besten Falle sind am Ende der Runde alle an einem Ort und können in der dritten und letzten Runde alle erzählen, wie sie gestorben sind."], ["Letztes Wort, erstes Wort", "2er", "2", "Fortgeschritten", "An diesem Spiel sind zwei Spieler beteiligt. Es wird eine beliebige Vorgabe eingeholt. Das Besondere ist, dass im Dialog der beiden das jeweils letzte Wort des einen Spielers das erste des anderen sein muss.\n\nBeispiel:\n\nA: Wie komme ich denn zum Bahnhof?\n\nB: Bahnhof — lassen sie mich überlegen. Sie gehen erst nach links, dann liegt auf der rechten Seite eine Treppe, die gehen sie hoch.\n\nA: Hoch gelegen der Bahnhof, was?\n\nB: Was meinen sie, wie mich das immer anstrengt.\n\nusw."], ["ABC Spiel", "2er", "2", "Fortgeschritten", "Basisspiel\n\nDas jeweils erste Wort im Dialog beginnt mit dem nächsten Buchstaben im Alphabet. Das Spiel geht bis der Buchstabe „Z“ erreicht ist. Das ABC-Spiel ist daher auch unter dem Namen Alphabetspiel bekannt.\n\nBeispiel:\n\nErster Spieler: „Abends bekomme ich immer Hunger. Das ist nicht gut für meine Figur!“\n\nZweiter Spieler: „Besonders lecker finde ich Schnitzel.“\n\nErster Spieler: „Currywurst esse ich lieber. Am Besten mit Pommes.“\n\nusw.\n\nVariante 2:\n\nJeder Satz beginnt mit dem nächsten Buchstaben."], ["Drei Regeln", "2er", "2", "Fortgeschritten", "Der Moderator fragt drei personenbezogene Regeln ab, die die Spieler in der Szene beachten sollen. Zum Beispiel, dass sie nur einen Arm haben, kein Wort sprechen dürfen, das ein „s“ enthält und verliebt sein sollen.\n\nGegebenenfalls kann man auch gezielt abfragen: Also z.B. nach körperlicher Besonderheit – welchen Buchstaben weglassen (es empfiehlt sich, keine Vokale zu nehmen, also gleich nach Konsonanten zu fragen)? – welches Gefühl?\n\nRegeln:\n\n1. Jeder Satz muss als Frage enden. Beispiel: „Der Peter geht jetzt in die Küche, oder?“\n\n2. Jeder Satz beginnt mit „Und dann“. Beispiel: „Und dann greift der Bernd zur Tasse.“\n\n3. Sie dürfen die Wörter „Nein“, „nicht“, „kein“, „nichts“, „niemals“ etc. nicht benutzen. (keine Verneinungen) Beispiel: Statt „Ich habe keinen Hunger“ musst du eher sagen „Ich bin satt.“\n\n4. Sie sprechen nur in der dritten Person über sich selbst. Beispiel: „Die Anna freut sich sehr.“ statt „Ich freue mich sehr.“\n\n5. Jede Aussage muss übertrieben höflich und formell sein. Beispiel: „Verehrteste Kollegin, dürfte ich mir erlauben, Ihnen mitzuteilen, dass es mir eine außerordentliche Freude bereitet…?“\n\n6. Jeder Satz muss eine Metapher enthalten. Beispiel: „Das Herz des Thomas ist ein brodelnder Vulkan.“ / „Die Anna ist ein leuchtender Stern in der Dunkelheit.“\n\n7. Jeder Satz muss einen Vergleich enthalten. Beispiel: „Der Bernd läuft schnell wie ein gehetzter Hase.“ / „Ihr Lächeln ist warm wie die Sonne.“\n\n8. Jeder Satz muss mit „Plötzlich“ beginnen. Beispiel: „Plötzlich betritt der Klaus den Raum.“ / „Plötzlich spürt sie große Freude.“\n\n9. Jeder Satz muss exakt vier Wörter lang sein. Beispiel: „Der Max öffnet die Tür.“ / „Anna nimmt den Apfel jetzt.“\n\n10. Man darf keine Artikel verwenden. (der, die, das, ein, eine, dem, den etc.) Beispiel: „Max öffnet Tür langsam.“ / „Anna trinkt Kaffee gerne.“\n\n11. Ein bestimmter Buchstabe ist verboten. (das Publikum legt vorher einen Buchstaben fest, z. B. „R“) Beispiel (bei Verbot von „R“): Die Spieler müssen Wörter finden, in denen dieser Buchstabe nicht vorkommt. Statt „Tür“ könnte man z. B. sagen „Zugang“ oder „Eingang“. Statt „Fenster“ könnte man „Scheibe“ oder „Glas“ sagen."], ["Tod in einer Minute (30, 15, 10, 5)", "2er", "2–6", "Fortgeschritten", "Tod in einer Minute ist eine Variante des Spiels „Halbwertszeit“.\n\nZwei Spieler beginnen eine Szene (evtl. mit Vorgaben des Publikums) bei der innerhalb einer Minute eine der beiden Figuren sterben muss. Nun wird die selbe Szene wiederholt, jedoch wird jetzt nur noch eine halbe Minute gespielt. Dann 15 Sekunden, 8, 4, 2, 1 Sekunden."], ["Gefühlsreplay", "3er", "2–6", "Fortgeschritten", "Mit Vorgabe einer alltäglichen Handlung (oder etwas anderes) wird von zwei bis drei Spielern eine kurze Szene gespielt.\n\nDiese wird danach zwei oder dreimal verschieden gefühlsbetont wiederholt (Replay).\n\nDabei ist die Wahl der Gefühle dem Publikum überlassen, man sollte aber möglichst gegensätzliche Gefühle wählen.\n\nBeispiel für Gefühle: verliebt, wütend, müde, durchgedreht, albern…"], ["Genrereplay", "3er", "2–6", "Fortgeschritten", "Deine Genre Replay Liste:\n\n1. Seifenoper\nÜbertrieben dramatisches Daily Soap-Feeling.\nTipps: Starke Emotionen, lange dramatische Pausen, viel Seufzen, dramatische Kopfbewegungen, übertriebene Liebes- oder Hass-Erklärungen. Sprich sehr affektiert und laut.\n\n2. Shakespeare-Drama\nKlassisches Theater im Stil von Shakespeare.\nTipps: Verwende altertümliche, poetische Sprache („Oh holde Maid!“, „Weh mir!“). Sprich theatralisch, mit großen Gesten und viel Pathos. Stehe würdevoll und dramatisch.\n\n3. Musical\nAlles wird gesungen statt gesprochen.\nTipps: Singt eure Dialoge (auch improvisiert). Übertreibt die Melodie und Emotion. Macht große Musical-Gesten mit den Armen. Ihr könnt auch zusammen im Chor singen.\n\n4. Stummfilm\nKein gesprochenes Wort – nur Mimik und Gestik.\nTipps: Übertriebene, cartoonartige Gesichtsausdrücke und Bewegungen. Macht alles sehr groß. Ihr könnt Zwischentitel andeuten (z. B. mit imaginären Tafeln).\n\n5. Reality-TV\nKünstlich aufgeheizte Realityshow.\nTipps: Sprecht direkt in die (imaginäre) Kamera, dramatisiert alles extrem, verwendet Phrasen wie „Ich kann nicht glauben, dass du das gemacht hast!“, viel Genervt-Sein und künstliche Tränen.\n\n6. Talkshow\nEine Person ist Moderator, die andere der Gast.\nTipps: Der Moderator stellt übertriebene Fragen und reagiert begeistert/schockiert. Der Gast erzählt dramatisch oder arrogant. Viel Blickkontakt zum Publikum.\n\n7. Porno\nStark erotisch und klischeehaft.\nTipps: Tiefe, rauchige Stimmen, viel Stöhnen, anzügliche Blicke, langsame Bewegungen. Übertreibt die sexuelle Anziehung oder die typischen Porno-Dialoge extrem.\n\n8. Kinderfernsehen\nFröhliches, einfaches und naives Kinderprogramm.\nTipps: Sehr hohe, fröhliche Stimmen, einfache Sprache, viel Lächeln und Begeisterung. Macht große, langsame Gesten und erklärt alles überdeutlich.\n\n9. Erstes Date\nSchüchternes, peinliches oder aufgeregtes erstes Treffen.\nTipps: Stottern, lange Pausen, nervöses Lachen, sich verhaspeln, Komplimente, die schiefgehen. Viel Körpersprache (Hände knetschen, Haare hinters Ohr streichen).\n\n10. Comedy (Sitcom-Stil)\nLeichte, witzige amerikanische Comedyserie.\nTipps: Schnelle Dialoge, Pointen, übertriebene Reaktionen, Slapstick-Elemente und viel Timing. Schaut das Publikum an, wenn ein Witz kommt.\n\n11. Horror\nGruselig und bedrohlich.\nTipps: Flüstert viel, macht lange Pausen, sprecht langsam und unheimlich. Nutzt tiefe Stimmen, starre Blicke und langsame, bedrohliche Bewegungen.\n\n12. Krimi\nSpannender Detektiv- oder Verhör-Stil.\nTipps: Misstrauische Blicke, harte, kurze Sätze, viel Andeutungen („Ich weiß, was du getan hast…“). Eine Person kann der Ermittler, die andere der Verdächtige sein.\n\n13. Opa (Alte-Leute-Stil)\nZwei alte Omas oder Opas im Gespräch.\nTipps: Sprecht langsam, nuschelt etwas, verwendet alte Ausdrücke („Früher war alles besser…“). Krummen Rücken, zittrige Bewegungen, meckern und jammern viel.\n\n14. Bollywood\nEmotionales, dramatisches indisches Kino.\nTipps: Sehr große Emotionen, dramatische Gesten, viel Pathos und Leidenschaft. Singt zwischendurch kurz (oder tut so), sprecht gefühlvoll und übertrieben."], ["Gebärdendolmetscher", "3er", "3", "Fortgeschritten", "In der Szene wird eine beliebige Interviewsituation dargestellt, beispielsweise wird ein Experte zu einem bestimmten Thema befragt. Das Besondere ist, dass ein dritter Spieler das Erzählte für Gehörlose „übersetzt“ und die entsprechenden passenden Gesten, Gesichtsausdrücke und Bewegungen macht.\n\nDas Spiel steht und fällt mit dem Körpereinsatz und Einfallsreichtum des Gebärdendolmetschers, der im Wesentlichen den Fokus hat."], ["Aus der Sicht von", "3er", "2–4", "Fortgeschritten", "Ein Replayspiel mit 3 Spielern. Man beginnt mit einer neutralen Szene, die relativ kurz sein sollte. Die Figuren sollten klar dargestellt sein. Wenn die Szene beendet ist, wird sie wiederholt aus der Sicht eines der drei Spieler. Das heißt, dass die anderen zwei versuchen, die Weltsicht, die Wahrnehmungen und Empfindungen dieser Figur, so wie sie sie aus ihrem Spielen in der ersten Szene wahrgenommen haben (ggf. nur aus Andeutungen), größer bzw. deutlicher zu machen. Wenn z.B. in der Anfangsszene die Mutter der Tochter streng verboten hat, nach 23 Uhr nach Hause zu kommen und die Spieler merkten, dass die Tochter das gemein und streng fand, dann könnte die Mutter in der Folgeszene, in der die Tochter „bespielt“ wird, ihre Figur strenger und gemeiner anlegen als in der Ausgangsszene. Entsprechend wird in Bezug auf die anderen zwei Spieler verfahren."], ["Akzeptieren", "2er", "2", "Fortgeschritten", "2–3 Personen\n\nIhr spielt eine normale improvisierte Szene.\n\nWichtigste Regel: Alles, was der andere sagt oder vorschlägt, musst du sofort akzeptieren und darauf aufbauen.\n\nKein „Nein“, kein Ablehnen, kein Korrigieren.\n\nImmer „Ja, und…“\n\nZiel: Gemeinsam eine verrückte, stimmige Szene erschaffen."], ["Au Ja!", "Warm-Up", "", "Fortgeschritten", "2 Personen\n\nBeide stehen nebeneinander vor dem Publikum und beginnen gemeinsam, eine Tätigkeit auszuführen (z.B. Kuchen backen, ein Regal aufbauen, ein Auto reparieren).\n\nJeder Satz beginnt mit „Au ja, und dann…“. Nach dem „Au ja, und dann“ folgt eine Beschreibung, was als nächstes getan wird. Die Tätigkeit wird auch tatsächlich pantomimisch ausgeführt.\n\nBeispiel:\n\nA: „Au ja, und dann holen wir die Eier aus dem Kühlschrank.“\n\nB: „Au ja, und dann schlagen wir die Eier in die Schüssel.“\n\nA: „Au ja, und dann rühren wir den Teig.“\n\nusw.\n\nDie Sätze müssen also logisch aufeinander aufbauen."], ["Geschichten gleichzeitig erzählen", "2er", "2", "Fortgeschritten", "Eine Übung für zwei Spieler.\n\nBeide beginnen gleichzeitig mit dem ersten Satz ihrer Geschichte.\n\nDann erzählt Spieler 1 die Geschichte von Spieler 2 weiter, indem er mit dem zweiten Satz der Geschichte von Spieler 2 fortfährt. Gleichzeitig erzählt Spieler 2 den zweiten Satz der Geschichte von Spieler 1 weiter.\n\nSpieler 1: „Es war einmal ein kleiner Marienkäfer.“\nGleichzeitig sagt Spieler 2: „Es war Thomas Geburtstag und er hatte seinen einzigen Freund eingeladen.“\n\nDann\nSpieler 1: „Sein Freund hatte ihm als Geschenk 2 Flugtickets nach Mallorca mitgebracht.“\nGleichzeitig sagt Spieler 2: „Der Marienkäfer lebte zusammen mit seinen Geschwistern auf einem kleinen Blatt…“\n\nSo geht es nun immer hin und her. Die Sätze sollten möglichst kurz sein, damit das gleichzeitige Erzählen ausbalanciert ist.\n\nDiese Übung erfordert gutes Zuhören und sofortiges Behaupten."], ["Orte Switch", "2er", "2–6", "Fortgeschritten", "2 Personen + Moderator\n\nZwei Spieler improvisieren eine Szene an einem bestimmten Ort.\n\nDer Moderator ruft zwischendurch „Switch!“ und nennt einen neuen Ort (z. B. „Switch – ihr seid jetzt auf dem Mond!“ oder „Switch – ihr seid jetzt im Supermarkt!“).\n\nDie Spieler müssen sofort an dem neuen Ort weiterspielen und improvisieren, warum sie plötzlich dort sind und wie die Szene dort weitergeht.\n\nZiel: Schnelle, kreative Ortswechsel mit lustigen Übergängen."], ["Day before – Day after", "2er", "2–6", "Fortgeschritten", "2 Personen\n\nEine alltägliche oder absurde Situation wird zweimal gespielt: einmal als „Tag davor“ und einmal als „Tag danach“.\n\nBeispiel: Ein Paar streitet sich über eine Urlaubsreise. Die erste Szene zeigt die Planung, die zweite die Rückkehr.\n\nDer Fokus liegt darauf, wie sich Beziehungen, Stimmung und Details verändert haben."], ["Big Booty", "Warm-Up", "", "Einsteiger", "Big Booty ist so ein Aufwärm-Klassiker, der von außen total albern aussieht und einen drinnen trotzdem ganz schön schwitzen lässt. Im Grunde ist es ein Sprech-Rhythmus-Spiel, bei dem man kurz seine eigene Nummer sagt, dann jemand anderen aufruft, und das alles im Takt der Gruppe. Klingt einfach. Ist es nicht.\n\nWir stellen uns im Kreis auf und nummerieren uns durch. Der erste ist Big Booty, danach kommen Number 1, Number 2, Number 3 und so weiter. Big Booty gibt das Tempo vor, der Rest hält es. Wer dran ist, ruft im Takt erst sich selbst, dann denjenigen, an den er die heiße Kartoffel weiterreicht.\n\nGeht so:\n\nAlle: Big Booty, Big Booty, Big Booty — ooooh yeah\nBig Booty: Big Booty → Number 4\nNumber 4: Number 4 → Big Booty\nBig Booty: Big Booty → Number 2\nNumber 2: Number 2 → Number 3\n\nAlle: Aiaiai!"], ["4-Satzgeschichte", "Gruppe", "4", "Fortgeschritten", "Die Spieler stellen sich im Kreis oder in einer Reihe auf, um kurze Geschichten zu erzählen.\n\nDabei sagt jeder Spieler jeweils nur einen Satz.\n\nDie 4 Sätze sind nach dem Modell aufgebaut:\n\nEinleitung/Routine => Problem => Lösung => Moral\n\nDabei beginnt Spieler 1 mit dem Einleitungssatz, z.B.:\n\n„Es war einmal in Japan, da zog ein junger Samurai in seinen ersten großen Kampf.“\n\nSpieler 2 etabliert jetzt in seinem Satz das Problem, z.B.:\n\n„Der Samurai hatte jedoch große Angst vor dem Tod, bettelte um Gnade und ergab sich seinem Gegner und wurde daraufhin von allen verachtet und mit Schande bedacht.“\n\nSpieler 3 etabliert jetzt in seinem Satz die Lösung, z.B.:\n\n„Bis er als alter Samurai der durch die Erfahrung sehr viel gelernt und die Angst komplett verloren hatte, erneut auf seinen früheren Gegner traf und ihn schließlich doch noch besiegte.“\n\nSpieler 4 fasst jetzt die „Moral der Geschichte“ zusammen, z.B.:\n\n„Und die Moral von der Geschichte: Wer immer wieder aufsteht, wenn er hinfällt, wird irgendwann erfolgreich sein.“\n\nDiese Übung eignet sich gut um ein beliebtes Grundmuster des Geschichtenerzählens zu trainieren und dabei in einem Satz auf den Punkt zu kommen."], ["Ja, genau und dann …", "2er", "2", "Fortgeschritten", "Zwei Spieler stehen vor dem Publikum, ein dritter sitzt am Bühnenrand.\n\nA und B stehen nebeneinander und erzählen gemeinsam eine Geschichte. Jeder Satz beginnt mit „Ja genau und dann“. A und B steigern sich in die Geschichte hinein.\n\nA: „Ja genau und dann sind wir durch den Wald gelaufen.“ (A und B gehen auf der Stelle)\n\nB: „Ja genau und dann haben wir ein Geräusch gehört.“ (A und B halten inne)\n\nA: „Ja genau und dann haben wir uns umgeschaut.“ (A und B schauen sich um)\n\nA: „Ja genau und dann haben wir ein Handy auf dem Boden gesehen.“ (A und B schauen nach unten und bücken sich)\n\nA: „Ja genau und dann haben wir das Handy aufgehoben.“ (A und B bücken sich)\n\nusw.\n\nDie Sätze müssen logisch aufeinander aufbauen. Wichtig ist, dass A und B die Handlungen, die sie beschreiben, auch pantomimisch ausführen."], ["Ja, aber …", "2er", "2", "Fortgeschritten", "Bei dieser Übung finden sich die Spieler in Paaren zusammen und führen nun einen Dialog. A macht einen Vorschlag, während B einen Grund findet, den Vorschlag nicht umsetzen zu müssen. Sein Satz beginnt dabei mit „Ja, aber“. Anschließend macht B einen neuen Vorschlag, sodass sich nun A eine Ausrede ausdenken muss.\n\nA: „Lass uns doch gemeinsam die schwere Kiste vom Schrank holen.“\n\nB: „Ja, aber ich habe es doch so schlimm mit dem Rücken. Lass uns lieber ins Schwimmbad gehen.“\n\nA: „Ja aber ich kann doch gar nicht schwimmen…“\n\nBei der Übung geht es darum zu trainieren nicht mit „Nein“ zu antworten und damit komplett zu blocken, sondern stattdessen einen Gegenvorschlag zu machen und seinem Mitspieler Alternativen anzubieten. Auf diese Weise wird die Szene am Leben erhalten, gleichzeitig kann der Spieler unangenehmen Vorschlägen aus dem Weg gehen."], ["Freeze", "Gruppe", "", "Fortgeschritten", "Zwei Spieler spielen eine Szene. Ein dritter Spieler steht neben der Bühne und ruft jederzeit „Freeze!“. Daraufhin müssen die beiden Spieler sofort in ihrer Bewegung erstarren. Der Spielleiter tippt einen der beiden Spieler an, der sich daraufhin aus der Szene herausnimmt. Der Spielleiter übernimmt dessen Position und Körperhaltung und beginnt eine komplett neue Szene, in der die verbliebene Person mitspielen muss.\n\nWichtig: Die neue Szene sollte möglichst wenig mit der vorherigen zu tun haben. Die erstarrte Haltung des ausgetauschten Spielers muss als Ausgangspunkt für die neue Szene genutzt werden. Die Spieler sollten sich gegenseitig gut beobachten und schnell reagieren."], ["Einwortgeschichte", "Warm-Up", "", "Einsteiger", "4–8 Personen (im Kreis)\n\nReihum wird immer nur ein Wort gesagt. Gemeinsam entsteht so eine Geschichte.\n\nBeispiel:\n\nA: „Es“ – B: „war“ – C: „einmal“ – D: „ein“ – A: „kleiner“ – B: „Drache“ …\n\nWichtig: Immer nur ein Wort pro Person, kein Satz. Wer dran ist, sagt sofort ein Wort, ohne lange nachzudenken. Am Ende soll die Geschichte einen Abschluss finden.\n\nZiel: Gemeinsames Erzählen, Fokus und schnelles Reagieren."], ["Erfinder-Talkshow", "2er", "2", "Fortgeschritten", "2 Personen\n\nEin Spieler ist der Talkshow-Moderator, der andere ist ein verrückter Erfinder.\n\nDer Erfinder präsentiert stolz seine neueste, total abgedrehte Erfindung (z. B. eine Sockenanzziehmaschine, einen Schuhbinden-Roboter oder eine Krawatten-Bindemaschine).\n\nDer Moderator stellt neugierige und überraschte Fragen, der Erfinder erklärt und demonstriert seine Erfindung enthusiastisch.\n\nZiel: Lustige, übertriebene Präsentation einer sinnlosen Erfindung."], ["Whose Line is it anyways", "3er", "2–6", "Fortgeschritten", ""], ["Ja und", "2er", "2", "Fortgeschritten", "2 Personen\n\nEin Spieler macht einen Vorschlag oder eine Aussage. Der andere antwortet immer mit „Ja, und …“ und ergänzt eine neue Information.\n\nBeispiel:\n\nA: „Wir fahren jetzt in den Urlaub.“\n\nB: „Ja, und wir haben schon gepackt.“\n\nZiel: Gemeinsam eine Szene aufbauen, ohne zu blocken."], ["Experte", "2er", "2", "Fortgeschritten", "2 Personen (mit Moderator)\n\nEin Moderator stellt den Experten Fragen zu einem völlig absurden Thema (z. B. „Wie züchtet man unsichtbare Elefanten?“).\n\nDie Experten antworten möglichst überzeugend und detailliert, als wüssten sie alles.\n\nZiel: Sicheres Auftreten, absurde Details, Spaß am Erfinden."], ["Toaster-Spiel", "Warm-Up", "", "Einsteiger", "Toaster, James Bond, Waschmaschine, Mixer"], ["Wachsmaske", "Warm-Up", "", "Einsteiger", "Wachsmaske, Whiskey-Mixer, Messwechsel"]];
// Vorgabe: [Kategorie, Text, Eigenschaften]
const START_VORGABEN = [["Ticks", "Schnipst ständig mit den Fingern", "körperlich"], ["Ticks", "Wackelt permanent mit einem Bein", "körperlich"], ["Ticks", "Reibt sich dauernd die Hände, als wäre ihm kalt", "körperlich"], ["Ticks", "Stottert stark (besonders bei bestimmten Buchstaben)", "sprachlich"], ["Ticks", "Vergisst ständig, was er/sie gerade sagen wollte", "sprachlich"], ["Ticks", "Wiederholt die letzten zwei Wörter des Gegenübers", "sprachlich"], ["Ticks", "Spricht immer in der dritten Person von sich selbst", "sprachlich"], ["Ticks", "Spricht nur in Reimen", "sprachlich"], ["Tätigkeiten", "Etwas reparieren", "handwerklich"], ["Tätigkeiten", "Etwas auf einem Flohmarkt verkaufen", "alltag"], ["Tätigkeiten", "Heiratsantrag üben", "privat"], ["Tätigkeiten", "Vorstellungsgespräch üben", "beruflich"], ["Tätigkeiten", "Streit mit dem Nachbarn", "privat"], ["Tätigkeiten", "Yoga machen", "alltag"], ["Tätigkeiten", "Jemandem die Bedienung eines Gerätes erklären", "beruflich"], ["Tätigkeiten", "Sich beim Kundendienst beschweren", "beruflich"], ["Tätigkeiten", "IKEA-Möbel zusammenbauen", "handwerklich"], ["Tätigkeiten", "Blumen gießen", "alltag"], ["Tätigkeiten", "Zähne putzen", "alltag"], ["Tätigkeiten", "Wäsche falten", "alltag"], ["Tätigkeiten", "Fenster putzen", "alltag"], ["Tätigkeiten", "Schuhe binden", "alltag"], ["Tätigkeiten", "Zeitung lesen", "alltag"], ["Tätigkeiten", "Etwas suchen", "alltag"], ["Phobien", "Klaustrophobie / Angst vor engen Räumen", "Phobie"], ["Phobien", "Höhenangst", "Phobie"], ["Phobien", "Angst vor Clowns", "Phobie"], ["Phobien", "Undrophobie – panische Angst vor dem Wort „und“", "Phobie"], ["Phobien", "Stiftkappenphobie – Angst davor, dass die Kappe eines Stiftes verloren geht", "Phobie"], ["Phobien", "Namensphobie – Angst vor dem eigenen Namen", "Phobie"], ["Phobien", "Kleptomanie", "Manie"], ["Phobien", "Pyromanie", "Manie"], ["Phobien", "Mythomanie (zwanghaftes Lügen)", "Manie"], ["Phobien", "Zwanghaftes Zählen", "Manie"], ["Phobien", "Zwanghaftes Ordnen und Sortieren", "Manie"], ["Phobien", "Größenwahn (Megalomanie)", "Manie"], ["Orte", "Im Supermarkt", "Innen"], ["Orte", "Am Bahnsteig", "Außen"], ["Orte", "Im Wartezimmer beim Arzt", "Innen"], ["Orte", "In einer Bankfiliale", "Innen"], ["Orte", "In einer Autowerkstatt", "Innen"], ["Orte", "In einem Café", "Innen"], ["Orte", "In einem Fahrstuhl", "Innen,eng"], ["Orte", "Auf einem Friedhof", "Außen"], ["Orte", "In einer Bibliothek", "Innen,still"], ["Orte", "Im Polizeirevier", "Innen"], ["Orte", "In einer Waschküche", "Innen"], ["Orte", "Am Flughafen", "Außen"], ["Orte", "In der Apotheke", "Innen"], ["Orte", "Vor einer Mauer", "Außen"], ["Orte", "Unter einer Brücke", "Außen"], ["Orte", "In einem leeren Raum", "Innen,still"], ["Orte", "Auf einer Treppe", "Außen"], ["Orte", "In einer Warteschlange", "Außen"], ["Orte", "Vor einem Schaufenster", "Außen"], ["Orte", "Neben einem Zaun", "Außen"], ["Orte", "Hinter einer Tür", "Innen"], ["Rekorde", "Längste Zeit auf einem Bein stehen", "körperlich"], ["Rekorde", "Längste Zeit ohne zu blinzeln", "körperlich"], ["Rekorde", "Längstes ununterbrochenes Lächeln", "körperlich"], ["Rekorde", "Längste Zeit auf Zehenspitzen stehen", "körperlich"], ["Rekorde", "Mit so vielen Dingen jonglierend wie möglich", "körperlich"], ["Hobbys", "Stricken", "drinnen"], ["Hobbys", "Schach spielen", "drinnen"], ["Hobbys", "Modellbau", "drinnen"], ["Hobbys", "Gärtnern", "draußen"], ["Hobbys", "Klettern", "draußen"], ["Hobbys", "Im Chor singen", "sozial"], ["Hobbys", "Fotografieren", "draußen"], ["Hobbys", "Töpfern", "drinnen"], ["Hobbys", "Radfahren", "draußen"], ["Hobbys", "Angeln", "draußen"], ["Hobbys", "Briefmarken sammeln", "drinnen"], ["Hobbys", "Kochen", "drinnen"], ["Hobbys", "Wandern", "draußen"], ["Hobbys", "Tanzen", "sozial"], ["Hobbys", "Kalligrafie", "drinnen"], ["Genre", "Krimi", "klassisch"], ["Genre", "Horror", "klassisch"], ["Genre", "Fantasy", "klassisch"], ["Genre", "Western", "klassisch"], ["Genre", "Drama", "klassisch"], ["Genre", "Musical", "modern"], ["Genre", "Detektivgeschichte", "klassisch"], ["Genre", "Märchen", "klassisch"], ["Genre", "Tragödie", "klassisch"], ["Genre", "Zeitreise", "modern"], ["Genre", "Zombie-Apokalypse", "modern"], ["Genre", "Familiendrama", "modern"], ["Genre", "Romantik", "klassisch"], ["Genre", "Piratenabenteuer", "klassisch"], ["Genre", "Dokumentation", "modern"], ["Genre", "Porno", "modern"], ["Gefühle", "Freude", "positiv"], ["Gefühle", "Trauer", "negativ"], ["Gefühle", "Wut", "negativ,stark"], ["Gefühle", "Angst", "negativ"], ["Gefühle", "Überraschung", "neutral"], ["Gefühle", "Ekel", "negativ"], ["Gefühle", "Scham", "negativ,still"], ["Gefühle", "Stolz", "positiv"], ["Gefühle", "Neid", "negativ,still"], ["Gefühle", "Liebe", "positiv"], ["Gefühle", "Hass", "negativ,stark"], ["Gefühle", "Hoffnung", "positiv,still"], ["Gefühle", "Verzweiflung", "negativ,stark"], ["Gefühle", "Eifersucht", "negativ"], ["Gefühle", "Glück", "positiv"], ["Gefühle", "Langeweile", "neutral,still"], ["Gefühle", "Aufregung", "neutral,stark"], ["Gefühle", "Enttäuschung", "negativ"], ["Gefühle", "Dankbarkeit", "positiv,still"], ["Gefühle", "Verwirrung", "neutral"], ["Gefühle", "Panik", "negativ,stark"], ["Gefühle", "Ruhe", "positiv,still"], ["Gefühle", "Frustration", "negativ"], ["Gefühle", "Zufriedenheit", "positiv,still"], ["Gefühle", "Sehnsucht", "neutral,still"], ["Gefühle", "Reue", "negativ,still"], ["Gefühle", "Misstrauen", "negativ,still"], ["Gefühle", "Begeisterung", "positiv,stark"], ["Gefühle", "Melancholie", "negativ,still"], ["Gefühle", "Nervosität", "negativ"], ["Gefühle", "Schadenfreude", "positiv"], ["Gefühle", "Einsamkeit", "negativ,still"], ["Gefühle", "Geborgenheit", "positiv,still"], ["Gefühle", "Überforderung", "negativ,stark"], ["Gefühle", "Euphorie", "positiv,stark"], ["Gefühle", "Gleichgültigkeit", "neutral,still"], ["Gefühle", "Verlegenheit", "neutral"], ["Gefühle", "Bewunderung", "positiv"], ["Gefühle", "Schuldgefühle", "negativ,still"], ["Gefühle", "Optimismus", "positiv"], ["Beziehungen", "Ehepaar", "nah"], ["Beziehungen", "Geschwister", "nah"], ["Beziehungen", "Mutter oder Vater mit Sohn oder Tochter", "nah"], ["Beziehungen", "Chef und Angestellter", "beruflich"], ["Beziehungen", "Lehrer und Schüler", "beruflich"], ["Beziehungen", "Arzt und Patient", "beruflich"], ["Beziehungen", "Verkäufer und Kunde", "beruflich"], ["Beziehungen", "Nachbarn", "nah"], ["Beziehungen", "Beste Freunde", "nah"], ["Beziehungen", "Ex-Partner", "nah"], ["Beziehungen", "Polizist und Verdächtiger", "beruflich"], ["Beziehungen", "Kellner und Gast", "beruflich"], ["Beziehungen", "Mitbewohner", "nah"], ["Beziehungen", "Trainer und Sportler", "beruflich"], ["Beziehungen", "Anwalt und Klient", "beruflich"], ["Beziehungen", "Friseur und Kunde", "beruflich"], ["Beziehungen", "Fremde", "fremd"], ["Berufe", "Lehrer", "Bildung"], ["Berufe", "Arzt", "Gesundheit"], ["Berufe", "Polizist", "Ordnung"], ["Berufe", "Kellner", "Dienstleistung"], ["Berufe", "Friseur", "Dienstleistung"], ["Berufe", "Anwalt", "Ordnung"], ["Berufe", "Sekretär", "Büro"], ["Berufe", "Koch", "Handwerk"], ["Berufe", "Postbote", "Dienstleistung"], ["Berufe", "Gärtner", "Handwerk"], ["Berufe", "Journalist", "Büro"], ["Berufe", "Therapeut", "Gesundheit"], ["Berufe", "Bauarbeiter", "Handwerk"], ["Berufe", "Bestatter", "Dienstleistung"], ["Berufe", "Immobilienmakler", "Büro"], ["Berufe", "Elektriker", "Handwerk"], ["Berufe", "Detektiv", "Ordnung"], ["Berufe", "Priester", "Kirche"], ["Berufe", "Pfarrer", "Kirche"], ["Berufe", "Putzkraft", "Dienstleistung"]];
// Persönlichkeiten: [Kategorie, Name (– Haken), Gruppe, Hinweise]
const START_PERSONEN = [["Persönlichkeiten", "Angela Merkel – Raute vor dem Bauch, „Sie kennen mich“, vorsichtige Halbsätze", "Politik", "extrem ausdauernd · nüchtern im Auftreten · meisterhaft im Aussitzen"], ["Persönlichkeiten", "Helmut Kohl – Pfälzischer Singsang, „blühende Landschaften“, wuchtige Arme", "Politik", ""], ["Persönlichkeiten", "Gerhard Schröder – „Basta“, Zigarre, Ärmel hochgekrempelt", "Politik", ""], ["Persönlichkeiten", "Edmund Stoiber – Transrapid-Rede, gedehnter bayerischer Singsang", "Politik", ""], ["Persönlichkeiten", "Olaf Scholz – Monotone Ruhe, „Doppel-Wumms“, „Sie können sich darauf verlassen“", "Politik", "betont ruhig · kurze, knappe Sätze · stur bei Rückfragen"], ["Persönlichkeiten", "Christian Lindner – Glatte Diktion, „Es gibt keinen Grund, …“", "Politik", ""], ["Persönlichkeiten", "Robert Habeck – Suchend-philosophisch, „Wir müssen …“ mit Denkpause", "Politik", "intellektuell · diskussionsfreudig · buchaffin"], ["Persönlichkeiten", "Karl Lauterbach – Nasal, schnell, alarmiert", "Politik", "redefreudig · missionarisch · detailversessen"], ["Persönlichkeiten", "Gregor Gysi – Berliner Schnauze, trockene Schlagfertigkeit", "Politik", ""], ["Persönlichkeiten", "Donald Trump – „You’re fired“, Handkanten-Gesten, Superlative", "Politik", "superlativsüchtig · dünnhäutig bei Kritik · dominanter Redestil"], ["Persönlichkeiten", "Jürgen Klopp – „Mentalitätsmonster“, Umarmungen, breites Lachen", "Sport", ""], ["Persönlichkeiten", "Franz Beckenbauer – „Ja gut, schau’n mer mal“, lässiges Schulterzucken", "Sport", "elegant · lässig · autoritär im Auftreten"], ["Persönlichkeiten", "Oliver Kahn – „Eier, wir brauchen Eier“, Brustton", "Sport", "explosiv · willensstark · einschüchternd"], ["Persönlichkeiten", "Lothar Matthäus – „Wir müssen …“, Pathos", "Sport", ""], ["Persönlichkeiten", "Zlatan Ibrahimović – Dritte Person, „Zlatan“, Selbstlob", "Sport", "selbstbewusst · humorvoll-arrogant · körperlich dominant"], ["Persönlichkeiten", "Muhammad Ali – „Float like a butterfly“, Reim-Sprüche, tänzeln", "Sport", ""], ["Persönlichkeiten", "Heidi Klum – „Du bist raus“, „We have a walk“, Model-Gang", "Show und Kultur", "extrovertiert · geschäftstüchtig · ständig in Kameras"], ["Persönlichkeiten", "Dieter Bohlen – Sonnenbrille, Sprüche im Fünf-Wort-Takt", "Show und Kultur", "polternd · schnoddrig · harte Sprüche"], ["Persönlichkeiten", "Verona Pooth – „Da werden Sie geholfen“", "Show und Kultur", "glamourös · medienpräsent · geschäftstüchtig"], ["Persönlichkeiten", "Günther Jauch – Lange Kunstpause vor der Auflösung", "Show und Kultur", "redegewandt · souverän · höflich"], ["Persönlichkeiten", "Thomas Gottschalk – Haare, „Wetten, dass..?“-Moderationsstimme", "Show und Kultur", ""], ["Persönlichkeiten", "Karl Lagerfeld – Fächer, Fingerhandschuhe, Aphorismen", "Show und Kultur", "distinguiert · sarkastisch · kompromisslos beim Stil"], ["Persönlichkeiten", "Udo Lindenberg – Hut, „Sonderzug nach Pankow“, genuschelt", "Show und Kultur", "rau · wortkarg · hanseatisch-trotzig"], ["Persönlichkeiten", "Helge Schneider – Absurdität, „Fitze fatze“, improvisiertes Nonsens-Keyboard", "Show und Kultur", "absurd · vielseitig · improvisationsfreudig"], ["Persönlichkeiten", "Arnold Schwarzenegger – „I’ll be back“, Silbenbetonung", "Film und international", "diszipliniert · Motivationssprüche · körperbetont"], ["Persönlichkeiten", "Robert De Niro – „You talkin’ to me“, Kiefermahlen", "Film und international", ""], ["Persönlichkeiten", "Christopher Walken – Unerwartete Pausen mitten im Satz", "Film und international", ""], ["Persönlichkeiten", "Mr. Bean – Wortlos, nur Mimik und Slapstick", "Film und international", "tollpatschig · fast stumm · kindlich-naiv"], ["Persönlichkeiten", "Borat – „My wife“, gebrochenes Englisch, Übergrößen-Anzug", "Film und international", ""], ["Persönlichkeiten", "Gollum – Zwiegespräch mit sich selbst, „Mein Schatz“", "Film und international", "gespalten · gierig · schleichend"], ["Persönlichkeiten", "Fischer", "Politik", "ehrgeizig · schlagfertig · bissig"], ["Persönlichkeiten", "Annalena Baerbock", "Politik", "hartnäckig · detailverliebt · emotional"], ["Persönlichkeiten", "Katharina Reiche", "Politik", "sachlich · durchsetzungsstark · wirtschaftsnah"], ["Persönlichkeiten", "Emmanuel Macron", "Politik", "ehrgeizig · eloquent · machtorientiert"], ["Persönlichkeiten", "Lukas Podolski", "Sport", "volksnah · laut · herzlich"], ["Persönlichkeiten", "Ariana Grande", "Show und Kultur", "stimmgewaltig · perfektionistisch · wandelbar"], ["Persönlichkeiten", "Bushido", "Show und Kultur", "rau · loyal · geschäftssinnig"], ["Persönlichkeiten", "Monk", "Film und international", "zwanghaft ordentlich · ängstlich · detailbesessen"], ["Persönlichkeiten", "Klaus Kinski", "Film und international", "cholerisch · exzentrisch · intensiv"], ["Persönlichkeiten", "Pumuckl", "Comic und Kinderfiguren", "frech · unsichtbar · verspielt"], ["Persönlichkeiten", "Goofy", "Comic und Kinderfiguren", "tollpatschig · gutmütig · lacht dauernd"], ["Persönlichkeiten", "Bibi Blocksberg", "Comic und Kinderfiguren", "vorlaut · hexbegabt · hilfsbereit"], ["Persönlichkeiten", "Pipi Langstrumpf", "Comic und Kinderfiguren", "eigenwillig · superstark · fantasievoll"], ["Persönlichkeiten", "Obelix", "Comic und Kinderfiguren", "bärenstark · gutmütig · verfressen"]];
function startListe(){
  const l = [];
  START_UEBUNGEN.forEach((u,i) => l.push({id:'u'+(i+1), titel:u[0], kat:u[1], art:'uebung', tn:u[2], dauer:'', level:u[3], ablauf:u[4], eig:''}));
  START_VORGABEN.forEach((v,i) => l.push({id:'v'+(i+1), titel:v[1], kat:v[0], art:'vorgabe', tn:'', dauer:'', level:'', ablauf:'', eig:v[2]}));
  return l;
}
function startdaten(){
  const props = PropertiesService.getScriptProperties();
  const personenNachtragen = props.getProperty('personen') !== '1';
  if(props.getProperty('ohneTest') !== '1'){
    props.setProperty('ohneTest','1');
    const mit = alle('Mitglieder');
    const weg = mit.filter(m => m.vorname.trim().toLowerCase() === 'testteilnehmer').map(m => m.id);
    if(weg.length){
      schreibe('Mitglieder', mit.filter(m => !weg.includes(m.id)));
      schreibe('Status', alle('Status').filter(s => !weg.includes(s.mitgliedId)));
      schreibe('Wuensche', alle('Wuensche').filter(w => !weg.includes(w.mitgliedId)));
      const proben = alle('Proben');
      proben.forEach(p => { p.anwesend = liste(p.anwesend).filter(x => !weg.includes(x)).join(','); });
      schreibe('Proben', proben);
    }
  }
  if(props.getProperty('fix2er') !== '1' && props.getProperty('startdaten2') === '1'){
    props.setProperty('fix2er','1');
    const sp = alle('Spiele');
    sp.forEach(s => { if(s.titel === 'Drei Regeln' || s.titel === 'Akzeptieren') s.kat = '2er'; });
    schreibe('Spiele', sp);
  }
  if(props.getProperty('startdaten2') === '1'){ personenEinspielen(props, personenNachtragen); return; }
  props.setProperty('startdaten2','1');
  // alte Beispieldaten ersetzen, selbst angelegte Einträge (Nummer beginnt mit x) bleiben
  const eigene = alle('Spiele').filter(s => String(s.id).charAt(0) === 'x');
  const neu = startListe().concat(eigene);
  schreibe('Spiele', neu);
  const ids = new Set(neu.map(s => s.id));
  schreibe('Wuensche', alle('Wuensche').filter(w => ids.has(w.spielId)));
  const proben = alle('Proben');
  proben.forEach(p => { p.plan = liste(p.plan).filter(x => ids.has(x)).join(','); });
  schreibe('Proben', proben);
  personenEinspielen(props, personenNachtragen);
}
function personenEinspielen(props, nachtragen){
  if(props.getProperty('personen2') === '1') return;
  props.setProperty('personen2','1');
  const sp = alle('Spiele').filter(s => !/^p\d+$/.test(String(s.id)));
  START_PERSONEN.forEach((v,i) => sp.push({id:'p'+(i+1), titel:v[1], kat:v[0], art:'vorgabe', tn:'', dauer:'', level:'', ablauf:v[3] || '', eig:v[2]}));
  schreibe('Spiele', sp);
}

/* ---------- Tabellenblätter ---------- */
function blatt(name){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(name);
  if(!s) s = ss.insertSheet(name);
  const cols = TABELLEN[name];
  if(s.getLastRow() === 0) s.getRange(1,1,1,cols.length).setValues([cols]);
  else if(s.getLastColumn() < cols.length) s.getRange(1,1,1,cols.length).setValues([cols]);
  return s;
}
function zelle(v){
  if(v instanceof Date){
    return v.getFullYear() < 1950 ? Utilities.formatDate(v, 'Europe/Berlin', 'HH:mm') : Utilities.formatDate(v, 'Europe/Berlin', 'yyyy-MM-dd');
  }
  return String(v ?? '');
}
function tCacheLesen(name){
  try { const t = CacheService.getScriptCache().get('t8_' + name); return t ? JSON.parse(t) : null; } catch(e){ return null; }
}
function tCacheSchreiben(name, liste){
  try {
    const t = JSON.stringify(liste);
    if(t.length < 90000) CacheService.getScriptCache().put('t8_' + name, t, 600);
    else CacheService.getScriptCache().remove('t8_' + name);
  } catch(e){}
}
let CACHE = {};
function alle(name){
  if(!CACHE[name]){
    const schnell = tCacheLesen(name);
    if(schnell){ CACHE[name] = schnell; return CACHE[name].map(o => Object.assign({}, o)); }
    const v = blatt(name).getDataRange().getValues();
    const kopf = v[0] || [];
    CACHE[name] = v.slice(1).filter(r => String(r[0]) !== '').map(r => {
      const o = {};
      kopf.forEach((k,i) => o[k] = zelle(r[i]));
      return o;
    });
    tCacheSchreiben(name, CACHE[name]);
  }
  return CACHE[name].map(o => Object.assign({}, o));
}
function schreibe(name, liste){
  const s = blatt(name);
  const cols = TABELLEN[name];
  const alt = s.getLastRow() - 1;
  if(alt > 0) s.getRange(2,1,alt,cols.length).clearContent();
  const zeilen = liste.map(o => cols.map(k => String(o[k] ?? '')));
  if(zeilen.length){
    const r = s.getRange(2,1,zeilen.length,cols.length);
    r.setNumberFormat('@');
    r.setValues(zeilen);
  }
  CACHE[name] = liste.map(o => { const n = {}; cols.forEach(k => n[k] = String(o[k] ?? '')); return n; });
  tCacheSchreiben(name, CACHE[name]);
}
function liste(text){ return text ? String(text).split(',').filter(x => x) : []; }
function heuteIso(){ return Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd'); }
function datumDe(){ return Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd.MM.yyyy'); }

/* ---------- Proben automatisch: jeden Mittwoch ---------- */
function sichereProben(){
  const proben = alle('Proben');
  const da = new Set(proben.map(p => p.datum));
  let neu = false;
  const basis = new Date(); basis.setHours(12,0,0,0);
  const diff = (3 - basis.getDay() + 7) % 7;
  for(let i = -8; i <= 4; i++){
    const d = new Date(basis);
    d.setDate(basis.getDate() + diff + i*7);
    const iso = Utilities.formatDate(d, 'Europe/Berlin', 'yyyy-MM-dd');
    if(!da.has(iso)){
      proben.push({id:'p'+iso, datum:iso, start:PROBE_START, ende:PROBE_ENDE, ausgefallen:'nein', grund:'', anwesend:'', plan:''});
      neu = true;
    }
  }
  if(!neu) return;
  proben.sort((a,b) => a.datum < b.datum ? 1 : -1);
  schreibe('Proben', proben);
}

/* ---------- PIN ---------- */
function hash(text){
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'impro:' + text)
    .map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}
function pruefePin(m, pin){
  const props = PropertiesService.getScriptProperties();
  const key = 'f_' + m.id;
  const f = JSON.parse(props.getProperty(key) || '{"n":0,"bis":0}');
  if(Date.now() < f.bis){
    return {ok:false, msg:'Zugang gesperrt. Bitte warte noch ' + Math.ceil((f.bis - Date.now())/60000) + ' Minute(n).'};
  }
  if(!m.pinHash) return {ok:false, msg:'Noch keine PIN festgelegt.'};
  if(hash(String(pin)) === m.pinHash){
    props.deleteProperty(key);
    return {ok:true};
  }
  f.n += 1;
  if(f.n >= MAX_FEHLER){
    props.setProperty(key, JSON.stringify({n:0, bis: Date.now() + SPERRE_MIN*60000}));
    return {ok:false, msg:'Zu viele Fehlversuche. Zugang ist für ' + SPERRE_MIN + ' Minuten gesperrt.'};
  }
  props.setProperty(key, JSON.stringify(f));
  return {ok:false, msg:'Falsche PIN (' + (MAX_FEHLER - f.n) + ' Versuche übrig).'};
}

/* ---------- Schnittstelle für die Website ---------- */
function doGet(e){
  if(e && e.parameter && e.parameter.action === 'fundus'){
    return ContentService.createTextOutput(JSON.stringify(fundusDaten())).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('Impro-Gruppe läuft – Version 14').setMimeType(ContentService.MimeType.TEXT);
}

// Öffentlich lesbar (ohne PIN): nur Übungen und Vorgaben, keine Mitgliederdaten.
const UE_REIHE = ['Zweierübungen','Dreierübungen','Gruppenübungen','Warm-Up-Spiele','Kennenlernspiele'];
const VO_REIHE = ['Ticks','Tätigkeiten','Phobien','Orte','Rekorde','Hobbys','Genre','Gefühle','Beziehungen','Berufe','Persönlichkeiten'];
function fundusDaten(){
  startdaten();
  const sp = alle('Spiele');
  const uebungen = sp.filter(s => s.art !== 'vorgabe').map(s => ({
    id: s.id, titel: s.titel, kat: s.kat, tn: s.tn, dauer: s.dauer, level: s.level, ablauf: s.ablauf, eig: liste(s.eig)
  }));
  const vorgaben = {};
  sp.filter(s => s.art === 'vorgabe').forEach(s => {
    if(!vorgaben[s.kat]) vorgaben[s.kat] = [];
    vorgaben[s.kat].push({id: s.id, t: s.titel, e: liste(s.eig), h: s.ablauf || ''});
  });
  return {ok: true, uebungen: uebungen, vorgaben: vorgaben, uebungenReihe: UE_REIHE, vorgabenReihe: VO_REIHE};
}
function doPost(e){
  let out;
  const t0 = Date.now();
  try {
    out = handle(JSON.parse(e.postData.contents));
  } catch(err){
    out = {ok:false, msg:'Fehler: ' + err.message};
  }
  if(out && typeof out === 'object') out.ms = Date.now() - t0;
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function handle(req){
  CACHE = {};
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    switch(req.action){
      case 'anmelden':   return anmelden(req);
      case 'pinSetzen':  return pinSetzen(req);
      case 'anfrage':    return anfrage(req);
      case 'kontakt':    return kontaktNachricht(req);
      case 'adminAnmelden': return adminAnmelden(req);
      case 'adminSpeichern':
      case 'adminLoeschen': return adminAktion(req);
      case 'adminListe':
      case 'adminHinzufuegen':
      case 'adminEntfernen': return adminVerwaltung(req);
    }
    const a = berechtigt(req);
    if(!a.ok) return a;
    const me = a.m;
    if(req.action === 'daten') return daten(me);
    const res = aktion(me, req);
    if(res && res.ok) res.data = daten(me);
    return res;
  } finally {
    lock.releaseLock();
  }
}
function aktion(me, req){
  switch(req.action){
    case 'status':     return statusSetzen(me, req);
    case 'wunsch':     return wunschSetzen(me, req);
    case 'vorschlag':  return vorschlagEinreichen(me, req);
    case 'profil':     return profilSpeichern(me, req);
  }
  if(me.gruppenleiter !== 'ja') return {ok:false, msg:'Nur für den Gruppenleiter.'};
  switch(req.action){
    case 'probe':            return probeSpeichern(req);
    case 'mitglied':         return mitgliedSpeichern(req);
    case 'mitgliedNeu':      return mitgliedNeu(req);
    case 'pinReset':         return pinZuruecksetzen(req);
    case 'vorschlagPruefen': return vorschlagPruefen(req);
    case 'einstellung':      return einstellungSpeichern(req);
    case 'spielNeu':         return spielNeu(req);
    case 'spielSpeichern':   return spielSpeichern(req);
    case 'spielLoeschen':    return spielLoeschen(req);
  }
  return {ok:false, msg:'Unbekannte Aktion.'};
}

/* ---------- Admins für die Fundus-Website (getrennt von der Verwaltungs-App) ---------- */
// Alle Admins liegen in den Script-Eigenschaften als Liste (Name + Passwort-Hash). Pflege nur über die Funktionen hier.
function adminListeLesen(){
  return JSON.parse(PropertiesService.getScriptProperties().getProperty('ADMIN_LISTE') || '[]');
}
function adminListeSchreiben(liste){
  PropertiesService.getScriptProperties().setProperty('ADMIN_LISTE', JSON.stringify(liste));
}
function adminHinzufuegenWerte(name, passwort){
  const n = String(name || '').trim().toLowerCase();
  if(!n) throw new Error('Bitte einen Namen eintragen.');
  if(!passwort || passwort === 'DEIN-PASSWORT' || passwort.length < 8) throw new Error('Passwort fehlt oder ist zu kurz (mindestens 8 Zeichen).');
  const liste = adminListeLesen().filter(a => a.name !== n);
  liste.push({name: n, hash: hash(String(passwort))});
  adminListeSchreiben(liste);
  Logger.log('Admin gespeichert: ' + n + '. Admins: ' + liste.map(a => a.name).join(', '));
}
// Einmal ausführen: legt den Startzugang aus ADMIN_NAME und ADMIN_PASSWORT an
function adminEinrichten(){ adminHinzufuegenWerte(ADMIN_NAME, ADMIN_PASSWORT); }
// Neuen Admin anlegen: ADMIN_NEU_NAME und ADMIN_NEU_PASSWORT oben eintragen, dann ausführen
function adminNeuHinzufuegen(){ adminHinzufuegenWerte(ADMIN_NEU_NAME, ADMIN_NEU_PASSWORT); }
// Admin entfernen: ADMIN_ENTFERNEN_NAME oben eintragen, dann ausführen
function adminEntfernen(){
  const n = String(ADMIN_ENTFERNEN_NAME || '').trim().toLowerCase();
  const liste = adminListeLesen().filter(a => a.name !== n);
  adminListeSchreiben(liste);
  Logger.log('Admin entfernt: ' + n + '. Admins: ' + liste.map(a => a.name).join(', '));
}
// Alle Admin-Namen anzeigen (ohne Passwörter): Ausführen, dann unten im Log nachsehen
function adminListeAnzeigen(){
  Logger.log(adminListeLesen().map(a => a.name).join(', ') || 'Keine Admins eingerichtet.');
}
function adminAnmelden(req){
  const props = PropertiesService.getScriptProperties();
  const key = 'f_admin';
  const f = JSON.parse(props.getProperty(key) || '{"n":0,"bis":0}');
  if(Date.now() < f.bis){
    return {ok:false, msg:'Zugang gesperrt. Bitte warte noch ' + Math.ceil((f.bis - Date.now())/60000) + ' Minute(n).'};
  }
  const liste = adminListeLesen();
  if(!liste.length) return {ok:false, msg:'Admin-Zugang ist noch nicht eingerichtet.'};
  const n = String(req.name || '').trim().toLowerCase();
  const treffer = liste.find(a => a.name === n);
  if(treffer && hash(String(req.passwort || '')) === treffer.hash){
    props.deleteProperty(key);
    const token = Utilities.getUuid();
    CacheService.getScriptCache().put('adm_' + token, '1', 21600);
    return {ok:true, token:token};
  }
  f.n += 1;
  if(f.n >= MAX_FEHLER){
    props.setProperty(key, JSON.stringify({n:0, bis: Date.now() + SPERRE_MIN*60000}));
    return {ok:false, msg:'Zu viele Fehlversuche. Zugang ist für ' + SPERRE_MIN + ' Minuten gesperrt.'};
  }
  props.setProperty(key, JSON.stringify(f));
  return {ok:false, msg:'Benutzername oder Passwort falsch (' + (MAX_FEHLER - f.n) + ' Versuche übrig).'};
}
// Admins über die Website verwalten (nur für angemeldete Admins)
function adminVerwaltung(req){
  const erlaubt = CacheService.getScriptCache().get('adm_' + String(req.token || ''));
  if(erlaubt !== '1') return {ok:false, msg:'Bitte melde dich erneut als Admin an.'};
  if(req.action === 'adminListe') return {ok:true, admins: adminListeLesen().map(a => a.name)};
  if(req.action === 'adminHinzufuegen'){
    try { adminHinzufuegenWerte(req.name, req.passwort); }
    catch(e){ return {ok:false, msg:e.message}; }
    return {ok:true, admins: adminListeLesen().map(a => a.name)};
  }
  if(req.action === 'adminEntfernen'){
    const n = String(req.name || '').trim().toLowerCase();
    const liste = adminListeLesen();
    if(liste.length <= 1) return {ok:false, msg:'Es muss mindestens ein Admin bleiben.'};
    adminListeSchreiben(liste.filter(a => a.name !== n));
    return {ok:true, admins: adminListeLesen().map(a => a.name)};
  }
  return {ok:false, msg:'Unbekannte Aktion.'};
}
function adminAktion(req){
  const erlaubt = CacheService.getScriptCache().get('adm_' + String(req.token || ''));
  if(erlaubt !== '1') return {ok:false, msg:'Bitte melde dich erneut als Admin an.'};
  if(req.action === 'adminLoeschen') return spielLoeschen(req);
  const f = req.eintrag || {};
  if(!String(f.titel || '').trim()) return {ok:false, msg:'Bitte einen Titel eingeben.'};
  if(!String(f.kat || '').trim()) return {ok:false, msg:'Bitte eine Kategorie wählen.'};
  if(f.art !== 'uebung' && f.art !== 'vorgabe') return {ok:false, msg:'Unbekannte Art.'};
  return spielSpeichern(req);
}

/* ---------- Anmeldung ---------- */
function anmelden(req){
  const gesucht = String(req.vorname || '').trim().toLowerCase();
  const m = alle('Mitglieder').find(x => x.aktiv === 'ja' && x.vorname.trim().toLowerCase() === gesucht);
  if(!gesucht || !m) return {ok:false, msg:'Name nicht gefunden. Mit dem + kannst du dich als neuer Teilnehmer eintragen.'};
  if(!m.pinHash) return {ok:true, neu:true, id:m.id};
  const r = pruefePin(m, req.pin);
  return r.ok ? {ok:true, neu:false, id:m.id, data:daten(m)} : r;
}
function berechtigt(req){
  const m = alle('Mitglieder').find(x => x.id === req.id && x.aktiv === 'ja');
  if(!m) return {ok:false, msg:'Unbekannter Name.'};
  const r = pruefePin(m, req.pin);
  return r.ok ? {ok:true, m:m} : r;
}
function pinSetzen(req){
  const mit = alle('Mitglieder');
  const m = mit.find(x => x.id === req.id);
  if(!m) return {ok:false, msg:'Unbekannter Name.'};
  if(!/^\d{4}$/.test(String(req.pin))) return {ok:false, msg:'Die PIN muss aus 4 Ziffern bestehen.'};
  if(m.pinHash){
    const r = pruefePin(m, req.altPin);
    if(!r.ok) return r;
  }
  m.pinHash = hash(String(req.pin));
  schreibe('Mitglieder', mit);
  return {ok:true};
}
function sendeMail(betreff, text){
  try { MailApp.sendEmail(LEITER_MAIL, betreff, text); } catch(e){}
}
// Einmal im Editor ausführen: erlaubt dem Skript, dir E-Mails zu schicken
function mailTest(){
  MailApp.sendEmail(LEITER_MAIL, 'Impro-App: Test', 'Wenn du diese Mail liest, funktionieren die Benachrichtigungen.');
}
// Kontaktformular der Fundus-Website: schickt die Nachricht per Mail an den Fundus
const KONTAKT_EMPFAENGER = 'leon@impro-fundus.de';
function kontaktNachricht(req){
  const vn = String(req.vorname||'').trim().slice(0,60);
  const nn = String(req.nachname||'').trim().slice(0,60);
  const tel = String(req.telefon||'').trim().slice(0,40);
  const mail = String(req.mail||'').trim().slice(0,120);
  const bt = String(req.betreff||'').trim().slice(0,120);
  const tx = String(req.text||'').trim().slice(0,5000);
  if(!vn || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) || !bt || tx.length < 20){
    return {ok:false, msg:'Bitte alle Pflichtfelder ausfüllen.'};
  }
  MailApp.sendEmail({
    to: KONTAKT_EMPFAENGER,
    subject: 'Impro-Fundus Kontakt: ' + bt,
    body: 'Von: ' + vn + ' ' + nn + '\nE-Mail: ' + mail + (tel ? '\nHandy: ' + tel : '') + '\n\n' + tx,
    replyTo: mail
  });
  return {ok:true};
}
function anfrage(req){
  const v = alle('Vorschlaege');
  v.push({id:'v'+Date.now(), typ:'teilnehmer-anfrage', kategorie:'', titel:String(req.vorname||'').slice(0,40), beschr:'', von:'', datum:heuteIso()});
  schreibe('Vorschlaege', v);
  sendeMail('Impro-App: Neue Anfrage', 'Neue Teilnehmer-Anfrage: ' + String(req.vorname||'').slice(0,40) + '\n\nBitte in der App unter Profil > Leitung > Neue Teilnehmer bestätigen oder ablehnen.');
  return {ok:true};
}

/* ---------- Daten für die Website ---------- */
function daten(me){
  startdaten();
  sichereProben();
  const leitend = me.gruppenleiter === 'ja';
  const mitglieder = alle('Mitglieder')
    .filter(m => leitend || m.aktiv === 'ja')
    .map(m => {
      const o = {id:m.id, vorname:m.vorname, nachname:m.nachname, seit:m.seit, gruppenleiter:m.gruppenleiter==='ja', aktiv:m.aktiv==='ja', bild:m.bild || ''};
      if(leitend){ o.mail = m.mail; o.tel = m.tel; o.chatTyp = m.chatTyp; o.chatWert = m.chatWert; o.notiz = m.notiz; }
      return o;
    });
  return {
    ok: true,
    ich: me.id,
    leiter: leitend,
    mitglieder: mitglieder,
    proben: alle('Proben').map(p => ({id:p.id, datum:p.datum, start:p.start, ende:p.ende, ausgefallen:p.ausgefallen==='ja', grund:p.grund, anwesend:liste(p.anwesend), plan:liste(p.plan)})),
    status: alle('Status').filter(s => leitend || s.mitgliedId === me.id),
    wuensche: alle('Wuensche').filter(w => leitend || w.mitgliedId === me.id),
    einstellungen: einstellungen(),
    spiele: alle('Spiele'),
    vorschlaege: leitend ? alle('Vorschlaege') : []
  };
}

function einstellungen(){
  const o = {};
  alle('Einstellungen').forEach(e => { o[e.key] = e.wert; });
  return o;
}
function einstellungSpeichern(req){
  if(BILD_KEYS.indexOf(req.key) < 0) return {ok:false, msg:'Unbekannte Einstellung.'};
  const wert = String(req.wert || '');
  if(wert.length > 45000) return {ok:false, msg:'Das Bild ist zu groß.'};
  const l = alle('Einstellungen').filter(e => e.key !== req.key);
  if(wert) l.push({key:req.key, wert:wert});
  schreibe('Einstellungen', l);
  return {ok:true};
}

/* ---------- Teilnehmer-Aktionen ---------- */
function statusSetzen(me, req){
  const proben = alle('Proben');
  const p = proben.find(x => x.id === req.probeId);
  if(!p) return {ok:false, msg:'Probe nicht gefunden.'};
  const st = alle('Status').filter(s => !(s.probeId === req.probeId && s.mitgliedId === me.id));
  let an = liste(p.anwesend).filter(x => x !== me.id);
  if(req.status === 'komme' || req.status === 'nicht') st.push({probeId:req.probeId, mitgliedId:me.id, status:req.status, zeit:''});
  if(req.status === 'komme') an.push(me.id);
  p.anwesend = an.join(',');
  schreibe('Status', st);
  schreibe('Proben', proben);
  return {ok:true};
}
function wunschSetzen(me, req){
  const w = alle('Wuensche').filter(x => !(x.probeId === req.probeId && x.mitgliedId === me.id && x.spielId === req.spielId));
  if(req.wunsch === 'lieblings' || req.wunsch === 'hass'){
    w.push({probeId:req.probeId, mitgliedId:me.id, spielId:req.spielId, wunsch:req.wunsch});
  }
  schreibe('Wuensche', w);
  return {ok:true};
}
function vorschlagEinreichen(me, req){
  const v = alle('Vorschlaege');
  v.push({id:'v'+Date.now(), typ:req.typ, kategorie:req.kategorie || '', titel:String(req.titel||''), beschr:req.beschr || '', von:me.vorname, datum:heuteIso()});
  schreibe('Vorschlaege', v);
  sendeMail('Impro-App: Neuer Vorschlag', me.vorname + ' schlägt vor (' + req.typ + ', ' + (req.kategorie||'') + '): ' + String(req.titel||'') + '\n\nBitte in der App unter Profil > Leitung > Vorschläge prüfen.');
  return {ok:true};
}
function profilSpeichern(me, req){
  const mit = alle('Mitglieder');
  const m = mit.find(x => x.id === me.id);
  m.nachname = String(req.nachname || '').slice(0,60);
  if(req.bild !== undefined){ const b = String(req.bild || ''); if(b.length > 40000) return {ok:false, msg:'Das Bild ist zu groß.'}; m.bild = b; }
  schreibe('Mitglieder', mit);
  return {ok:true};
}

/* ---------- Leitungs-Aktionen ---------- */
function probeSpeichern(req){
  const proben = alle('Proben');
  const p = proben.find(x => x.id === req.probeId);
  if(!p) return {ok:false, msg:'Probe nicht gefunden.'};
  p.ausgefallen = req.ausgefallen ? 'ja' : 'nein';
  p.grund = req.ausgefallen ? String(req.grund || '') : '';
  if(Array.isArray(req.anwesend)) p.anwesend = req.anwesend.join(',');
  if(Array.isArray(req.plan)) p.plan = req.plan.join(',');
  schreibe('Proben', proben);
  return {ok:true};
}
function mitgliedSpeichern(req){
  const mit = alle('Mitglieder');
  const m = mit.find(x => x.id === req.mitglied.id);
  if(!m) return {ok:false, msg:'Nicht gefunden.'};
  const f = req.mitglied;
  ['vorname','nachname','seit','mail','tel','chatTyp','chatWert','notiz'].forEach(k => {
    if(f[k] !== undefined) m[k] = String(f[k]);
  });
  if(f.aktiv !== undefined) m.aktiv = f.aktiv ? 'ja' : 'nein';
  schreibe('Mitglieder', mit);
  return {ok:true};
}
function mitgliedNeu(req){
  const mit = alle('Mitglieder');
  mit.push({id:'m'+Date.now(), vorname:String(req.vorname||''), nachname:String(req.nachname||''), seit:String(req.seit || datumDe()), gruppenleiter:'nein', aktiv:'ja', pinHash:'', mail:'', tel:'', chatTyp:'', chatWert:'', notiz:''});
  schreibe('Mitglieder', mit);
  return {ok:true};
}
function pinZuruecksetzen(req){
  const mit = alle('Mitglieder');
  const m = mit.find(x => x.id === req.mid);
  if(!m) return {ok:false, msg:'Nicht gefunden.'};
  m.pinHash = '';
  schreibe('Mitglieder', mit);
  return {ok:true};
}
function vorschlagPruefen(req){
  const v = alle('Vorschlaege');
  const e = v.find(x => x.id === req.vid);
  if(!e) return {ok:false, msg:'Nicht gefunden.'};
  if(req.aktion === 'uebernehmen'){
    if(e.typ === 'teilnehmer-anfrage'){
      const mit = alle('Mitglieder');
      mit.push({id:'m'+Date.now(), vorname:e.titel, nachname:'', seit:datumDe(), gruppenleiter:'nein', aktiv:'ja', pinHash:'', mail:'', tel:'', chatTyp:'', chatWert:'', notiz:''});
      schreibe('Mitglieder', mit);
    } else {
      const sp = alle('Spiele');
      sp.push({id:'x'+Date.now(), titel:e.titel, kat:e.kategorie, art:(e.typ === 'Vorgabe' ? 'vorgabe' : 'uebung'), tn:'', dauer:'', level:'Einsteiger', ablauf:e.beschr});
      schreibe('Spiele', sp);
    }
  }
  schreibe('Vorschlaege', v.filter(x => x.id !== req.vid));
  return {ok:true};
}
function spielNeu(req){
  const sp = alle('Spiele');
  sp.push({id:'x'+Date.now(), titel:String(req.titel||''), kat:String(req.kat||''), art:String(req.art||'spiel'), tn:String(req.tn||''), dauer:String(req.dauer||''), level:String(req.level||''), ablauf:String(req.ablauf||'')});
  schreibe('Spiele', sp);
  return {ok:true};
}

function spielSpeichern(req){
  const sp = alle('Spiele');
  const f = req.eintrag || {};
  let e = f.id ? sp.find(x => x.id === f.id) : null;
  if(!e){
    e = {id:'x'+Date.now(), titel:'', kat:'', art:'uebung', tn:'', dauer:'', level:'', ablauf:'', eig:''};
    sp.push(e);
  }
  ['titel','kat','art','tn','dauer','level','ablauf','eig'].forEach(k => { if(f[k] !== undefined) e[k] = String(f[k]); });
  schreibe('Spiele', sp);
  return {ok:true, id:e.id};
}
function spielLoeschen(req){
  schreibe('Spiele', alle('Spiele').filter(x => x.id !== req.sid));
  schreibe('Wuensche', alle('Wuensche').filter(w => w.spielId !== req.sid));
  const proben = alle('Proben');
  proben.forEach(p => { p.plan = liste(p.plan).filter(x => x !== req.sid).join(','); });
  schreibe('Proben', proben);
  return {ok:true};
}

/* ---------- Einmalig ausführen (Version 13): Übungen in die neuen Kategorien sortieren ---------- */
// Zuordnung nach Titel. Was hier nicht steht, bekommt die Kategorie nach der alten Liste.
const NEUE_KAT_NACH_TITEL = {
  'Grommolo Switch':'Zweierübungen', 'Letztes Wort, erstes Wort':'Zweierübungen', 'ABC Spiel':'Zweierübungen',
  'Drei Regeln':'Zweierübungen', 'Akzeptieren':'Zweierübungen', 'Geschichten gleichzeitig erzählen':'Zweierübungen',
  'Ja, genau und dann …':'Zweierübungen', 'Ja, aber …':'Zweierübungen', 'Ja und':'Zweierübungen',
  'Erfinder-Talkshow':'Zweierübungen', 'Experte':'Zweierübungen',
  'Grommolo Übersetzer':'Dreierübungen', 'Drei Tote':'Dreierübungen', 'Gebärdendolmetscher':'Dreierübungen',
  'Tod in einer Minute (30, 15, 10, 5)':'Gruppenübungen', 'Gefühlsreplay':'Gruppenübungen', 'Genrereplay':'Gruppenübungen',
  'Aus der Sicht von':'Gruppenübungen', 'Orte Switch':'Gruppenübungen', 'Day before – Day after':'Gruppenübungen',
  '4-Satzgeschichte':'Gruppenübungen', 'Freeze':'Gruppenübungen', 'Whose Line is it anyways':'Gruppenübungen',
  'Au Ja!':'Warm-Up-Spiele', 'Big Booty':'Warm-Up-Spiele', 'Einwortgeschichte':'Warm-Up-Spiele',
  'Toaster-Spiel':'Warm-Up-Spiele', 'Wachsmaske':'Warm-Up-Spiele'
};
const ALTE_KAT = {'2er':'Zweierübungen', '3er':'Dreierübungen', 'Gruppe':'Gruppenübungen', 'Warm-Up':'Warm-Up-Spiele'};

// Bitte EINMAL manuell ausführen: Im Apps-Script-Editor oben „katUmbauenEinmal" auswählen → Ausführen.
function katUmbauenEinmal(){
  const props = PropertiesService.getScriptProperties();
  if(props.getProperty('katUmbau13') === '1'){ Logger.log('Schon erledigt.'); return; }
  const sp = alle('Spiele');
  sp.forEach(s => {
    if(s.art !== 'uebung') return;
    s.kat = NEUE_KAT_NACH_TITEL[s.titel] || ALTE_KAT[s.kat] || s.kat;
    s.tn = '';
  });
  schreibe('Spiele', sp);
  props.setProperty('katUmbau13', '1');
  Logger.log('Fertig: Übungen sind umsortiert.');
}

/* ---------- Einmalig ausführen: legt Blätter und Teilnehmer an ---------- */
function einrichten(){
  Object.keys(TABELLEN).forEach(n => blatt(n));
  if(alle('Mitglieder').length === 0){
    const start = [{id:'L', vorname:'Leon', nachname:'Eckervogt', seit:'04.02.2019', gruppenleiter:'ja', aktiv:'ja', pinHash:'', mail:'eckervogt@outlook.de', tel:'', chatTyp:'', chatWert:'', notiz:''}];
    ['Joscha','Gladys','Heike','Jessy','Juliana','Regina','Werner','Yolanda','Bianca','Renate'].forEach((n,i) => {
      start.push({id:'m'+i, vorname:n, nachname:'', seit:'12.03.2022', gruppenleiter:'nein', aktiv:'ja', pinHash:'', mail:'', tel:'', chatTyp:'', chatWert:'', notiz:''});
    });
    schreibe('Mitglieder', start);
  }
  sichereProben();
}


/* ---------- Einmalig ausführen: Hinweise bei den Persönlichkeiten leeren ---------- */
// Entfernt nur den Hinweis-Text (Feld Ablauf) bei Vorgaben der Kategorie Persönlichkeiten.
// Die Vorgaben selbst bleiben erhalten.
function hinweiseEntfernen(){
  const kategorie = 'Persönlichkeiten';
  const sp = alle('Spiele');
  let anzahl = 0;
  sp.forEach(s => {
    if(s.art === 'vorgabe' && s.kat === kategorie && s.ablauf){
      s.ablauf = '';
      anzahl++;
    }
  });
  schreibe('Spiele', sp);
  Logger.log('Hinweise geleert: ' + anzahl);
}

/* ---------- Einmalig ausführen: Persönlichkeiten neu beschreiben (Name + Bekanntheit) ---------- */
// Setzt bei jeder Persönlichkeit den Namen als Titel und darunter den Grund, warum sie bekannt ist.
// Zitate und Beschreibungen werden entfernt. Die Kategorie bleibt Persönlichkeiten.
const PERSOENLICHKEITEN_NEU = [
  ['Angela Merkel', 'Bundeskanzlerin 2005–2021'],
  ['Helmut Kohl', 'Bundeskanzler 1982–1998'],
  ['Gerhard Schröder', 'Bundeskanzler 1998–2005'],
  ['Edmund Stoiber', 'Ministerpräsident von Bayern 1993–2007'],
  ['Olaf Scholz', 'Bundeskanzler 2021–2025'],
  ['Christian Lindner', 'Bundesfinanzminister 2021–2024'],
  ['Robert Habeck', 'Bundeswirtschaftsminister 2021–2025'],
  ['Karl Lauterbach', 'Bundesgesundheitsminister 2021–2025'],
  ['Gregor Gysi', 'Politiker (Die Linke)'],
  ['Donald Trump', 'US-Präsident 2017–2021 und seit 2025'],
  ['Jürgen Klopp', 'Trainer des FC Liverpool 2015–2024'],
  ['Franz Beckenbauer', 'Fußball-Weltmeister als Spieler (1974) und Trainer (1990)'],
  ['Oliver Kahn', 'Torwart des FC Bayern und der Nationalmannschaft'],
  ['Lothar Matthäus', 'Deutscher Fußballnationalspieler 1980–2000'],
  ['Zlatan Ibrahimović', 'Schwedischer Fußballstar'],
  ['Muhammad Ali', 'Boxweltmeister im Schwergewicht'],
  ['Heidi Klum', 'Model und Moderatorin von „Germany’s Next Topmodel“'],
  ['Dieter Bohlen', 'Musikproduzent und Juror bei „Deutschland sucht den Superstar“'],
  ['Verona Pooth', 'Moderatorin und Werbegesicht'],
  ['Günther Jauch', 'Moderator von „Wer wird Millionär?“'],
  ['Thomas Gottschalk', 'Moderator von „Wetten, dass..?“'],
  ['Karl Lagerfeld', 'Modedesigner'],
  ['Udo Lindenberg', 'Rockmusiker'],
  ['Helge Schneider', 'Komiker und Musiker'],
  ['Arnold Schwarzenegger', 'Schauspieler, bekannt aus „Terminator“'],
  ['Robert De Niro', 'Schauspieler, bekannt aus „Taxi Driver“'],
  ['Christopher Walken', 'Schauspieler, bekannt aus „Pulp Fiction“'],
  ['Mr. Bean', 'Kunstfigur, gespielt von Rowan Atkinson'],
  ['Borat', 'Kunstfigur, gespielt von Sacha Baron Cohen'],
  ['Gollum', 'Figur aus „Der Herr der Ringe“'],
  ['Fischer', 'Außenminister 1998–2005 (Grüne)'],
  ['Annalena Baerbock', 'Bundesaußenministerin 2021–2025'],
  ['Katharina Reiche', 'CDU-Politikerin'],
  ['Emmanuel Macron', 'Französischer Präsident seit 2017'],
  ['Lukas Podolski', 'Deutscher Fußballnationalspieler 2004–2017'],
  ['Ariana Grande', 'US-Popsängerin'],
  ['Bushido', 'Rapper'],
  ['Monk', 'Titelfigur der Serie „Monk“'],
  ['Klaus Kinski', 'Schauspieler'],
  ['Pumuckl', 'Kobold aus der Kinderserie, Geselle von Meister Eder'],
  ['Goofy', 'Disney-Figur'],
  ['Bibi Blocksberg', 'Titelfigur der Kinderhörspiele, eine Hexe'],
  ['Pipi Langstrumpf', 'Titelfigur der Kinderbücher von Astrid Lindgren'],
  ['Obelix', 'Comicfigur aus „Asterix“']
];
function persoenlichkeitenNeu(){
  const sp = alle('Spiele');
  let neu = 0, nichtGefunden = [];
  PERSOENLICHKEITEN_NEU.forEach(([name, grund]) => {
    const e = sp.find(s => s.art === 'vorgabe' && s.kat === 'Persönlichkeiten' && (s.titel === name || s.titel.indexOf(name + ' –') === 0));
    if(e){ e.titel = name; e.ablauf = grund; neu++; }
    else nichtGefunden.push(name);
  });
  schreibe('Spiele', sp);
  Logger.log('Aktualisiert: ' + neu + ' | nicht gefunden: ' + nichtGefunden.join(', '));
}