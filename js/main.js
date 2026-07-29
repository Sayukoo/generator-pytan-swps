(function () {
  'use strict';

  const { QUESTIONS, masteryManager, createTimerManager, createFilterMenu, ACTIVE_BANK } = window;

  if (!Array.isArray(QUESTIONS) || QUESTIONS.length === 0) {
    throw new Error('Brak danych pytań.');
  }
  if (!masteryManager || typeof masteryManager.isMastered !== 'function') {
    throw new Error('Moduł masteryManager nie jest dostępny.');
  }
  if (typeof createTimerManager !== 'function') {
    throw new Error('Timer module is not loaded.');
  }
  if (typeof createFilterMenu !== 'function') {
    throw new Error('Filter menu module is not loaded.');
  }

  const activeBank = ACTIVE_BANK || 'swps';
  const isUwr = activeBank === 'uwr';

  const mastery = masteryManager;
  const drawBtn = document.getElementById('drawBtn');
  const resetBtn = document.getElementById('resetBtn');
  const helpBtn = document.getElementById('helpBtn');
  const helpDialog = document.getElementById('helpDialog');
  const closeHelpBtn = document.getElementById('closeHelp');
  const tagsContainer = document.getElementById('filterTagList');
  const clearFiltersBtn = document.getElementById('filterClear');
  const hideMasteredEl = document.getElementById('filterHideMastered');
  const questionListEl = document.getElementById('questionList');
  const navMasteredCountEl = document.getElementById('navMasteredCount');
  const navTotalCountEl = document.getElementById('navTotalCount');
  const navSubtitleEl = document.getElementById('navSubtitle');
  const tabSwpsBtn = document.getElementById('tab-swps');
  const tabUwrBtn = document.getElementById('tab-uwr');
  const cardsRoot = document.getElementById('cardsRoot');
  const numA = document.getElementById('numA');
  const numB = document.getElementById('numB');
  const customTimerInput = document.getElementById('customTimerInput');

  if (!drawBtn || !resetBtn || !helpBtn || !helpDialog || !closeHelpBtn) {
    throw new Error('Nie udało się zainicjalizować elementów interfejsu.');
  }

  if (navTotalCountEl) {
    navTotalCountEl.textContent = String(QUESTIONS.length);
  }
  if (navSubtitleEl) {
    navSubtitleEl.textContent = isUwr
      ? `${QUESTIONS.length} pytań · timer 3 min`
      : `${QUESTIONS.length} pytań egzaminacyjnych`;
  }

  if (cardsRoot) {
    cardsRoot.dataset.mode = isUwr ? 'single' : 'pair';
  }

  if (tabSwpsBtn && tabUwrBtn) {
    tabSwpsBtn.setAttribute('aria-selected', String(!isUwr));
    tabUwrBtn.setAttribute('aria-selected', String(isUwr));
    tabSwpsBtn.classList.toggle('is-active', !isUwr);
    tabUwrBtn.classList.toggle('is-active', isUwr);

    tabSwpsBtn.addEventListener('click', () => {
      if (isUwr) {
        window.localStorage.setItem('active_bank', 'swps');
        window.location.reload();
      }
    });

    tabUwrBtn.addEventListener('click', () => {
      if (!isUwr) {
        window.localStorage.setItem('active_bank', 'uwr');
        window.location.reload();
      }
    });
  }

  const cardSlots = Array.from(document.querySelectorAll('.card')).map((cardEl) => {
    const slot = {
      cardEl,
      numEl: cardEl.querySelector('.num'),
      questionEl: cardEl.querySelector('.question'),
      tagsEl: cardEl.querySelector('.card-tags'),
      masteryBtn: cardEl.querySelector('.card-mastery'),
      questionIndex: null,
    };
    if (slot.masteryBtn) {
      slot.masteryBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (typeof slot.questionIndex === 'number') {
          mastery.toggleMastered(slot.questionIndex);
        }
      });
    }
    return slot;
  });

  if (isUwr && cardSlots[1]) {
    cardSlots[1].cardEl.hidden = true;
  }

  const filterMenu = createFilterMenu({
    tagListEl: tagsContainer,
    clearButton: clearFiltersBtn,
    hideMasteredEl,
    tags: window.tagsManager.getUniqueTags(QUESTIONS),
    tagColors: window.tagsManager.TAG_COLOR_MAP,
  });

  const timer = createTimerManager({
    drawBtn,
    selectionDuration: isUwr ? 1 : 40,
    answerDuration: isUwr ? 180 : 120,
    onSelectionTimeout: handleSelectionTimeout,
    onAnswerComplete: () => {},
  });

  if (isUwr) {
    timer.setDurations({ answerDuration: 180 });
  }

  if (customTimerInput) {
    customTimerInput.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!Number.isNaN(val) && val > 0) {
        timer.setDurations({ answerDuration: val });
      } else {
        // Reset to defaults if empty/invalid
        timer.setDurations({ answerDuration: isUwr ? 180 : 120 });
      }
    });
  }

  mastery.subscribe(() => {
    refreshAllMasteryStates();
    updateDrawAvailability();
    renderQuestionList();
  });

  filterMenu.subscribe(() => {
    updateDrawAvailability();
    renderQuestionList();
  });

  helpBtn.addEventListener('click', () => helpDialog.showModal());
  closeHelpBtn.addEventListener('click', () => helpDialog.close());

  const cardEls = cardSlots.map((slot) => slot.cardEl);
  const slotByCard = new Map(cardSlots.map((slot) => [slot.cardEl, slot]));

  /**
   * Clears selection, auto-picked, and dimmed styles from all card elements.
   */
  function clearSelectionStyles() {
    cardEls.forEach((card) => {
      card.classList.remove('selected', 'dimmed', 'auto-picked');
    });
  }

  /**
   * Toggles the idle state for all visible cards.
   * @param {boolean} isIdle - True to set cards to idle, false otherwise.
   */
  function setCardsIdle(isIdle) {
    cardEls.forEach((card) => {
      if (!card.hidden) {
        card.classList.toggle('idle', isIdle);
      }
    });
  }

  /**
   * Applies selection styling to a chosen card and dims the others.
   * @param {HTMLElement} cardEl - The card element that was selected.
   * @param {Object} [options] - Options for selection.
   * @param {boolean} [options.autoPicked=false] - Whether the card was picked automatically by timeout.
   */
  function applySelectionStyles(cardEl, { autoPicked = false } = {}) {
    cardEls.forEach((card) => {
      if (card.hidden) {
        return;
      }
      if (card === cardEl) {
        card.classList.add('selected');
        card.classList.toggle('auto-picked', autoPicked);
        card.classList.remove('dimmed');
      } else {
        card.classList.remove('selected', 'auto-picked');
        card.classList.add('dimmed');
      }
    });
  }

  /**
   * Refreshes the visual mastery state of a single card slot.
   * @param {Object} slot - The card slot object containing references.
   */
  function refreshCardMasteryState(slot) {
    if (!slot?.cardEl) {
      return;
    }
    const hasQuestion = typeof slot.questionIndex === 'number';
    const isMastered = hasQuestion && mastery.isMastered(slot.questionIndex);
    slot.cardEl.classList.toggle('has-question', hasQuestion);
    slot.cardEl.classList.toggle('mastered', Boolean(isMastered));
    if (slot.masteryBtn) {
      slot.masteryBtn.hidden = !hasQuestion;
      slot.masteryBtn.textContent = isMastered ? 'Przywróć' : 'Opanowane';
      slot.masteryBtn.setAttribute('aria-pressed', String(Boolean(isMastered)));
    }
  }

  /**
   * Refreshes the mastery states across all card slots and updates the navigation count.
   */
  function refreshAllMasteryStates() {
    cardSlots.forEach((slot) => refreshCardMasteryState(slot));
    const masteredCount = mastery.getAll().size;
    if (navMasteredCountEl) {
      navMasteredCountEl.textContent = String(masteredCount);
    }
  }

  /**
   * Renders tag pills inside a container element.
   * @param {HTMLElement} tagsEl - The DOM container for tags.
   * @param {Array<string>} tags - An array of tag names to render.
   */
  function renderTags(tagsEl, tags) {
    if (!tagsEl) {
      return;
    }
    tagsEl.innerHTML = '';
    if (!Array.isArray(tags) || tags.length === 0) {
      tagsEl.classList.remove('has-tags');
      return;
    }
    tagsEl.classList.add('has-tags');
    tags.forEach((tag) => {
      const trimmed = typeof tag === 'string' ? tag.trim() : '';
      if (!trimmed) {
        return;
      }
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.textContent = trimmed;
      const variants = window.tagsManager.getTagVariants(trimmed);
      pill.style.setProperty('--tag-color', variants.soft);
      pill.style.setProperty('--tag-color-strong', variants.strong);
      tagsEl.appendChild(pill);
    });
  }

  /**
   * Applies a pop and glow animation to a card slot.
   * @param {Object} slot - The card slot object to animate.
   */
  function animateCard(slot) {
    if (!slot?.cardEl || slot.cardEl.hidden) {
      return;
    }
    slot.cardEl.classList.remove('pop', 'glow');
    void slot.cardEl.offsetWidth;
    slot.cardEl.classList.add('pop', 'glow');
    if (slot.numEl) {
      slot.numEl.classList.remove('flip');
      void slot.numEl.offsetWidth;
      slot.numEl.classList.add('flip');
    }
  }

  /**
   * Populates a card slot with a specific question's data based on index.
   * @param {Object} slot - The card slot to update.
   * @param {number|null} questionIndex - The index of the question, or null to clear.
   */
  function applyQuestionToSlot(slot, questionIndex) {
    if (!slot) {
      return;
    }
    const hasQuestion = typeof questionIndex === 'number'
      && Number.isInteger(questionIndex)
      && questionIndex >= 0
      && questionIndex < QUESTIONS.length;
    slot.questionIndex = hasQuestion ? questionIndex : null;
    const entry = hasQuestion ? QUESTIONS[questionIndex] : null;
    const text = entry?.text || '';
    const tags = entry?.tags || [];

    if (slot.numEl) {
      slot.numEl.textContent = hasQuestion ? String(questionIndex + 1) : '?';
    }
    if (slot.questionEl) {
      slot.questionEl.textContent = text;
    }
    renderTags(slot.tagsEl, tags);

    if (slot.cardEl) {
      if (hasQuestion && tags.length > 0) {
        const variants = window.tagsManager.getTagVariants(tags[0]);
        slot.cardEl.classList.add('card-accented');
        slot.cardEl.style.setProperty('--card-accent', variants.soft);
        slot.cardEl.style.setProperty('--card-accent-strong', variants.strong);
        slot.cardEl.style.setProperty('--card-accent-text', variants.onDark);
      } else {
        slot.cardEl.classList.remove('card-accented');
        slot.cardEl.style.removeProperty('--card-accent');
        slot.cardEl.style.removeProperty('--card-accent-strong');
        slot.cardEl.style.removeProperty('--card-accent-text');
      }
      if (hasQuestion) {
        slot.cardEl.dataset.questionIndex = String(questionIndex);
      } else {
        delete slot.cardEl.dataset.questionIndex;
      }
    }
    refreshCardMasteryState(slot);
  }

  /**
   * Handles the logic for when a user (or timeout) selects a card to answer.
   * @param {HTMLElement} cardEl - The card element selected.
   * @param {Object} [options] - Start options.
   * @param {boolean} [options.autoPicked=false] - True if automatically picked.
   * @param {boolean} [options.force=false] - True to force answer phase despite timer state.
   */
  function handleAnswerStart(cardEl, { autoPicked = false, force = false } = {}) {
    if (!cardEl || timer.isAnswerActive()) {
      return;
    }
    if (!force && !timer.isSelectionActive()) {
      return;
    }
    const slot = slotByCard.get(cardEl);
    if (!slot || typeof slot.questionIndex !== 'number') {
      return;
    }
    if (!timer.startAnswer()) {
      return;
    }
    setCardsIdle(false);
    applySelectionStyles(cardEl, { autoPicked });
  }

  /**
   * Automatically selects a card when the selection timer runs out (for paired mode).
   */
  function handleSelectionTimeout() {
    if (timer.isAnswerActive() || timer.isSelectionActive()) {
      return;
    }
    if (isUwr) {
      return;
    }
    const available = cardSlots.filter((slot) => !slot.cardEl.hidden && typeof slot.questionIndex === 'number');
    if (available.length === 0) {
      return;
    }
    const prioritized = available.filter((slot) => !mastery.isMastered(slot.questionIndex));
    const pool = prioritized.length > 0 ? prioritized : available;
    const choice = pool[randInt(0, pool.length - 1)];
    if (choice) {
      handleAnswerStart(choice.cardEl, { autoPicked: true, force: true });
    }
  }

  cardEls.forEach((cardEl) => {
    cardEl.addEventListener('click', () => {
      if (isUwr) {
        return;
      }
      handleAnswerStart(cardEl);
    });
  });

  /**
   * Generates a cryptographically secure random integer between min and max inclusive.
   * @param {number} min - The minimum integer.
   * @param {number} max - The maximum integer.
   * @returns {number} The random integer.
   */
  function randInt(min, max) {
    const range = max - min + 1;
    if (range <= 0) {
      return min;
    }
    const maxUint = 0xFFFFFFFF;
    const limit = Math.floor(maxUint / range) * range;
    const buffer = new Uint32Array(1);
    let value;
    do {
      window.crypto.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= limit);
    return min + (value % range);
  }

  /**
   * Picks a random item from an array pool.
   * @param {Array} pool - The pool of items.
   * @returns {*} A random item, or null if pool is empty.
   */
  function pickRandomIndex(pool) {
    if (!Array.isArray(pool) || pool.length === 0) {
      return null;
    }
    return pool[randInt(0, pool.length - 1)] ?? null;
  }

  /**
   * Retrieves indices of questions that match the current filter state.
   * @returns {Array<number>} An array of valid candidate indices.
   */
  function getCandidateIndices() {
    const state = filterMenu.getState();
    const hideMastered = Boolean(state.hideMastered);
    const tagFilter = state.selectedTags instanceof Set ? state.selectedTags : new Set();
    const hasTagFilter = tagFilter.size > 0;
    const matches = [];

    for (let i = 0; i < QUESTIONS.length; i += 1) {
      const entry = QUESTIONS[i];
      const isMastered = mastery.isMastered(i);
      if (hideMastered && isMastered) {
        continue;
      }
      if (hasTagFilter) {
        const questionTags = Array.isArray(entry.tags) ? entry.tags : [];
        if (!questionTags.some((tag) => tagFilter.has(tag))) {
          continue;
        }
      }
      matches.push(i);
    }
    return matches;
  }

  /**
   * Selects two random questions for the paired draw mode, prioritizing unmastered questions.
   * @returns {Array<number|null>} A pair of question indices.
   */
  function selectQuestionPair() {
    const candidates = getCandidateIndices();
    if (candidates.length === 0) {
      return [null, null];
    }
    const masteredSet = mastery.getAll();
    const unmasteredCandidates = candidates.filter((idx) => !masteredSet.has(idx));
    const firstPool = unmasteredCandidates.length > 0 ? unmasteredCandidates : candidates;
    const firstIndex = pickRandomIndex(firstPool);
    if (firstIndex === null) {
      return [null, null];
    }
    const remaining = candidates.filter((idx) => idx !== firstIndex);
    if (remaining.length === 0) {
      return [firstIndex, null];
    }
    const unmasteredRemaining = remaining.filter((idx) => !masteredSet.has(idx));
    const secondPool = unmasteredRemaining.length > 0 ? unmasteredRemaining : remaining;
    return [firstIndex, pickRandomIndex(secondPool)];
  }

  /**
   * Selects a single random question for the single draw mode, prioritizing unmastered questions.
   * @returns {number|null} The chosen question index.
   */
  function selectSingleQuestion() {
    const candidates = getCandidateIndices();
    if (candidates.length === 0) {
      return null;
    }
    const masteredSet = mastery.getAll();
    const unmastered = candidates.filter((idx) => !masteredSet.has(idx));
    const pool = unmastered.length > 0 ? unmastered : candidates;
    return pickRandomIndex(pool);
  }

  /**
   * Updates the UI state of the draw button based on candidate availability.
   * @returns {boolean} True if there are candidates available, false otherwise.
   */
  function updateDrawAvailability() {
    const candidates = getCandidateIndices();
    const hasCandidates = candidates.length > 0;
    if (drawBtn && !timer.isAnswerActive()) {
      drawBtn.disabled = !hasCandidates;
    }
    if (drawBtn) {
      drawBtn.classList.toggle('no-candidates', !hasCandidates);
    }
    if (!timer.isAnswerActive() && !timer.isSelectionActive()) {
      timer.setButtonLabel(hasCandidates ? timer.DRAW_LABEL : 'Brak pytań');
    }
    return hasCandidates;
  }

  /**
   * Displays a specific question on the stage and optionally starts the answer timer.
   * @param {number} index - The index of the question to show.
   * @param {Object} [options] - Display options.
   * @param {boolean} [options.startTimer=false] - True to start the timer immediately.
   */
  function showQuestionOnStage(index, { startTimer = false } = {}) {
    if (typeof index !== 'number' || index < 0 || index >= QUESTIONS.length) {
      return;
    }
    clearSelectionStyles();
    setCardsIdle(false);
    timer.resetAll();

    if (isUwr) {
      applyQuestionToSlot(cardSlots[0], index);
      animateCard(cardSlots[0]);
      if (cardSlots[1]) {
        applyQuestionToSlot(cardSlots[1], null);
      }
      if (startTimer) {
        timer.startAnswer();
        applySelectionStyles(cardSlots[0].cardEl, { autoPicked: false });
      }
    } else {
      applyQuestionToSlot(cardSlots[0], index);
      applyQuestionToSlot(cardSlots[1], null);
      animateCard(cardSlots[0]);
      if (cardSlots[1]) {
        cardSlots[1].cardEl.classList.add('idle');
      }
    }
    renderQuestionList();
    updateDrawAvailability();
  }

  /**
   * Performs a draw action, pulling one or two questions based on the active mode.
   */
  function draw() {
    if (timer.isAnswerActive()) {
      return;
    }

    if (isUwr) {
      const index = selectSingleQuestion();
      if (index === null) {
        updateDrawAvailability();
        renderQuestionList();
        return;
      }
      clearSelectionStyles();
      setCardsIdle(false);
      if (drawBtn) {
        drawBtn.classList.remove('pulse');
        void drawBtn.offsetWidth;
        drawBtn.classList.add('pulse');
      }
      applyQuestionToSlot(cardSlots[0], index);
      animateCard(cardSlots[0]);
      if (cardSlots[1]) {
        applyQuestionToSlot(cardSlots[1], null);
      }
      timer.startAnswer();
      applySelectionStyles(cardSlots[0].cardEl);
      updateDrawAvailability();
      renderQuestionList();
      return;
    }

    const [firstIndex, secondIndex] = selectQuestionPair();
    if (firstIndex === null && secondIndex === null) {
      updateDrawAvailability();
      renderQuestionList();
      return;
    }

    clearSelectionStyles();
    setCardsIdle(false);
    if (drawBtn) {
      drawBtn.classList.remove('pulse');
      void drawBtn.offsetWidth;
      drawBtn.classList.add('pulse');
    }

    applyQuestionToSlot(cardSlots[0], firstIndex);
    applyQuestionToSlot(cardSlots[1], secondIndex);
    animateCard(cardSlots[0]);
    animateCard(cardSlots[1]);

    timer.startSelection();
    updateDrawAvailability();
    renderQuestionList();
  }

  /**
   * Resets the stage back to the idle state and clears timers.
   */
  function reset() {
    cardSlots.forEach((slot) => applyQuestionToSlot(slot, null));
    timer.resetAll();
    clearSelectionStyles();
    setCardsIdle(true);
    updateDrawAvailability();
    renderQuestionList();
  }

  /**
   * Renders the interactive sidebar list of questions based on active filters.
   */
  function renderQuestionList() {
    if (!questionListEl) {
      return;
    }
    const state = filterMenu.getState();
    const hideMastered = Boolean(state.hideMastered);
    const tagFilter = state.selectedTags instanceof Set ? state.selectedTags : new Set();
    const hasTagFilter = tagFilter.size > 0;
    const currentSet = new Set(
      cardSlots
        .map((slot) => slot.questionIndex)
        .filter((idx) => typeof idx === 'number'),
    );

    questionListEl.innerHTML = '';
    let visibleCount = 0;

    QUESTIONS.forEach((entry, idx) => {
      const isMastered = mastery.isMastered(idx);
      if (hideMastered && isMastered) {
        return;
      }
      if (hasTagFilter) {
        const tags = Array.isArray(entry.tags) ? entry.tags : [];
        if (!tags.some((tag) => tagFilter.has(tag))) {
          return;
        }
      }

      visibleCount += 1;
      const item = document.createElement('li');
      item.className = 'question-item';
      if (isMastered) {
        item.classList.add('is-mastered');
      }
      if (currentSet.has(idx)) {
        item.classList.add('is-current');
      }

      const numText = document.createElement('span');
      numText.className = 'question-item__num';
      numText.textContent = String(idx + 1).padStart(2, '0');

      // Use div for the tooltip to avoid nesting buttons
      const tooltip = document.createElement('div');
      tooltip.className = 'question-item__text';
      tooltip.textContent = entry.text;

      item.title = 'Pokaż na ekranie i zacznij odpowiadać (Kliknij PPM by oznaczyć jako opanowane)';
      item.addEventListener('click', () => {
        showQuestionOnStage(idx, { startTimer: true });
      });

      // Right click to toggle mastery since left click is now taking over
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        mastery.toggleMastered(idx);
      });

      const primaryTag = Array.isArray(entry.tags) && entry.tags[0] ? entry.tags[0] : '';
      if (primaryTag) {
        const variants = window.tagsManager.getTagVariants(primaryTag);
        item.style.setProperty('--tag-color-strong', variants.strong);
        item.style.setProperty('--tag-color', variants.soft);
      }

      item.appendChild(numText);
      item.appendChild(tooltip);
      questionListEl.appendChild(item);
    });

    if (visibleCount === 0) {
      const empty = document.createElement('li');
      empty.className = 'question-item question-item--empty';
      empty.textContent = 'Brak pytań dla filtrów';
      questionListEl.appendChild(empty);
    }

    refreshAllMasteryStates();
  }

  /**
   * Adds a ripple visual effect to the draw button upon clicking.
   * @param {Event} e - The click or touch event.
   */
  function addRipple(e) {
    try {
      const rect = drawBtn.getBoundingClientRect();
      const clientX = e?.clientX ?? e?.touches?.[0]?.clientX;
      const clientY = e?.clientY ?? e?.touches?.[0]?.clientY;
      const x = (typeof clientX === 'number' ? clientX : rect.left + rect.width / 2) - rect.left;
      const y = (typeof clientY === 'number' ? clientY : rect.top + rect.height / 2) - rect.top;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      drawBtn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    } catch (_) {
      // no-op
    }
  }

  drawBtn.addEventListener('click', (event) => {
    if (drawBtn.disabled) {
      return;
    }
    addRipple(event);
    draw();
  });

  resetBtn.addEventListener('click', reset);

  document.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target.tagName)) {
      if (e.target.tagName === 'BUTTON' && e.code !== 'Space') {
        return;
      }
      if (e.target.tagName !== 'BUTTON') {
        return;
      }
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (!timer.isAnswerActive() && !drawBtn.disabled) {
        draw();
      }
    }
    if (e.key && e.key.toLowerCase() === 'r' && e.target.tagName !== 'INPUT') {
      reset();
    }
  });

  reset();

})();
