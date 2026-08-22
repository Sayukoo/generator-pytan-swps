# Generator pytań (SWPS / UWr)

Aplikacja edukacyjna służąca do przygotowań do egzaminu, stworzona w oparciu o czysty JavaScript, HTML5 i CSS. Aplikacja oferuje nowoczesny, minimalistyczny interfejs z ciemnym motywem kolorystycznym inspirowanym stylem "minimalist phone".

Została zaprojektowana bez potrzeby korzystania ze skomplikowanego systemu budowania, dzięki czemu jest bardzo łatwa we wdrożeniu i edycji.

## Funkcje

* **Bazy pytań:** Obsługa wielu baz pytań (SWPS, UWr) z możliwością swobodnego przełączania się i zachowania stanu postępów w Local Storage.
* **Tryby losowania:**
    * **Tryb SWPS:** Losuje dwa pytania z bazy; masz określony czas na wybranie jednego z nich i udzielenia odpowiedzi.
    * **Tryb UWr:** Losuje jedno pytanie, a timer rozpoczyna się od razu od czasu na odpowiedź.
* **Timer z pauzą:** Pasek postępu odliczania, pauza/wznowienie (`Spacja` / `P`), subtelny sygnał dźwiękowy po upływie czasu oraz szybkie akcje: *Opanowane*, *Powtórz odpowiedź*, *Nowe losowanie*.
* **Mastery System (Zarządzanie postępami):** Oznaczanie pytań jako opanowanych, ukrywanie ich z puli losowania za pomocą filtrów oraz możliwość wyczyszczenia wszystkich postępów (z potwierdzeniem).
* **Plan nauki:** Wprowadź datę egzaminu, a aplikacja policzy tempo nauki — łącznie z **celem dziennym** ("Dziś: X/Y") i paskiem postępu opanowania materiału.
* **Filtrowanie po Tagach:** Pytania są przypisywane do kategorii, co pozwala na generowanie zestawów testowych ograniczonych do konkretnych zagadnień.
* **Wyszukiwanie:** Błyskawiczne szukanie po treści, numerze i tagu pytania.
* **Trwałe ustawienia:** Filtry (ukryte opanowane, wybrane tagi), własny czas timera i motyw zapamiętują się między sesjami.
* **Motywy:** Ciemny, OLED Black, Sepia Paper, Pixel RPG.
* **Płynne animacje CSS** z poszanowaniem preferencji `prefers-reduced-motion`.

## Skróty klawiszowe

| Klawisz | Akcja |
| --- | --- |
| `Spacja` / `P` | Losuj · podczas timera: pauza/wznowienie |
| `1` / `2` | Wybór karty (tryb SWPS) |
| `M` | Oznacz/odznacz aktywne pytanie jako opanowane |
| `R` | Reset widoku |
| `F` | Fokus na wyszukiwarkę pytań |

## Struktura plików i katalogów

* `index.html` - Główny i jedyny plik strukturalny.
* `css/styles.css` - Plik stylizujący (zmienne CSS, motywy, animacje).
* `data/` - Zbiory danych:
  * `swps.js` i `uwr.js` - tablice JS przechowujące bazy pytań z tagami.
  * `questions.js` - ładuje właściwą bazę do globalnej instancji zależnie od wyboru (localStorage).
* `js/main.js` - Punkt wejścia; orkiestracja modułów.
* `js/modules/` - Logika aplikacji podzielona na moduły ES:
  * `timer.js` - fazy losowania i odpowiedzi, pauza/wznowienie.
  * `sound.js` - subtelne sygnały WebAudio (koniec czasu).
  * `mastery.js` - stan opanowanych pytań + dziennik dzienny (localStorage).
  * `studyPlan.js` - plan nauki, cel dzienny, paski postępu.
  * `filters.js` - filtry tagów z trwałością stanu.
  * `drawer.js` - losowanie pytań (crypto RNG).
  * `cards.js`, `questionList.js` - render kart i siatki pytań (tooltipy).
  * `keyboard.js` - skróty klawiszowe.
  * `motion.js` - animacje, cząsteczki, tilt 3D.
  * `themeManager.js` - motywy wizualne.
  * `customBankImporter.js` - import własnej bazy JSON.
  * `uiHelpers.js`, `tags.js` - pomocnicze (topbar, kolory tagów).
* `screenshot.py` - skrypt Playwright robiący zrzut ekranu działającej aplikacji.

## Konfiguracja i uruchamianie

Projekt jest statyczną stroną. Nie ma tu `package.json`, menedżera pakietów npm czy bundlera takiego jak Webpack/Vite.

Aby uruchomić aplikację, wystarczy odpalić prosty serwer HTTP, przykładowo:

```bash
python3 -m http.server 3000
```

A następnie wejść na `http://localhost:3000`. Zawsze otwieraj projekt z wykorzystaniem serwera WWW, ze względu na CORS związany z modularnością plików `.js`.

## Autor

Kacper Kulesza (kackul17@gmail.com)
