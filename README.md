# Generator pytań (SWPS / UWr)

Aplikacja edukacyjna służąca do przygotowań do egzaminu, stworzona w oparciu o czysty JavaScript, HTML5 i CSS. Aplikacja oferuje nowoczesny, minimalistyczny interfejs z ciemnym motywem kolorystycznym inspirowanym stylem "minimalist phone".

Została zaprojektowana bez potrzeby korzystania ze skomplikowanego systemu budowania, dzięki czemu jest bardzo łatwa we wdrożeniu i edycji.

## Funkcje

* **Bazy pytań:** Obsługa wielu baz pytań (SWPS, UWr) z możliwością swobodnego przełączania się i zachowania stanu postępów w Local Storage.
* **Tryby losowania:**
    * **Tryb SWPS:** Losuje dwa pytania z bazy; masz określony czas (ustawiany timer) na wybranie jednego z nich i udzielenie odpowiedzi.
    * **Tryb UWr:** Losuje jedno pytanie, a timer rozpoczyna się od razu od czasu na odpowiedź.
* **Mastery System (Zarządzanie postępami):** Narzędzie pozwalające na oznaczanie pytań jako opanowane, które można następnie ukrywać z puli losowania za pomocą filtrów.
* **Filtrowanie po Tagach:** Pytania są przypisywane do kategorii, co pozwala na generowanie zestawów testowych ograniczonych do konkretnych zagadnień.
* **Dostosowywany Timer:** Możesz ustalić niestandardowy czas, jaki chcesz przeznaczyć na wybrane pytanie (w sekundach) w prawym górnym pasku.
* **Nowoczesne i płynne animacje CSS**.

## Struktura plików i katalogów

* \`index.html\` - Główny i jedyny plik strukturalny.
* \`css/styles.css\` - Plik stylizujący (z wykorzystaniem zmiennych CSS i animacji).
* \`data/\` - Zawiera zbiory danych:
  * \`swps.js\` i \`uwr.js\` - tablice JS przechowujące konkretne bazy pytań z tagami.
  * \`questions.js\` - skrypt ładujący odpowiednią bazę do globalnej instancji zależnie od zapamiętanego wyboru (localStorage).
* \`js/\` - Główny folder z logiką aplikacji:
  * \`main.js\` - Główna pętla i kontrola UI.
  * \`filters.js\` - Narzędzie odpowiedzialne za konstruowanie i renderowanie menu filtrowania i opcji.
  * \`mastery.js\` - Prosty mechanizm State-Management do śledzenia nauczonych pytań w \`localStorage\`.
  * \`tags.js\` - Przechowuje stałe konfiguracyjne np. kolory przypisane danym tagom i logikę ich przetwarzania.
  * \`timer.js\` - Menadżer odmierzający czas potrzebny do rozwiązania zadań.

## Konfiguracja i uruchamianie

Projekt jest statyczną stroną. Nie ma tu \`package.json\`, menedżera pakietów npm czy bundlera takiego jak Webpack/Vite.

Aby uruchomić aplikację, wystarczy odpalić prosty serwer HTTP, przykładowo:

\`\`\`bash
python3 -m http.server 3000
\`\`\`

A następnie wejść na \`http://localhost:3000\`. Zawsze otwieraj projekt z wykorzystaniem serwera WWW, ze względu na CORS związany z modularnością plików `.js` (jeśli w przyszłości zostanie zaimplementowana asynchroniczność) oraz by zachować poprawne ścieżki i lokalne testowanie.

## Autor

Kacper Kulesza (kackul17@gmail.com)
