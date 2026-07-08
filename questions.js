(function (global) {
  'use strict';

  const RAW_QUESTIONS = [
    {
      text: 'Dlaczego psychologia humanistyczna została nazwana „trzecią drogą” w psychologii? Omów jej założenia w kontekście innych koncepcji człowieka.',
      tags: ['Psychologia ogólna'],
    },
    {
      text: 'Czy Freud był rewolucjonistą w psychologii? Przedstaw założenia oraz proces rozwoju psychodynamicznej koncepcji człowieka.',
      tags: ['Psychologia ogólna'],
    },
    {
      text: 'Skąd wziął się pomysł na myślenie o człowieku jako o sumie odruchów? Omów podstawy filozoficzne i metodologiczne behawioryzmu.',
      tags: ['Psychologia ogólna'],
    },
    {
      text: 'Omów w jaki sposób badania realizowane na zwierzętach mogą wzbogacać wiedzę psychologiczną — uwzględniając perspektywę metodologiczną oraz etyczną.',
      tags: ['Psychologia ogólna'],
    },
    {
      text: 'Dlaczego psychologia porzuciła ideę „czarnej skrzynki”? Przedstaw powody i przebieg rewolucji poznawczej w psychologii.',
      tags: ['Psychologia ogólna'],
    },
    {
      text: 'W jaki sposób tworzy się poczucie tożsamości grupowej? Przedstaw i oceń konsekwencje tożsamości grupowej.',
      tags: ['Psychologia społeczna'],
    },
    {
      text: 'Przeanalizuj relację wybranej techniki autoprezentacji do postulatu „bądź sobą”.',
      tags: ['Psychologia społeczna'],
    },
    {
      text: 'Porównaj wybrane dwie koncepcje agresywności i omów empiryczne przesłanki wskazujące na wyższą trafność jednej z nich.',
      tags: ['Psychologia społeczna'],
    },
    {
      text: 'Czy istnieje prawdziwy („egzogenny”) altruizm? Skonfrontuj koncepcje teoretyczne i badania empiryczne wskazujące na jego istnienie i nieistnienie.',
      tags: ['Psychologia społeczna'],
    },
    {
      text: 'Socjalizacja i posłuszeństwo: co zrobić, aby dzieci były „grzeczne”, a gdy dorosną — nie zawsze posłuszne?',
      tags: ['Psychologia społeczna'],
    },
    {
      text: 'Porównaj dwie klasyczne teorie tłumaczące proces powstawania emocji. Krytycznie odnieś się do założeń obu teorii i wskaż, jakie współczesne teorie były nimi inspirowane.',
      tags: ['Emocje i motywacje'],
    },
    {
      text: 'Czy twarz jest dobrym źródłem informacji o przeżywanych stanach emocjonalnych? Uzasadnij swoją odpowiedź. Odnieś się do teorii i przykładowych badań.',
      tags: ['Emocje i motywacje'],
    },
    {
      text: 'Czy możemy mówić o zachowaniach ludzi motywowanych homeostatycznie? Uzasadnij swoją odpowiedź podając argumenty i przykłady.',
      tags: ['Emocje i motywacje'],
    },
    {
      text: 'Czy motywacja zewnętrzna obniża motywację wewnętrzną? Wytłumacz odnosząc się do przykładów i badań.',
      tags: ['Emocje i motywacje'],
    },
    {
      text: 'Porównaj dwie wybrane teorie samoregulacji. Krytycznie odnieś się do założeń obu teorii korzystając z dowodów empirycznych i przykładów.',
      tags: ['Emocje i motywacje'],
    },
    {
      text: 'Dlaczego przywiązanie jest ważne? Zdefiniuj przywiązanie, omów jego rozwój i przeanalizuj jego znaczenie w funkcjonowaniu człowieka.',
      tags: ['Psychologia rozwojowa'],
    },
    {
      text: 'Natura czy środowisko? Wyjaśnij wkład obu tych czynników na kształtowanie wybranego aspektu rozwoju człowieka.',
      tags: ['Psychologia rozwojowa'],
    },
    {
      text: 'Wyjaśnij znaczenie wczesnego dzieciństwa w kształtowaniu człowieka na podstawie dwóch wybranych teorii i przykładów badań z zakresu psychologii rozwoju.',
      tags: ['Psychologia rozwojowa'],
    },
    {
      text: 'Przeanalizuj specyfikę wybranego aspektu rozwoju (motorycznego, poznawczego lub językowego), jego etapy, charakterystyki i różne podejścia teoretyczne, które wyjaśniają wybrany proces.',
      tags: ['Psychologia rozwojowa'],
    },
    {
      text: 'Przeanalizuj wybrany okres rozwoju człowieka (od rozwoju prenatalnego do starości) pod kątem jego specyfiki i zmian rozwojowych, które w nim zachodzą, a także znaczenia tych zmian, powołując się na wybrane teorie i badania.',
      tags: ['Psychologia rozwojowa'],
    },
    {
      text: 'Podaj definicję i wyjaśnij mechanizm uzależnienia na podstawie wybranej teorii. Porównaj na wybranych przykładach (co najmniej dwóch) uzależnienia chemiczne i behawioralne.',
      tags: ['Psychopatologia'],
    },
    {
      text: 'Wskaż różnice pomiędzy naturalnym procesem starzenia się a otępieniem. Omów ich wpływ na zmiany w zakresie funkcji poznawczych.',
      tags: ['Psychopatologia'],
    },
    {
      text: 'Depresja, epizod depresyjny, zaburzenia depresyjne — krytycznie przeanalizuj różne postacie depresji.',
      tags: ['Psychopatologia'],
    },
    {
      text: 'Podobieństwa i różnice w zaburzeniach lękowych — porównaj dwa wybrane rodzaje zaburzeń lękowych odwołując się do ich psychopatologii, klasyfikacji i leczenia.',
      tags: ['Psychopatologia'],
    },
    {
      text: 'Porównaj adaptacyjny przebieg żałoby. Omów mechanizmy psychologiczne odpowiedzialne za ich wystąpienie.',
      tags: ['Psychopatologia'],
    },
    {
      text: 'Porównaj dwie wybrane koncepcje (teorie) osobowości w zakresie procesu kształtowania osobowości.',
      tags: ['Psychologia osobowości'],
    },
    {
      text: 'Podaj przykład wybranego zachowania i przeanalizuj je w odniesieniu do motywów związanych z Ja.',
      tags: ['Psychologia osobowości'],
    },
    {
      text: 'Jakie są wady i zalety teorii cechowych? Omów to zagadnienie na przykładzie wybranej koncepcji osobowości.',
      tags: ['Psychologia osobowości'],
    },
    {
      text: 'Podaj przykład wybranego zachowania i przeanalizuj je w odniesieniu do koncepcji wzajemnego determinizmu osobowości, środowiska i zachowania postulowanej w ramach teorii społecznego uczenia się autorstwa Alberta Bandury.',
      tags: ['Psychologia osobowości'],
    },
    {
      text: 'Omów związki osobowości ze zdrowiem. Wskaż i przeanalizuj mechanizmy tych związków odwołując się do co najmniej jednej teorii, która je opisuje i wyjaśnia.',
      tags: ['Psychologia osobowości'],
    },
    {
      text: 'Opierając się na mechanizmach psychologicznych oraz wynikach badań, omów w jaki sposób możemy wykorzystać wiedzę o procesach poznawczych w wybranym obszarze praktyki psychologicznej (np. edukacji, biznesie).',
      tags: ['Psychologia poznawcza'],
    },
    {
      text: 'Wyjaśnij czym jest pamięć robocza i jakie ma znaczenie dla funkcjonowania człowieka w różnych sytuacjach życiowych. Omów przynajmniej trzy przykłady.',
      tags: ['Psychologia poznawcza'],
    },
    {
      text: 'Kiedy warto kierować się intuicją? Omów problem odwołując się do wybranych koncepcji psychologicznych.',
      tags: ['Psychologia poznawcza'],
    },
    {
      text: 'Omów najważniejsze heurystyki decyzyjne (minimum 3). Przeanalizuj ich wady i zalety.',
      tags: ['Psychologia poznawcza'],
    },
    {
      text: 'Dokonaj analizy podstawowych funkcji uwagi w kontekście ich użycia w życiu codziennym.',
      tags: ['Psychologia poznawcza'],
    },
    {
      text: 'Przeanalizuj relacje między inteligencją płynną i skrystalizowaną odwołując się do teorii i metod diagnozy psychologicznej.',
      tags: ['Psychologia różnic indywidualnych'],
    },
    {
      text: 'Przeanalizuj związki temperamentu ze stresem odwołując się do wybranej teorii temperamentu. Wskaż co najmniej dwa mechanizmy psychologiczne odpowiedzialne za te związki.',
      tags: ['Psychologia różnic indywidualnych'],
    },
    {
      text: 'Omów związki temperamentu z psychopatologią. Wskaż i przeanalizuj mechanizmy tych związków odwołując się do co najmniej jednego modelu interakcji temperamentu i środowiska.',
      tags: ['Psychologia różnic indywidualnych'],
    },
    {
      text: 'Czy psychologii potrzebne jest pojęcie stylu poznawczego? Uzasadnij odpowiedź, odwołując się do min. trzech opisanych w literaturze stylów poznawczych.',
      tags: ['Psychologia różnic indywidualnych'],
    },
    {
      text: 'Dokonaj krytycznej analizy istniejących teorii wglądu (minimum dwóch). Czy / jak można zwiększyć prawdopodobieństwo osiągnięcia wglądu?',
      tags: ['Psychologia różnic indywidualnych'],
    },
    {
      text: 'Społeczny i prawny obowiązek denuncjacji: czym jest i z jakimi konfliktami etycznymi może się wiązać? Proszę podać przykłady konfliktów etycznych i potencjalne rozwiązania.',
      tags: ['Etyka'],
    },
    {
      text: 'Czy psycholog powinien zawsze być lojalny wobec instytucji, w której pracuje? Proszę podać przykłady konfliktów etycznych występujących w relacji psycholog–instytucja.',
      tags: ['Etyka'],
    },
    {
      text: 'Dlaczego psycholog powinien opierać swoją praktykę na bazie ugruntowanej wiedzy naukowej? Podaj przykłady diagnozy, terapii i innych usług psychologicznych opartych i nieopartych na wiedzy naukowej.',
      tags: ['Etyka'],
    },
    {
      text: 'Przestrzeganie zasad świadomej zgody na usługi psychologiczne i tajemnicy zawodowej w sytuacji pracy z dziećmi. Proszę podać przykłady konfliktów etycznych i potencjalne rozwiązania.',
      tags: ['Etyka'],
    },
    {
      text: 'Wskaż i opisz przynajmniej jedno badanie psychologiczne, które współcześnie nie mogłoby zostać przeprowadzone ze względów etycznych i na tym przykładzie omów zmianę standardów etycznych w psychologii.',
      tags: ['Etyka'],
    },
    {
      text: 'Jakie dane z wywiadu i obserwacji powinny stanowić przesłankę do wykonania testu inteligencji? Jakich narzędzi użyjesz? Kiedy użyjesz testów słownych, kiedy bezsłownych, a kiedy uznasz że powinno się zmierzyć poziom inteligencji globalnej?',
      tags: ['Diagnoza'],
    },
    {
      text: 'Jakie błędy po stronie diagnosty mogą negatywnie wpłynąć na proces diagnozy depresji i jakie mogą być konsekwencje?',
      tags: ['Diagnoza'],
    },
    {
      text: 'Interpretację których podskal testów osobowości wykorzystasz w diagnozie pacjenta z zaburzeniem lękowym albo osobowością unikającą? Jakich innych narzędzi (poza testami osobowości) możesz użyć do oceny poziomu lęku?',
      tags: ['Diagnoza'],
    },
    {
      text: 'W jakim kontekście sytuacyjnym / klinicznym należy zastosować testy / skale mierzące inteligencję płynną? Wyjaśnij dlaczego wybierasz do potwierdzenia lub falsyfikacji hipotezy diagnostycznej ten rodzaj testów / skal.',
      tags: ['Diagnoza'],
    },
    {
      text: 'Który z testów osobowości daje możliwość interpretacji parami? Jakie obszary psychopatologii charakteryzują te pary, do jakich procesów psychologicznych się one odnoszą, jakie problemy behawioralne mogą z nich wynikać?',
      tags: ['Diagnoza'],
    },
    {
      text: 'Zaproponuj dwa proste badania psychologiczne: jedno o charakterze korelacyjnym i jedno eksperymentalnym. Na tej podstawie przedyskutuj różnice między tymi metodami oraz wskaż ich zalety i ograniczenia.',
      tags: ['Metodologia, psychometria, statystyka'],
    },
    {
      text: 'Dlaczego przy wykonywaniu testów statystycznych ważne jest obliczanie wielkości (siły) efektu, a nie ograniczanie się wyłącznie do określenia czy wynik jest istotny bądź nieistotny? Uzasadnij odwołując się do przykładów badań psychologicznych.',
      tags: ['Metodologia, psychometria, statystyka'],
    },
    {
      text: 'Zaproponuj plan prostego badania eksperymentalnego i na jego podstawie omów etapy wnioskowania statystycznego w modelu testowania istotności statystycznej hipotezy zerowej.',
      tags: ['Metodologia, psychometria, statystyka'],
    },
    {
      text: 'W jaki sposób wiedza zgromadzona w wyniku prowadzenia eksperymentalnych badań psychologicznych może znaleźć zastosowanie w codziennych sytuacjach? Uzasadnij, omawiając przykłady aplikacji wyników badań eksperymentalnych.',
      tags: ['Metodologia, psychometria, statystyka'],
    },
    {
      text: 'Zaproponuj plan prostych badań korelacyjnych, w którym zmienne wyrażone są kolejno na poziomie nominalnym, porządkowym oraz ilościowym. W jaki sposób pomiar zmiennej na określonym poziomie determinuje wybór testu statystycznego?',
      tags: ['Metodologia, psychometria, statystyka'],
    },
    {
      text: 'Jakie badania powinien wykonać autor testu, jeśli chce wykazać, że przygotowane przez niego narzędzie jest trafne? Omów przynajmniej dwa przykłady takich badań odnoszących się do różnych aspektów trafności.',
      tags: ['Metodologia, psychometria, statystyka'],
    },
    {
      text: 'Jakie badania powinien wykonać autor testu, jeśli chce wykazać, że przygotowane przez niego narzędzie jest rzetelne? Omów przynajmniej dwa przykłady takich badań odnoszących się do różnych aspektów rzetelności.',
      tags: ['Metodologia, psychometria, statystyka'],
    },
    {
      text: 'Porównaj test psychologiczny oparty na normach i test psychologiczny oparty na kryterium. Wskaż najważniejsze podobieństwa i różnice w walidacji i stosowaniu testu, odwołując się do konkretnych przykładów psychologicznych.',
      tags: ['Metodologia, psychometria, statystyka'],
    },
    {
      text: 'Testy właściwości poznawczych a testy właściwości afektywnych. Porównaj te dwa rodzaje testów odwołując się do konkretnych przykładów narzędzi.',
      tags: ['Metodologia, psychometria, statystyka'],
    },
    {
      text: 'Dlaczego przy diagnozie z wykorzystaniem testów psychologicznych ważne jest posługiwanie się przedziałami ufności dla wyniku otrzymanego, a nie wynikiem wyrażonym punktowo? Omów na przykładzie konkretnego narzędzia.',
      tags: ['Metodologia, psychometria, statystyka'],
    },
    {
      text: 'Omów 3 cechy paradygmatu poznawczo-behawioralnego, które w największym stopniu różnią go od innych paradygmatów w psychologii klinicznej. Uzasadnij swój wybór.',
      tags: ['Psychologia kliniczna'],
    },
    {
      text: 'Wyobraź sobie, że pracujesz na młodzieżowym oddziale psychiatrycznym — omów jak powinna wyglądać praca psychologa prowadzona zgodnie z założeniami praktyki opartej na dowodach z badań empirycznych.',
      tags: ['Psychologia kliniczna'],
    },
    {
      text: 'Wskaż jaki typ pomocy jest najbardziej adekwatny dla pacjentki z opisu niżej. Uzasadnij swój wybór.',
      tags: ['Psychologia kliniczna'],
    },
    {
      text: 'Przeanalizuj fizjologiczną i psychologiczną odpowiedź na stres. Zaproponuj rekomendacje dla klientów, pomagające im ograniczyć wymienione fizjologiczne i psychologiczne konsekwencje stresu.',
      tags: ['Psychologia zdrowia'],
    },
    {
      text: 'Przeanalizuj jak wiek, płeć, klasa społeczna i przynależność do mniejszości etnicznej wpływają na zdrowie. Omów jak można wykorzystać tę wiedzę planując konsultację psychologiczną.',
      tags: ['Psychologia zdrowia'],
    },
    {
      text: 'Omów cele i założenia strategicznego zarządzania zasobami ludzkimi. Wskaż na rolę psychologa w realizacji tego podejścia podając co najmniej 3 przykłady pozytywnych konsekwencji dla funkcjonowania organizacji i pracowników w niej zatrudnionych. Uzasadnij swoją odpowiedź.',
      tags: ['Praca i organizacja'],
    },
    {
      text: 'W jaki sposób, wykorzystując wiedzę na temat segmentacji klientów za pomocą czynników demograficznych, psychograficznych i behawioralnych, można zapewnić skuteczność akcji promocyjnych i reklam?',
      tags: ['Praca i organizacja'],
    },
    {
      text: 'Jakie znaczenie dla funkcjonowania organizacji ma jej kultura organizacyjna i klimat organizacyjny?',
      tags: ['Praca i organizacja'],
    },
    {
      text: 'Na jakie negatywne zjawiska w pracy narażone są współczesne organizacje? Omów przynajmniej dwa z nich odwołując się do teorii i badań empirycznych.',
      tags: ['Praca i organizacja'],
    },
    {
      text: 'Omów podobieństwa i różnice między tradycyjnymi a nowoczesnymi koncepcjami marketingowymi.',
      tags: ['Praca i organizacja'],
    },
    {
      text: 'W jaki sposób odmienności i zaburzenia rozwojowe ucznia przekładają się na jego zdolność uczestniczenia w procesie edukacyjnym? Wyjaśnij na wybranym przykładzie odwołując się do mechanizmów psychologicznych i badań empirycznych, a także zaproponuj rozwiązania w celu zapewnienia takiemu uczniowi wsparcia.',
      tags: ['Psychologia edukacji'],
    },
    {
      text: 'Co badania psychologiczne wnoszą do edukacji? Przeanalizuj wkład psychologii do lepszego rozumienia i planowania procesu edukacyjnego na wybranych przykładach badań psychologicznych, wyjaśniając ich zastosowanie w praktyce edukacyjnej.',
      tags: ['Psychologia edukacji'],
    },
    {
      text: 'Jak wiedza na temat procesu uczenia się może być wykorzystywana, by bardziej efektywnie uczyć siebie i innych? Zilustruj co najmniej dwoma przykładami badań, wskazując w jaki sposób ich wnioski mogą być wykorzystywane w praktyce.',
      tags: ['Psychologia edukacji'],
    },
    {
      text: 'Dlaczego psycholog potrzebny jest w szkole? Przeanalizuj w jaki sposób wiedza, umiejętności i narzędzia psychologiczne wykorzystywane są w procesie edukacji i wychowania uczniów, wskaż również rolę psychologa w polepszaniu sytuacji uczniów.',
      tags: ['Psychologia edukacji'],
    },
    {
      text: 'Dlaczego edukacja jest ważna? Pomijając nabycie konkretnych umiejętności czy wiedzy, wskaż korzyści psychologiczne i poznawcze z udziału w procesie edukacyjnym, wspierając swoje argumenty wynikami badań empirycznych.',
      tags: ['Psychologia edukacji'],
    },
  ];

  const QUESTIONS = RAW_QUESTIONS.map((entry) => ({
    text: typeof entry.text === 'string' ? entry.text.trim() : '',
    tags: Array.isArray(entry.tags)
      ? entry.tags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag) => tag.length > 0)
      : [],
  }));

  global.QUESTIONS = QUESTIONS;
})(window);
