(function (global) {
  const activeBank = global.localStorage?.getItem('active_bank') || 'swps';
  const STORAGE_KEY = activeBank === 'uwr' ? 'uwr-mastered-questions.v1' : 'swps-mastered-questions.v3';

  /**
   * Zapewnia, że przekazany indeks jest prawidłową, nieujemną liczbą całkowitą.
   * Używane do czyszczenia danych wejściowych przed zapisem do lub odczytem ze zbioru.
   *
   * @param {any} index - Indeks do weryfikacji.
   * @returns {number|null} Prawidłowy indeks w postaci liczby, lub null, jeśli dane były nieprawidłowe.
   */
  function sanitizeIndex(index) {
    if (typeof index === 'number' && Number.isInteger(index) && index >= 0) {
      return index;
    }
    if (typeof index === 'string' && index.trim() !== '') {
      const parsed = Number(index);
      if (Number.isInteger(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    return null;
  }

  /**
   * Ładuje stan opanowanych pytań dla aktywnego banku z localStorage.
   *
   * @returns {Set<number>} Zbiór zawierający indeksy opanowanych pytań.
   */
  function loadMastered() {
    try {
      const raw = global.localStorage?.getItem(STORAGE_KEY);
      if (!raw) {
        return new Set();
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return new Set();
      }
      const valid = parsed
        .map(sanitizeIndex)
        .filter((value) => value !== null);
      return new Set(valid);
    } catch (error) {
      console.warn('[masteryManager] Failed to load mastered list:', error);
      return new Set();
    }
  }

  /**
   * Zapisuje stan opanowanych pytań dla aktywnego banku do localStorage.
   *
   * @param {Set<number>} set - Zbiór indeksów do zapisania.
   */
  function persist(set) {
    try {
      const payload = JSON.stringify(Array.from(set.values()));
      global.localStorage?.setItem(STORAGE_KEY, payload);
    } catch (error) {
      console.warn('[masteryManager] Failed to persist mastered list:', error);
    }
  }

  const listeners = new Set();
  let masteredSet = loadMastered();

  /**
   * Powiadamia wszystkich subskrybentów o zmianie stanu opanowanych pytań,
   * przekazując im kopię bieżącego zbioru (snapshot).
   */
  function emit() {
    const snapshot = new Set(masteredSet);
    listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error('[masteryManager] Listener error:', error);
      }
    });
  }

  /**
   * Ustawia lub usuwa flagę "opanowane" dla określonego pytania.
   *
   * @param {number|string} index - Indeks pytania w bieżącym banku.
   * @param {boolean} flag - Czy pytanie ma być oznaczone jako opanowane (true) czy nie (false).
   * @returns {boolean} Nowy status opanowania dla tego pytania, po aktualizacji.
   */
  function setMastered(index, flag) {
    const cleanIndex = sanitizeIndex(index);
    if (cleanIndex === null) {
      return false;
    }
    const nextFlag = Boolean(flag);
    const prevFlag = masteredSet.has(cleanIndex);
    if (nextFlag === prevFlag) {
      return prevFlag;
    }
    if (nextFlag) {
      masteredSet.add(cleanIndex);
    } else {
      masteredSet.delete(cleanIndex);
    }
    persist(masteredSet);
    emit();
    return nextFlag;
  }

  /**
   * Przełącza status opanowania dla określonego pytania.
   * Jeśli było opanowane, zostanie odznaczone, i odwrotnie.
   *
   * @param {number|string} index - Indeks pytania w bieżącym banku.
   * @returns {boolean} Nowy status opanowania po przełączeniu.
   */
  function toggleMastered(index) {
    const cleanIndex = sanitizeIndex(index);
    if (cleanIndex === null) {
      return false;
    }
    const shouldBeMastered = !masteredSet.has(cleanIndex);
    return setMastered(cleanIndex, shouldBeMastered);
  }

  /**
   * Sprawdza, czy określone pytanie jest obecnie oznaczone jako opanowane.
   *
   * @param {number|string} index - Indeks pytania.
   * @returns {boolean} Prawda, jeśli pytanie jest opanowane, w przeciwnym razie fałsz.
   */
  function isMastered(index) {
    const cleanIndex = sanitizeIndex(index);
    if (cleanIndex === null) {
      return false;
    }
    return masteredSet.has(cleanIndex);
  }

  /**
   * Zwraca kopię zbioru wszystkich zindeksowanych pytań, które zostały oznaczone jako opanowane.
   *
   * @returns {Set<number>} Kopia zbioru opanowanych indeksów.
   */
  function getAll() {
    return new Set(masteredSet);
  }

  /**
   * Usuwa status opanowania ze wszystkich pytań w bieżącym banku i czyści listę w localStorage.
   */
  function clearAll() {
    if (masteredSet.size === 0) {
      return;
    }
    masteredSet = new Set();
    persist(masteredSet);
    emit();
  }

  /**
   * Rejestruje funkcję nasłuchującą, która będzie wywoływana z każdym razem,
   * gdy stan opanowanych pytań ulegnie zmianie.
   *
   * @param {function(Set<number>): void} listener - Funkcja wywoływana ze zrzutem stanu opanowanych pytań.
   * @returns {function(): void} Funkcja do anulowania subskrypcji.
   */
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      return () => {};
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  global.masteryManager = {
    getActiveBank: () => activeBank,
    isMastered,
    setMastered,
    toggleMastered,
    getAll,
    clearAll,
    subscribe,
  };
})(window);
