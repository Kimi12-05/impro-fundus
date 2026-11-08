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
// Zuordnung der Übungen zu den Bereichen der Fundus-Website (einmalig auf das Blatt übertragen)
const KAT_KORREKTUR = {
  "Grommolo Übersetzer": "3er",
  "Grommolo Switch": "2er",
  "Drei Tote": "3er",
  "Letztes Wort, erstes Wort": "2er",
  "ABC Spiel": "2er",
  "Drei Regeln": "2er",
  "Tod in einer Minute (30, 15, 10, 5)": "Gruppe",
  "Gefühlsreplay": "Gruppe",
  "Genrereplay": "Gruppe",
  "Gebärdendolmetscher": "3er",
  "Aus der Sicht von": "Gruppe",
  "Akzeptieren": "2er",
  "Au Ja!": "Warm-Up",
  "Geschichten gleichzeitig erzählen": "2er",
  "Orte Switch": "Gruppe",
  "Day before – Day after": "Gruppe",
  "Big Booty": "Warm-Up",
  "4-Satzgeschichte": "Gruppe",
  "Ja, genau und dann …": "2er",
  "Ja, aber …": "2er",
  "Freeze": "Gruppe",
  "Einwortgeschichte": "Warm-Up",
  "Erfinder-Talkshow": "2er",
  "Whose Line is it anyways": "Gruppe",
  "Ja und": "2er",
  "Experte": "2er",
  "Toaster-Spiel": "Warm-Up",
  "Wachsmaske": "Warm-Up"
};
// Die Website zeigt die langen Namen, im Blatt stehen noch die alten Kürzel
const KAT_ALT = {'2er':'Zweierübungen', '3er':'Dreierübungen', 'Gruppe':'Gruppenübungen', 'Warm-Up':'Warm-Up-Spiele'};
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
  if(props.getProperty('katFix3') !== '1' && props.getProperty('startdaten2') === '1'){
    props.setProperty('katFix3','1');
    const sp = alle('Spiele');
    sp.forEach(s => { if(KAT_KORREKTUR[s.titel]) s.kat = KAT_KORREKTUR[s.titel]; });
    schreibe('Spiele', sp);
  }
  if(props.getProperty('startdaten2') === '1'){ personenEinspielen(props, personenNachtragen); wikiEinspielen(props); return; }
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
  wikiEinspielen(props);
}
function personenEinspielen(props, nachtragen){
  if(props.getProperty('personen2') === '1') return;
  props.setProperty('personen2','1');
  const sp = alle('Spiele').filter(s => !/^p\d+$/.test(String(s.id)));
  START_PERSONEN.forEach((v,i) => sp.push({id:'p'+(i+1), titel:v[1], kat:v[0], art:'vorgabe', tn:'', dauer:'', level:'', ablauf:v[3] || '', eig:v[2]}));
  schreibe('Spiele', sp);
}

