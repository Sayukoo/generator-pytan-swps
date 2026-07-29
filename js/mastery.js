(function (global) {
  const activeBank = global.localStorage?.getItem('active_bank') || 'swps';
  const STORAGE_KEY = activeBank === 'uwr' ? 'uwr-mastered-questions.v1' : 'swps-mastered-questions.v3';

  /**
   * Sanitizes and parses an index value to ensure it is a valid non-negative integer.
   * @param {number|string} index - The index to sanitize.
   * @returns {number|null} The sanitized integer index, or null if invalid.
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
   * Retrieves the current set of mastered questions from localStorage.
   * @returns {Set<number>} A Set containing the indices of mastered questions.
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
   * Saves the current set of mastered questions to localStorage.
   * @param {Set<number>} set - The Set of mastered question indices to save.
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
   * Notifies all subscribed listeners with a snapshot of the current state.
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
   * Sets the mastery status of a specific question index.
   * @param {number|string} index - The index of the question.
   * @param {boolean} flag - True to mark as mastered, false to unmark.
   * @returns {boolean} The new mastery status of the question.
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
   * Toggles the mastery status of a specific question index.
   * @param {number|string} index - The index of the question.
   * @returns {boolean} The new mastery status of the question.
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
   * Checks if a given question is marked as mastered.
   * @param {number|string} index - The index of the question.
   * @returns {boolean} True if the question is mastered.
   */
  function isMastered(index) {
    const cleanIndex = sanitizeIndex(index);
    if (cleanIndex === null) {
      return false;
    }
    return masteredSet.has(cleanIndex);
  }

  /**
   * Returns a copy of the entire set of mastered question indices.
   * @returns {Set<number>} The mastered question indices.
   */
  function getAll() {
    return new Set(masteredSet);
  }

  /**
   * Clears all mastered questions and persists the empty state.
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
   * Subscribes a listener function to mastery state changes.
   * @param {Function} listener - The callback to execute on changes.
   * @returns {Function} An unsubscribe function to remove the listener.
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