/* ---------- Zusätzliche Übungen und Vorgaben (eigene Beschreibungen, einmaliger Import) ---------- */
// Übung: [Titel, Kategorie, Teilnehmer, Level, Ablauf]
const WIKI_UEBUNGEN = [["Bunny Bunny", "Warm-Up-Spiele", "", "Einsteiger", "5 bis 20 Personen\n\nAlle stehen im Kreis und finden gemeinsam einen Grundrhythmus, zum Beispiel durch leichtes Wippen oder Stampfen und einen tiefen, immer gleichen Laut.\n\nEine Person gibt den Hasen-Impuls: Sie macht schnell zwei Gesten zu den eigenen Augen und schickt den Impuls dann mit klarem Blick zu jemandem im Kreis. Die beiden Nachbarn dieser Person reagieren sofort mit vollem Körpereinsatz und einem Anfeuerungsruf. Danach ist die angesprochene Person mit dem nächsten Impuls dran.\n\nDas Tempo steigt von selbst, bis Koordination und Aussprache zusammenbrechen und alle lachen. Wichtig sind klarer Blickkontakt beim Weitergeben und der Mut, nicht an den eigenen Händen zu kleben. Am besten startet ihr langsam, bis der Rhythmus sitzt."], ["Gemeinsam zählen", "Warm-Up-Spiele", "", "Einsteiger", "4 bis 20 Personen\n\nAlle stehen dicht im Kreis, die Augen sind geschlossen oder der Blick geht nach unten.\n\nDie Gruppe zählt gemeinsam bis 21. Eine Reihenfolge gibt es nicht: Wer die nächste Zahl spürt, sagt sie. Es können schnell mehrere Zahlen hintereinander kommen oder lange Pausen entstehen. Sprechen zwei Personen gleichzeitig dieselbe Zahl, beginnt die Gruppe wieder bei eins.\n\nVariante: Statt Zahlen werden Buchstaben genannt, entweder das ganze Alphabet oder so lange, bis jede Person einmal einen Buchstaben gesagt hat.\n\nDie Übung schult Konzentration und das Gespür füreinander."], ["Gerüchte", "Warm-Up-Spiele", "", "Einsteiger", "4 bis 15 Personen\n\nAlle stehen im Kreis. Person A erzählt ihrer Nachbarin B ein frei erfundenes Gerücht. B greift es auf, ergänzt Details und übertreibt es. Dann lachen A und B kurz zusammen.\n\nJetzt flüstert B ein neues Gerücht an die nächste Person im Kreis weiter, und das Spiel beginnt von vorn.\n\nTrainiert werden Angebote machen und annehmen, Ideen weiterspinnen und freies Erzählen."], ["Namenssilben", "Kennenlernspiele", "", "Einsteiger", "4 bis 20 Personen\n\nAlle stehen im Kreis.\n\nRunde 1: Reihum nennt jede Person ihren Namen und macht zu jeder Silbe eine eigene Geste.\n\nRunde 2: Eine Person nennt den Namen einer anderen und macht dabei deren Gesten nach. Die genannte Person wiederholt ihren Namen mit den Gesten und ruft danach den Namen der nächsten Person auf.\n\nSo lernt die Gruppe Namen über Bewegung, und die Aufmerksamkeit bleibt hoch."], ["Vier Ecken", "Kennenlernspiele", "", "Einsteiger", "4 bis 30 Personen. Ihr braucht Papier und Stifte.\n\nJede Person faltet ein Blatt so, dass vier gleich große Felder entstehen. Die Gruppe legt vorher vier Themen fest, zum Beispiel Hobbys, Traumreiseziel, ein Tier, das ich gern wäre, und das Wichtigste im Leben.\n\nJede Person zeichnet sich in 5 bis 10 Minuten zu jedem Thema in ein Feld. Zeichentalent ist nicht nötig. Danach kommt die Gruppe zusammen, und alle stellen sich anhand ihrer Bilder vor.\n\nDie Übung dauert etwa 15 Minuten und eignet sich als ruhiger Einstieg."], ["Wahrheit und Lüge", "Kennenlernspiele", "", "Einsteiger", "4 bis 20 Personen\n\nAlle stehen im Kreis. Jede Person nennt ihren Namen und zwei Aussagen über sich. Eine davon stimmt, die andere ist erfunden.\n\nDanach zeigt die erste Person auf jemand anderen, wiederholt dessen Namen und beide Aussagen. Diese Person macht mit einer weiteren Person weiter.\n\nNach einigen Runden rät die Gruppe, welche der Aussagen jeweils die Lüge war.\n\nDas Spiel verbindet Kennenlernen mit Aufmerksamkeit und Gedächtnis."], ["Simon Says", "Warm-Up-Spiele", "", "Einsteiger", "4 bis 30 Personen\n\nEine Person leitet das Spiel und gibt Anweisungen wie „Hände hoch“ oder „Einmal im Kreis drehen“. Die anderen führen eine Anweisung nur aus, wenn vorher „Simon says“ gesagt wurde.\n\nWer ohne diese Ansage mitmacht, auch nur angedeutet, scheidet aus. Das Spiel läuft, bis eine Person übrig bleibt. Diese kann in der nächsten Runde die Leitung übernehmen.\n\nEin schneller Konzentrationsstarter, bei dem alle schnell hellwach sind."], ["Autowaschanlage", "Gruppenübungen", "", "Einsteiger", "6 bis 20 Personen\n\nDie Gruppe bildet zwei Reihen, sodass sich immer zwei Personen gegenüberstehen, etwa eine Armlänge entfernt. Zusammen ergeben die Paare die Waschanlage.\n\nEine Person nach der anderen geht langsam durch die Anlage. Jedes Paar behandelt sie nacheinander: Das erste Paar „wäscht“ mit einer festen Massage, das nächste streicht sanft über den Oberkörper und so weiter. Dann stellt sich die Person ans Ende der Reihe, und die nächste ist dran.\n\nDie Übung ist ruhig und fördert Vertrauen und Aufmerksamkeit. Sie eignet sich gut als entspannter Abschluss eines Trainings. Wer nicht berührt werden möchte, darf jederzeit aussetzen."], ["Wir bauen eine Maschine", "Gruppenübungen", "", "Einsteiger", "4 bis 15 Personen\n\nDas Publikum oder die Gruppe nennt den Namen einer erfundenen Maschine. Eine Person beginnt und wird ein Teil der Maschine: Sie nimmt eine Haltung ein und wiederholt eine Bewegung, gern mit einem Geräusch.\n\nNacheinander kommen alle anderen dazu und ergänzen die Maschine mit eigenen Teilen. Am schönsten wird es, wenn die Teile miteinander arbeiten, zum Beispiel indem sich zwei Hände einen imaginären Gegenstand zureichen.\n\nSind alle dabei, wird die Maschine immer schneller, bis sie explodiert."], ["Dinge anders benennen", "Warm-Up-Spiele", "", "Einsteiger", "3 bis 15 Personen\n\nAlle gehen frei durch den Raum.\n\nRunde 1: Die Gruppe berührt Gegenstände wie Wand, Heizkörper oder Stuhl und benennt sie richtig. Das dauert ein bis zwei Minuten.\n\nRunde 2: Alles wird absichtlich falsch benannt, zum Beispiel der Stuhl als „Apfelmus“. Wer schnell sein will, nutzt eine Assoziationskette im Kopf.\n\nZum Schluss tauscht die Gruppe aus, wie sich der Raum dadurch angefühlt hat. Die Übung hilft, einen neuen Raum vertraut zu machen, und trainiert flexibles Denken."], ["Ich packe meinen Koffer", "Warm-Up-Spiele", "", "Einsteiger", "4 bis 20 Personen\n\nAlle stehen im Kreis. Die erste Person sagt „Ich packe meinen Koffer und nehme mit …“ und nennt einen Gegenstand. Die nächste Person wiederholt den Satz mit allen bisherigen Gegenständen in der richtigen Reihenfolge und fügt einen neuen hinzu. So wird die Liste immer länger.\n\nDie Gegenstände müssen nicht real sein, absurde Ideen sind erwünscht.\n\nVariante zum Kennenlernen: Statt Gegenständen nennt jede Person etwas über sich, zum Beispiel Name, Wohnort und Lieblingsessen. Alle wiederholen die Angaben der Vorgänger."], ["Heldenreise", "Gruppenübungen", "", "Fortgeschritten", "Eine Langform für eine größere Gruppe\n\nDie Heldenreise ist ein bekanntes Erzählmuster. Es dreht sich um eine Hauptfigur, den Helden, der seine gewohnte Welt verlässt und verändert zurückkehrt.\n\nTypische Stationen: Die gewohnte Welt wird gezeigt. Ein Ruf zum Abenteuer kommt, zunächst zögert der Held. Dann bricht er auf und überschreitet die erste Schwelle. Es folgen Prüfungen, neue Verbündete und Feinde, eine tiefste Krise und eine Belohnung. Am Ende kommt der Rückweg und die Heimkehr mit neuen Einsichten.\n\nDie anderen Spielenden übernehmen Rollen wie Mentor, Herold, Schwellenhüter, Schatten oder Trickster. Auch Gegenstände oder Ängste können solche Rollen sein.\n\nDie Form setzt Erfahrung mit Dramaturgie und Langformen voraus."], ["Protagonist und Antagonist", "Zweierübungen", "", "Fortgeschritten", "2 Personen, nach Bedarf mehr\n\nIn einer Geschichte gibt es meist eine Hauptfigur, den Protagonisten. Er hat ein Ziel, ein Problem oder einen Konflikt und steht lange im Mittelpunkt. Der Antagonist ist sein Gegenspieler und stellt sich ihm in den Weg, zum Beispiel durch Intrigen, Täuschung oder Prüfungen. Er kann auch eine Gruppe, die Natur oder ein inneres Hindernis sein.\n\nÜbung: Eine Person spielt den Protagonisten und legt in den ersten Sätzen ein klares Ziel fest. Die zweite Person spielt den Antagonisten und versucht, genau dieses Ziel zu verhindern. Beide spielen so, dass der Konflikt sichtbar bleibt, und suchen am Ende eine Lösung.\n\nNach einer Runde tauschen die Rollen."], ["Klassischer Statuswechsel", "Zweierübungen", "", "Fortgeschritten", "2 Personen\n\nZwei Spielende haben gegensätzlichen Status: Eine Person tritt hoch auf, die andere niedrig. Das Publikum schlägt einen Beruf oder eine Situation vor, zum Beispiel Chef und Angestellte.\n\nIm Verlauf der Szene kippt der Status. Meist löst die Person mit dem niedrigen Status den Umschwung aus. Die Person im Hochstatus kann durch ihr Spiel Anstöße geben. Beide warten geduldig, bis es in der Szene einen nachvollziehbaren Grund gibt, und lassen den Status dann Schritt für Schritt kippen.\n\nVariante: Die Rollen werden umgedreht, zum Beispiel ist der Angestellte zu Beginn im Hochstatus. Der Umschwung geschieht dann deutlich schneller.\n\nTrainiert werden Figurenspiel und Aufmerksamkeit."], ["Blind Date", "Zweierübungen", "", "Einsteiger", "2 Personen\n\nJede Person bekommt Vorgaben zu Geschlecht, Alter und Namen sowie einen Beruf oder eine geheime Sehnsucht. Dazu kommt ein fester Treffpunkt.\n\nDie beiden begegnen sich zum ersten Mal und spielen die Szene so, dass sie sich ineinander verlieben.\n\nEine ruhige Übung, bei der es auf Zuhören und Angebote ankommt. Eine Variante ist Schizo Blind Date."], ["Gefühlstaxi", "Gruppenübungen", "", "Einsteiger", "4 Personen\n\nZwei mal zwei Stühle bilden das Taxi. Drei Personen sitzen darin: vorne Fahrerin und Beifahrerin, hinten ein Fahrgast. Die vierte Person steht an der Straße.\n\nDie Person an der Straße hat ein Gefühl, eine Haltung oder einen Subtext. Das Taxi hält, sie steigt hinten ein, und ab jetzt übernehmen alle Insassen ihr Gefühl. Die Intensität darf nach und nach wachsen.\n\nSteigt die Fahrerin aus, rückt die Beifahrerin auf den Fahrersitz, der Fahrgast nach vorn, und die Neue sitzt hinten. Die Gruppe behält das letzte Gefühl, bis der nächste Fahrgast einsteigt.\n\nLebhaft und gut für Einsteiger. Verwandt mit dem Anhalter."], ["Trizophrenie", "Gruppenübungen", "", "Einsteiger", "4 Personen, davon stehen immer nur 2 gleichzeitig auf der Bühne\n\nEine Figur hat drei Persönlichkeiten, die von drei Spielenden abwechselnd gespielt werden. Die vierte Person spielt den Gegenpart und erlebt die Figur als eine einzige Person.\n\nDas Publikum ordnet jeder der drei Persönlichkeiten ein Gefühl zu. Ein Wechsel erfolgt durch Klatschen: Die aktive Person wird abgelöst, und die nächste führt die Szene mit ihrem eigenen Gefühl fort. Der Gegenpart muss auf die wechselnden Stimmungen reagieren und sich schnell darauf einstellen."], ["Der Anhalter", "Gruppenübungen", "", "Einsteiger", "3 bis 10 Personen\n\nZwei Spielende sitzen nebeneinander in einem Auto: eine fährt, eine sitzt als Beifahrerin. Am Straßenrand steht ein Anhalter, der mitgenommen wird.\n\nDer Anhalter wird zum Beifahrer, die bisherige Beifahrerin wird Fahrerin, und der bisherige Fahrer steigt aus und wird der nächste Anhalter.\n\nJeder Anhalter bringt einen Charakter, ein Gefühl oder einen Tick mit. Dieser steckt die Mitfahrenden nach und nach an, oder alle übernehmen ihn auf einmal.\n\nVariante: Mit vier Spielenden sitzt eine Person hinten, sodass immer drei im Auto sind. Verwandt mit dem Gefühlstaxi."], ["Dutch Square", "Gruppenübungen", "", "Fortgeschritten", "4 Personen\n\nDie Spielenden stehen im Quadrat: vorne A (links) und B (rechts), hinten C (links) und D (rechts). Das Publikum legt für jede Person ein Genre fest.\n\nA und B beginnen eine Szene im Genre von B. Wenn C oder D klatscht, dreht sich das Quadrat im Uhrzeigersinn. Jetzt spielen D und B eine neue Szene im Genre von D. Beim nächsten Klatschen spielen C und D im Genre von C, und so weiter. Jede Paarung erzählt ihre eigene Geschichte.\n\nNach vier Drehungen gehen alle Geschichten weiter, Zeitsprünge sind erlaubt. Jedes Paar spielt meist drei Szenen: Zuerst Grundinfos und gute Stimmung, dann ein Konflikt, dann eine Lösung. Ziel ist es, alle vier Geschichten zu Ende zu erzählen.\n\nVarianten: Mit drei Personen, mit freien Vorgaben statt Genres oder mit einer Drehung gegen den Uhrzeigersinn."], ["Reklamation", "Gruppenübungen", "", "Einsteiger", "3 bis 5 Personen\n\nEine Person verlässt den Raum. Die anderen bilden eine Szene, zum Beispiel als Verkäufer und Kunden. Das Publikum legt einen absurden Gegenstand fest, den die Person später umtauschen soll. Alle außer ihr kennen ihn.\n\nDie Person kommt zurück und muss durch Fragen herausfinden, worum es geht. Wirkt sie ratlos, greifen die anderen ein und geben als Personal oder Kundschaft versteckte Hinweise.\n\nEin lebhaftes Ratespiel, das Aufmerksamkeit und Figurenspiel schult."], ["Synchro Replay", "Gruppenübungen", "", "Einsteiger", "2 bis 6 Personen\n\nEine Gruppe von zwei bis drei Spielenden spielt eine Grundszene mit Ton. Die zweite, gleich große Gruppe wartet draußen und sieht die Szene nicht.\n\nDie wartende Gruppe kommt herein. Die Grundszene wird noch einmal ohne Ton gespielt, und die neue Gruppe spricht die Dialoge live dazu. Die Bewegungen bleiben gleich, aber es entsteht eine ganz neue Geschichte.\n\nIm Match synchronisiert jedes Team die Grundszene einmal."], ["Drei Telefonate", "Dreierübungen", "", "Fortgeschritten", "3 Personen\n\nDie Spielenden stehen in einer Reihe. Das Publikum nennt drei möglichst verschiedene Themen. Person 1 beginnt ein Telefonat mit einer unsichtbaren Gesprächspartnerin, mit passender Haltung und Gestik. Nach ein paar Sätzen steigt Person 2 mit einem eigenen Telefonat ein, dann Person 3.\n\nNach der Startrunde gilt die Hauptregel: Jede Person beginnt ihren Einsatz mit dem letzten Wort der vorherigen Person. Die Reihenfolge der Wechsel ist frei. Sehr kurze Pausen im Redefluss zeigen an, dass jemand übernehmen kann.\n\nTipps: Wechsel kurz halten und sich die Sätze der unsichtbaren Gesprächspartnerin gedanklich vorstellen."], ["Davor oder danach", "Gruppenübungen", "", "Fortgeschritten", "2 bis 6 Personen\n\nEine Startszene wird von mindestens zwei Personen gespielt. Danach entscheidet das Publikum, ob die nächste Szene zeitlich davor oder danach spielt. Die gewählte Szene wird gespielt, dann wird das Publikum erneut gefragt.\n\nMuss eine Zeitebene noch einmal gespielt werden, geschieht das wie bei einem Replay: Details werden ergänzt oder verändert, und Infos aus anderen Szenen werden eingebaut.\n\nDie Übung lässt sich auch als Langform spielen und trainiert Erzählen und Figurenspiel."], ["Zugerufene Begriffe sofort einbauen", "Gruppenübungen", "", "Einsteiger", "2 bis 4 Personen\n\nZwei oder drei Spielende improvisieren eine Szene zu einer frei gewählten Vorgabe. Eine weitere Person, die Spielleitung oder ein Freiwilliger, ruft immer wieder zufällige Begriffe in die Szene.\n\nDie Spielenden bauen jeden Begriff sofort und glaubwürdig in die Handlung ein. Tipp für die Zurufenden: Begriffe wählen, die möglichst wenig zur Szene passen. Das sorgt für Überraschungen.\n\nVariante: Zwei Zurufende stehen seitlich und wechseln sich ab.\n\nLebhaft und schnell, gut für Einsteiger."], ["Zettelspiel", "Gruppenübungen", "", "Einsteiger", "2 bis 5 Personen\n\nZuschauende schreiben vor dem Spiel einfache, gut lesbare Sätze auf Zettel. Die Zettel liegen mit der beschrifteten Seite nach unten auf der Bühne.\n\nDie Spielenden etablieren zuerst eine Szene. Immer wieder hebt jemand einen Zettel auf, auch das Aufheben soll zur Szene passen. Sobald die Person den Satz gelesen hat, muss sie ihn sofort sinnvoll in die Handlung einbauen. Bis dahin darf sie nur handeln.\n\nTipps: Vor dem Satz oft eine einleitende Aussage mit Doppelpunkt sprechen. Gelesene Zettel einstecken oder zerknüllen. Sind es zu viele Zettel, wählt vorher eine überschaubare Anzahl aus.\n\nVariante: Ein Zettel darf nur aufgehoben werden, wenn die Spielleitung klatscht."], ["Zitate", "Gruppenübungen", "", "Einsteiger", "2 bis 5 Personen\n\nDas Publikum schreibt bekannte Zitate auf Zettel. Die Spielenden bekommen die Zettel und verstauen sie.\n\nSie spielen eine Szene zu einem vorgegebenen Thema und bauen die Zitate passend in die Handlung ein. Wichtig ist, dass sie auf die eingebauten Zitate glaubwürdig reagieren.\n\nVerwandt mit dem Zettelspiel."], ["Sitzen, Stehen, Liegen", "Dreierübungen", "", "Einsteiger", "3 bis 4 Personen\n\nEine Szene wird auf drei Ebenen gespielt: Eine Person sitzt, eine steht, eine liegt. Diese Dreierbalance muss durchgehend bestehen bleiben.\n\nWechselt eine Person ihre Ebene, nimmt sofort jemand anderes die frei gewordene Ebene ein. Die genaue Körperhaltung muss nicht kopiert werden, nur die Ebene. Jeder Wechsel soll im Spiel plausibel begründet werden.\n\nSo achten alle aufeinander, und die Szene bleibt in Bewegung. Varianten: Mit Knien oder Bücken als zusätzliche Ebene, dann spielen vier Personen.\n\nOhne Bühne am besten auf das Liegen verzichten."], ["Ja-Sager", "Dreierübungen", "", "Einsteiger", "3 Personen: zwei Spielende und ein Zuschauer oder eine Zuschauerin\n\nDie Zuschauerin sitzt zentral auf einem Stuhl auf der Bühne. Die beiden Spielenden holen sich eine Vorgabe und spielen eine normale Szene. Immer wieder sprechen sie die Zuschauerin an und stellen ihr Fragen. Sie darf nur mit „Ja“ antworten.\n\nBei Streit holen sich beide Spielenden ihre Zustimmung, und es entstehen absurde, widersprüchliche Situationen.\n\nVariante: Die Zuschauerin ist jemand, der den Spielenden nahesteht, zum Beispiel die Chefin oder ein Familienmitglied."], ["Andere Reaktionen", "Zweierübungen", "", "Einsteiger", "2 Personen\n\nPerson A macht ein Startangebot, zum Beispiel einen Satz. Person B reagiert darauf. Die Szene dauert etwa zwei bis drei Minuten.\n\nDie Gruppe bespricht kurz, ob B eher positiv oder negativ reagiert hat. Dann wird dieselbe Szene noch einmal mit demselben Start von A gespielt, aber B reagiert diesmal genau gegenteilig.\n\nAm Ende vergleicht die Gruppe, wie sich Szene und Beziehung verändert haben.\n\nVariante: B bekommt eine Eigenschaft wie wütend, fröhlich oder gelassen."], ["Ich bin ein Baum", "Gruppenübungen", "", "Einsteiger", "4 bis 15 Personen\n\nAlle stehen um die Raummitte. Eine Person geht in die Mitte, nimmt eine Pose ein und sagt, was sie darstellt, zum Beispiel „Ich bin ein Baum“. Nacheinander kommen weitere Personen dazu, ergänzen das Bild und nennen ihre eigene Rolle.\n\nSteht das Bild, geht die erste Person ab und nimmt jemanden mit. Die Verbleibenden wiederholen ihren Satz, ohne die Pose zu ändern. So entsteht ein neues Bild, und das Spiel geht reihum weiter.\n\nVarianten: Abstrakte Begriffe, zum Beispiel Umweltthemen, in Körperbildern darstellen, oder mehrere Personen verketten Bilder zu einer Maschine."], ["Figur entwickeln", "Gruppenübungen", "", "Einsteiger", "3 bis 15 Personen\n\nAlle gehen durch den Raum und entwickeln eine eigene Figur, etwa mit Alter, Beruf und Sorgen. Sie bewegen sich dabei durchgehend in dieser Figur.\n\nDann stellen sich alle an den Rand. Eine Person tritt vor, zeigt ihre Figur und geht eine Runde durch den Raum. Die anderen folgen und ahmen Haltung und Bewegung so genau wie möglich nach. Danach stellt sich die vorführende Person an den Rand und beobachtet, während die anderen noch eine Runde weitergehen.\n\nRuhige Übung für Charakterarbeit und Pantomime."], ["Wartezimmer", "Gruppenübungen", "", "Einsteiger", "4 Personen\n\nVier Spielende sitzen nebeneinander als Wartende in einer Arztpraxis. Vorher wählt jede Person unter den anderen eine, die sie mag, eine, die sie ablehnt, und eine, deren Geruch sie stört.\n\nDie Spielenden improvisieren ein Gespräch über Alltagsthemen und zeigen ihre Gefühle gegenüber den anderen, ohne sie direkt auszusprechen. Die Spielleitung stoppt die Szene, und das Publikum rät, wer wen mag, ablehnt oder nicht riechen kann. Die Spielenden bestätigen oder widersprechen nicht. Bei Unklarheit wird weitergespielt und deutlicher gezeigt.\n\nRegeln: Keine eindeutigen Aussagen zu Sympathie oder Antipathie. Stühle werden nicht aus Sympathie oder Antipathie verrückt. Niemand redet hinter dem Rücken anderer."], ["Führender Körperteil", "Warm-Up-Spiele", "", "Einsteiger", "3 bis 15 Personen\n\nAlle gehen frei durch den Raum. Die Spielleitung nennt einen Körperteil, zum Beispiel Becken, Schulter, Stirn, Knie oder Bauch. Alle suchen eine Gangart, bei der dieser Körperteil die Bewegung anführt. Dann folgt der nächste Körperteil.\n\nWährend des Gehens achten alle darauf, wie sich Gefühl, Tempo und Haltung verändern.\n\nVarianten: Daraus eine Figur mit Status, Sprache und Beruf entwickeln und später in kurzen Szenen spielen. Nach der Übung über Empfindungen sprechen.\n\nRuhig und für Einsteiger geeignet."], ["Ampel", "Gruppenübungen", "", "Einsteiger", "6 bis 20 Personen\n\nZwei Gruppen stehen sich an einer belebten Straße gegenüber, jeweils an einer Fußgängerampel. Eine dritte Gruppe schaut zu. Vorher legen alle Ampeln und Zebrastreifen im Raum fest.\n\nBeide Gruppen schauen auf Ampel, Straße und Gegenüber. Eine Person gibt den Impuls, dann gehen alle los. Die Gruppen begegnen sich und reagieren aufeinander, zum Beispiel durch Ausweichen oder Anrempeln. Jede Person nimmt eine Haltung ein oder entwickelt eine Figur. Absprachen gibt es nicht. An den Raumenden drehen die Gruppen um, warten an der Ampel, und es beginnt von vorn.\n\nMit oder ohne Sprache möglich. Varianten: Wetterwechsel, ausgefallene Ampel, jemand startet zu früh."], ["Einer zu viel", "Gruppenübungen", "", "Einsteiger", "3 bis 5 Personen\n\nDie Gruppe steht gemeinsam auf der Bühne, und eine Person ist überzählig.\n\nDie Gruppe muss eine Person ausschließen, aber niemand will selbst die Ausgeschlossene sein. So entsteht schnell eine Hackordnung, an deren unterem Ende niemand stehen möchte.\n\nDie Übung trainiert Status, Charakter und Aufmerksamkeit."], ["Statusraten", "Gruppenübungen", "", "Einsteiger", "4 bis 15 Personen\n\nEine Person tritt vor die Gruppe. Die Spielleitung legt eine Statusstufe von 0 (niedrig) bis 10 (hoch) fest und teilt sie der Person geheim mit, zum Beispiel über Fingerzeichen oder ein Kärtchen.\n\nDie Person verinnerlicht den Status, tritt vor und sagt einen vorher vereinbarten Satz. Dann geht sie ab und bleibt dabei im Status. Auf Kommando zeigen alle anderen gleichzeitig mit den Fingern, welche Stufe sie gesehen haben. Danach begründen sie ihre Einschätzung, und die Spielleitung löst auf.\n\nRuhige Übung, bei der Haltung und Wahrnehmung im Mittelpunkt stehen."], ["Gehen und Stehen", "Warm-Up-Spiele", "", "Einsteiger", "5 bis 20 Personen\n\nAlle verteilen sich gleichmäßig im Raum.\n\nGrundvariante Stehen: Alle stehen. Die Spielleitung nennt eine Zahl, und so viele Personen gehen frei durch den Raum, der Rest bleibt stehen. Die Zahl wechselt immer wieder. Die richtige Anzahl muss sich ohne Absprache ergeben.\n\nGrundvariante Gehen: Alle gehen, es muss immer genau eine Person stehen. Wer geht, kann die stehende Person ablösen, indem sie selbst stehen bleibt. Wer losgeht, löst sofort jemand anderen zum Stehen aus.\n\nVarianten: Statt Stehen knien. Eine Person kniet, eine liegt. Eine Person hat eine Macke, die die anderen übernehmen.\n\nGleichzeitiges Stehenbleiben mehrerer Personen vermeiden, zum Beispiel durch Blickkontakt."]];
// Vorgabe: [Kategorie, Text]
const WIKI_VORGABEN = [["Berufe", "Bäcker"], ["Berufe", "Astronaut"], ["Berufe", "Hofnarr"], ["Berufe", "Leuchtturmwärter"], ["Berufe", "Goldschmied"], ["Berufe", "Gondoliere"], ["Berufe", "Chirurg"], ["Berufe", "Busfahrer"], ["Berufe", "Hufschmied"], ["Berufe", "Insolvenzverwalter"], ["Berufe", "Zauberkünstler"], ["Berufe", "Bademeister"], ["Berufe", "Kaminkehrer"], ["Berufe", "Traumdeuter"], ["Berufe", "Hundefriseur"], ["Berufe", "Marktschreier"], ["Berufe", "Sumo-Ringer"], ["Berufe", "Vorkoster"], ["Berufe", "Tierpräparator"], ["Berufe", "Sommelier"], ["Berufe", "Stuntman"], ["Berufe", "Rettungsschwimmer"], ["Berufe", "Notar"], ["Berufe", "Klavierstimmer"], ["Berufe", "Hebamme"], ["Berufe", "Kriminalkommissar"], ["Berufe", "Glockenläuter"], ["Berufe", "Dompteur"], ["Berufe", "Quizmaster"], ["Berufe", "Heilpraktiker"], ["Berufe", "Pilot"], ["Berufe", "Schäfer"], ["Berufe", "Fluglotse"], ["Berufe", "Gerichtsmediziner"], ["Berufe", "Influencer"], ["Berufe", "Porträtmaler"], ["Gefühle", "ausgelassen"], ["Gefühle", "beflügelt"], ["Gefühle", "bewegt"], ["Gefühle", "dankbar"], ["Gefühle", "entschlossen"], ["Gefühle", "erleichtert"], ["Gefühle", "fasziniert"], ["Gefühle", "gelassen"], ["Gefühle", "geborgen"], ["Gefühle", "hellwach"], ["Gefühle", "herzlich"], ["Gefühle", "hoffnungsvoll"], ["Gefühle", "mutig"], ["Gefühle", "neugierig"], ["Gefühle", "verliebt"], ["Gefühle", "zärtlich"], ["Gefühle", "zufrieden"], ["Gefühle", "zuversichtlich"], ["Gefühle", "argwöhnisch"], ["Gefühle", "beklommen"], ["Gefühle", "bekümmert"], ["Gefühle", "eifersüchtig"], ["Gefühle", "einsam"], ["Gefühle", "enttäuscht"], ["Gefühle", "gelangweilt"], ["Gefühle", "gereizt"], ["Gefühle", "hilflos"], ["Gefühle", "kribbelig"], ["Gefühle", "lustlos"], ["Gefühle", "misstrauisch"], ["Gefühle", "nervös"], ["Gefühle", "ratlos"], ["Gefühle", "scheu"], ["Gefühle", "schwermütig"], ["Gefühle", "überfordert"], ["Gefühle", "unsicher"], ["Gefühle", "verlegen"], ["Gefühle", "verzweifelt"], ["Gefühle", "zynisch"], ["Genre", "Abenteuerfilm"], ["Genre", "Actionfilm"], ["Genre", "Arztserie"], ["Genre", "Bollywood-Film"], ["Genre", "Brecht-Theater"], ["Genre", "Eastern"], ["Genre", "Film noir"], ["Genre", "Gospel"], ["Genre", "Hip Hop"], ["Genre", "Kinderfilm"], ["Genre", "Kochshow"], ["Genre", "Kriegsfilm"], ["Genre", "Liebesfilm"], ["Genre", "Mantel und Degen"], ["Genre", "Martial Art"], ["Genre", "Monsterfilm"], ["Genre", "Piratenfilm"], ["Genre", "Roadmovie"], ["Genre", "Schlager"], ["Genre", "Science Fiction"], ["Genre", "Slapstick"], ["Genre", "Spionagefilm"], ["Genre", "Stummfilm"], ["Genre", "Superhelden"], ["Genre", "Talkshow"], ["Genre", "Teleshop (Dauerwerbesendung)"], ["Genre", "Vampirfilm"], ["Orte", "Bauernhaus"], ["Orte", "Krankenhaus"], ["Orte", "Rathaus"], ["Orte", "Stadion"], ["Orte", "Pyramide"], ["Orte", "Gefängnis"], ["Orte", "Eiffelturm"], ["Orte", "Baumarkt"], ["Orte", "Kantine"], ["Orte", "Kindergarten"], ["Orte", "Markthalle"], ["Orte", "Marktplatz"], ["Orte", "Schlachterei"], ["Orte", "Schule"], ["Orte", "Waschsalon"], ["Orte", "Zahnarzt"], ["Orte", "Zoofachgeschäft"], ["Orte", "Berggipfel"], ["Orte", "Wald"], ["Orte", "Gletscher"], ["Orte", "Strand"], ["Orte", "Sumpf"], ["Orte", "Wüste"], ["Orte", "Höhle"], ["Orte", "Park"], ["Orte", "Savanne"], ["Orte", "Kino"], ["Orte", "Museum"], ["Orte", "Badezimmer"], ["Orte", "Dachboden"], ["Orte", "Keller"], ["Orte", "Gartenhaus"], ["Orte", "Hölle"], ["Orte", "Raumschiff"], ["Orte", "Spukschloss"], ["Orte", "Zeitmaschine"], ["Orte", "Olymp"], ["Orte", "Kreuzfahrtschiff"], ["Tätigkeiten", "Abheften"], ["Tätigkeiten", "Baden"], ["Tätigkeiten", "Bergsteigen"], ["Tätigkeiten", "Bügeln"], ["Tätigkeiten", "Fechten"], ["Tätigkeiten", "Fegen"], ["Tätigkeiten", "Fotografieren"], ["Tätigkeiten", "Galoppieren"], ["Tätigkeiten", "Häkeln"], ["Tätigkeiten", "Hämmern"], ["Tätigkeiten", "Jodeln"], ["Tätigkeiten", "Kämmen"], ["Tätigkeiten", "Kochen"], ["Tätigkeiten", "Lesen"], ["Tätigkeiten", "Mähen"], ["Tätigkeiten", "Meditieren"], ["Tätigkeiten", "Nähen"], ["Tätigkeiten", "Pfeifen"], ["Tätigkeiten", "Puzzeln"], ["Tätigkeiten", "Rasieren"], ["Tätigkeiten", "Rudern"], ["Tätigkeiten", "Schälen"], ["Tätigkeiten", "Schlafen"], ["Tätigkeiten", "Schleichen"], ["Tätigkeiten", "Schlurfen"], ["Tätigkeiten", "Schunkeln"], ["Tätigkeiten", "Schwimmen"], ["Tätigkeiten", "Sonnen"], ["Tätigkeiten", "Springen"], ["Tätigkeiten", "Stolzieren"], ["Tätigkeiten", "Surfen"], ["Tätigkeiten", "Telefonieren"], ["Tätigkeiten", "Torkeln"], ["Tätigkeiten", "Warten"], ["Tätigkeiten", "Abtrocknen"], ["Routine", "Tapezieren"], ["Routine", "Wände oder Fenster streichen"], ["Routine", "Bügeln"], ["Routine", "Wäsche aufhängen"], ["Routine", "Bier zapfen und Flaschen öffnen"], ["Routine", "Meditieren"], ["Routine", "Fernsehen"], ["Routine", "Kochen"], ["Routine", "Töpfern"], ["Routine", "Am Computer arbeiten"], ["Routine", "Am Fitnessgerät trainieren"], ["Routine", "Fenster putzen"], ["Routine", "Beten"], ["Routine", "Holz hacken"], ["Routine", "Auto fahren"], ["Routine", "Gartenarbeit"], ["Routine", "Blumen gießen"], ["Routine", "Schwimmen"], ["Routine", "Eine Leiter hochsteigen"], ["Routine", "Ein Instrument spielen"], ["Routine", "Ein Bild malen"], ["Routine", "Sport treiben"], ["Routine", "Duschen oder Baden"], ["Routine", "Nähen, Stricken oder Häkeln"], ["Routine", "Nägel schneiden oder lackieren"], ["Routine", "Geschirr spülen"], ["Routine", "Sich sonnen"], ["Routine", "Am Fließband arbeiten"], ["Routine", "Handwerklich arbeiten"], ["Ticks", "Versteckt einen unsichtbaren Freund vor den anderen"], ["Ticks", "Will alles verkaufen, was er oder sie sieht oder anfasst"], ["Ticks", "Ist sicher, unsichtbar zu sein"], ["Ticks", "Ein böses Genie, das die Weltherrschaft will"], ["Ticks", "Hält die anderen für eine neu entdeckte außerirdische Lebensform"], ["Ticks", "Verhält sich wie ein hungriger Dinosaurier"], ["Ticks", "Ahmt eine andere Figur mit fünf Sekunden Verzögerung nach"], ["Ticks", "Verhält sich wie verschiedene Zirkusdarsteller"], ["Ticks", "Kommuniziert nur mit Gesten (Scharaden)"], ["Ticks", "Glaubt, von allen ständig bewertet zu werden"], ["Phobien", "Aviophobie – Angst vor dem Fliegen"], ["Phobien", "Arachnophobie – Angst vor Spinnen"], ["Phobien", "Waschzwang"], ["Phobien", "Dentophobie – Angst vor dem Zahnarzt"], ["Phobien", "Gephyrophobie – Angst vor Brücken"], ["Phobien", "Keraunophobie – Angst vor Blitzen"], ["Phobien", "Nyktophobie – Angst vor der Dunkelheit"], ["Phobien", "Anuptaphobie – Angst, für immer Single zu bleiben"], ["Phobien", "Agoraphobie – Angst vor weiten Plätzen und Menschenmengen"], ["Phobien", "Herpetophobie – Angst vor Reptilien"], ["Phobien", "Sesquipedalophobie – Angst vor langen Wörtern"], ["Phobien", "Chaetophobie – Angst vor Haaren"], ["Phobien", "Mysophobie – Angst vor Schmutz und Keimen"], ["Phobien", "Erythrophobie – Angst vor dem Erröten"], ["Phobien", "Elektrophobie – Angst vor Elektrizität"], ["Phobien", "Astraphobie – Angst vor Gewitter"], ["Phobien", "Phobophobie – Angst vor der Angst"], ["Hobbys", "Büchernarr"], ["Hobbys", "Hobbykoch"], ["Hobbys", "Pilze sammeln"], ["Hobbys", "Kakteen züchten"], ["Hobbys", "Teddybären sammeln"], ["Hobbys", "Münzen sammeln"], ["Hobbys", "Fußball"], ["Hobbys", "Autorennen"], ["Hobbys", "Snowboard"], ["Hobbys", "Skateboard"], ["Hobbys", "Paragliding"], ["Hobbys", "Segeln"], ["Hobbys", "Kajak"], ["Hobbys", "Kitesurfen"], ["Hobbys", "Synchronschwimmen"], ["Hobbys", "Wasserball"], ["Hobbys", "Tauchen"], ["Hobbys", "Klavier spielen"], ["Hobbys", "Cello spielen"], ["Hobbys", "Ölmalerei"], ["Hobbys", "Salsa tanzen"], ["Hobbys", "Ballett"], ["Hobbys", "Breakdance"], ["Hobbys", "Curling"], ["Hobbys", "Billard"], ["Hobbys", "Tischfußball"], ["Hobbys", "Bowling"], ["Rekorde", "Die meisten Luftballons in einer Minute aufblasen"], ["Rekorde", "Der längste Handstand"], ["Rekorde", "Der höchste Turm aus Spielkarten"], ["Rekorde", "Das schnellste Aufsagen eines Zungenbrechers"], ["Rekorde", "Die meisten Liegestütze in einer Minute"], ["Rekorde", "Die längste Kette aus Büroklammern"], ["Rekorde", "Die meisten Hula-Hoop-Drehungen"], ["Rekorde", "Der längste Kuss"], ["Rekorde", "Die meisten Socken gleichzeitig anziehen"], ["Rekorde", "Der größte Kaugummiblase-Durchmesser"], ["Rekorde", "Die längste Zeit rückwärts laufen"], ["Rekorde", "Der größte Schneemann"], ["Beziehungen", "Großeltern und Enkel"], ["Beziehungen", "Stiefeltern und Stiefkind"], ["Beziehungen", "Patchwork-Familie"], ["Beziehungen", "Erwischter Geliebter"], ["Beziehungen", "Dreiecksverhältnis"], ["Beziehungen", "Erste Verabredung"], ["Beziehungen", "Ex-Frau und neue Frau"], ["Beziehungen", "Lehrer und Schulleiter"], ["Beziehungen", "Verrückter Professor"], ["Beziehungen", "Ausbilder und Rekrut"], ["Beziehungen", "Wächter und Gefangener"], ["Beziehungen", "Rechtsanwalt und Klient"], ["Beziehungen", "Sheriff und Gangsterbande"], ["Beziehungen", "Schauspieler und Regisseur"], ["Beziehungen", "Schauspieler und Stunt-Double"], ["Beziehungen", "Computer und Benutzer"], ["Beziehungen", "Roboter und sein Schöpfer"], ["Beziehungen", "Bauchredner und Puppe"], ["Beziehungen", "Hund und Knochen"], ["Beziehungen", "Frosch und Prinzessin"], ["Beziehungen", "Präparator und Tier"], ["Beziehungen", "Gott und Mensch"], ["Beziehungen", "Gott und Teufel"], ["Beziehungen", "Astronaut und Außerirdischer"], ["Beziehungen", "Kapitän und Geist"], ["Beziehungen", "Batman und Robin"], ["Beziehungen", "Chef und Mitarbeiterin"], ["Beziehungen", "Boxtrainer und Boxer"]];
function wikiEinspielen(props){
  if(props.getProperty('wikiImport1') === '1') return;
  props.setProperty('wikiImport1','1');
  const sp = alle('Spiele');
  const norm = t => String(t).toLowerCase().replace(/[^a-z0-9äöüß]/g,'');
  const titel = new Set(sp.filter(x => x.art !== 'vorgabe').map(x => norm(x.titel)));
  const vor = new Set(sp.filter(x => x.art === 'vorgabe').map(x => x.kat + '|' + norm(x.titel)));
  WIKI_UEBUNGEN.forEach((u,i) => {
    if(titel.has(norm(u[0]))) return;
    sp.push({id:'w'+(i+1), titel:u[0], kat:u[1], art:'uebung', tn:u[2], dauer:'', level:u[3], ablauf:u[4], eig:''});
  });
  WIKI_VORGABEN.forEach((v,i) => {
    const k = v[0] + '|' + norm(v[1]);
    if(vor.has(k)) return;
    vor.add(k);
    sp.push({id:'wv'+(i+1), titel:v[1], kat:v[0], art:'vorgabe', tn:'', dauer:'', level:'', ablauf:'', eig:''});
  });
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
const VO_REIHE = ['Ticks','Tätigkeiten','Phobien','Orte','Rekorde','Hobbys','Genre','Gefühle','Beziehungen','Berufe','Routine','Persönlichkeiten'];
function fundusDaten(){
  startdaten();
  const sp = alle('Spiele');
  const uebungen = sp.filter(s => s.art !== 'vorgabe').map(s => ({
    id: s.id, titel: s.titel, kat: KAT_ALT[s.kat] || s.kat, tn: s.tn, dauer: s.dauer, level: s.level, ablauf: s.ablauf, eig: liste(s.eig)
  }));
  const vorgaben = {};
  sp.filter(s => s.art === 'vorgabe').forEach(s => {
    if(!vorgaben[s.kat]) vorgaben[s.kat] = [];
    vorgaben[s.kat].push({id: s.id, t: s.titel, e: liste(s.eig), h: s.ablauf || ''});
  });
  return {ok: true, uebungen: uebungen, vorgaben: vorgaben, uebungenReihe: reiheLesen('uebung'), vorgabenReihe: reiheLesen('vorgabe')};
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
      case 'idee':       return ideeNachricht(req);
      case 'adminAnmelden': return adminAnmelden(req);
      case 'adminSpeichern':
      case 'adminLoeschen':
      case 'adminKat':
      case 'adminVerschieben': return adminAktion(req);
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
  if(req.action === 'adminKat') return adminKat(req);
  if(req.action === 'adminVerschieben') return adminVerschieben(req);
  const f = req.eintrag || {};
  if(!String(f.titel || '').trim()) return {ok:false, msg:'Bitte einen Titel eingeben.'};
  if(!String(f.kat || '').trim()) return {ok:false, msg:'Bitte eine Kategorie wählen.'};
  if(f.art !== 'uebung' && f.art !== 'vorgabe') return {ok:false, msg:'Unbekannte Art.'};
  return spielSpeichern(req);
}

/* ---------- Bearbeiten-Modus: Kategorien und Reihenfolge ---------- */
function reiheLesen(art){
  const key = art === 'vorgabe' ? 'voReihe' : 'ueReihe';
  let r = null;
  const e = alle('Einstellungen').find(x => x.key === key);
  if(e){ try { r = JSON.parse(e.wert); } catch(x){} }
  r = Array.isArray(r) ? r.slice() : (art === 'vorgabe' ? VO_REIHE : UE_REIHE).slice();
  alle('Spiele').forEach(s => {
    if((s.art === 'vorgabe') !== (art === 'vorgabe')) return;
    const k = art === 'vorgabe' ? s.kat : (KAT_ALT[s.kat] || s.kat);
    if(k && r.indexOf(k) < 0) r.push(k);
  });
  return r;
}
function reiheSchreiben(art, r){
  const key = art === 'vorgabe' ? 'voReihe' : 'ueReihe';
  const l = alle('Einstellungen').filter(e => e.key !== key);
  l.push({key:key, wert:JSON.stringify(r)});
  schreibe('Einstellungen', l);
}
function adminKat(req){
  const art = req.art === 'vorgabe' ? 'vorgabe' : 'uebung';
  const name = String(req.name || '').trim();
  let r = reiheLesen(art);
  const inKat = s => (s.art === 'vorgabe') === (art === 'vorgabe') && (art === 'vorgabe' ? s.kat : (KAT_ALT[s.kat] || s.kat)) === name;
  if(req.op === 'neu'){
    if(!name) return {ok:false, msg:'Bitte einen Namen eingeben.'};
    if(r.indexOf(name) >= 0) return {ok:false, msg:'Diese Kategorie gibt es schon.'};
    r.push(name);
  } else if(req.op === 'umbenennen'){
    const neu = String(req.neu || '').trim();
    if(!neu) return {ok:false, msg:'Bitte einen Namen eingeben.'};
    if(r.indexOf(name) < 0) return {ok:false, msg:'Kategorie nicht gefunden.'};
    if(neu !== name && r.indexOf(neu) >= 0) return {ok:false, msg:'Diesen Namen gibt es schon.'};
    const sp = alle('Spiele');
    sp.forEach(s => { if(inKat(s)) s.kat = neu; });
    schreibe('Spiele', sp);
    r[r.indexOf(name)] = neu;
  } else if(req.op === 'loeschen'){
    if(alle('Spiele').some(inKat)) return {ok:false, msg:'Die Kategorie ist nicht leer. Verschiebe oder lösche zuerst die Einträge darin.'};
    r = r.filter(k => k !== name);
  } else if(req.op === 'verschieben'){
    const i = r.indexOf(name), j = i + (Number(req.richtung) < 0 ? -1 : 1);
    if(i < 0 || j < 0 || j >= r.length) return {ok:true};
    const t = r[i]; r[i] = r[j]; r[j] = t;
  } else return {ok:false, msg:'Unbekannte Aktion.'};
  reiheSchreiben(art, r);
  return {ok:true};
}
function adminVerschieben(req){
  const sp = alle('Spiele');
  const i = sp.findIndex(x => x.id === req.sid);
  if(i < 0) return {ok:false, msg:'Eintrag nicht gefunden.'};
  const istV = sp[i].art === 'vorgabe';
  const kat = x => istV ? x.kat : (KAT_ALT[x.kat] || x.kat);
  const k = kat(sp[i]);
  const gleich = x => (x.art === 'vorgabe') === istV && kat(x) === k;
  const dir = Number(req.richtung) < 0 ? -1 : 1;
  let j = i + dir;
  while(j >= 0 && j < sp.length && !gleich(sp[j])) j += dir;
  if(j < 0 || j >= sp.length) return {ok:true};
  const t = sp[i]; sp[i] = sp[j]; sp[j] = t;
  schreibe('Spiele', sp);
  return {ok:true};
}

/* ---------- Vorschlag einreichen (direkt aus der Maske) ---------- */
function ideeNachricht(req){
  if(String(req.web || '') !== '') return {ok:true};
  const art = req.art === 'Vorgabe' ? 'Vorgabe' : 'Übung';
  const titel = String(req.titel || '').trim().slice(0,120);
  const text = String(req.text || '').trim().slice(0,5000);
  if(!titel || !text) return {ok:false, msg:'Bitte Name und Beschreibung ausfüllen.'};
  const mail = String(req.mail || '').trim().slice(0,120);
  const zeilen = [
    'Art: ' + art,
    'Name: ' + titel,
    (art === 'Vorgabe' ? 'Vorgaben-Art: ' : 'Bereich: ') + String(req.kat || '').slice(0,80),
    'Personen: ' + String(req.tn || '').slice(0,40),
    'Niveau: ' + String(req.level || '').slice(0,40),
    'Name nennen: ' + (req.nameNennen ? 'ja' : 'nein'),
    '',
    text,
    '',
    'Von: ' + (String(req.name || '').trim().slice(0,80) || 'Anonym') + (mail ? ' <' + mail + '>' : '')
  ];
  MailApp.sendEmail({
    to: KONTAKT_EMPFAENGER,
    subject: 'Impro-Fundus Vorschlag: ' + titel,
    body: zeilen.join('\n'),
    replyTo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? mail : KONTAKT_EMPFAENGER
  });
  return {ok:true};
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