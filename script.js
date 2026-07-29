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

  const DEFAULT_TAG_COLOR = '#7f8c8d';
  const TAG_COLOR_MAP = {
    'Psychologia społeczna': '#e74c3c',
    'Emocje i motywacje': '#e67e22',
    'Psychologia rozwojowa': '#16a085',
    Psychopatologia: '#c0392b',
    'Psychologia osobowości': '#9b59b6',
    'Psychologia poznawcza': '#2980b9',
    'Psychologia różnic indywidualnych': '#3498db',
    Etyka: '#d35400',
    Diagnoza: '#2c3e50',
    'Metodologia, psychometria, statystyka': '#f1c40f',
    'Psychologia kliniczna': '#e84393',
    'Psychologia zdrowia': '#00b894',
    'Praca i organizacja': '#6c5ce7',
    'Psychologia edukacji': '#fdcb6e',
    'Zestaw egzaminacyjny': '#5eead4',
  };

  const TAG_ORDER = [
    'Psychologia społeczna',
    'Emocje i motywacje',
    'Psychologia rozwojowa',
    'Psychopatologia',
    'Psychologia osobowości',
    'Psychologia poznawcza',
    'Psychologia różnic indywidualnych',
    'Etyka',
    'Diagnoza',
    'Metodologia, psychometria, statystyka',
    'Psychologia kliniczna',
    'Psychologia zdrowia',
    'Praca i organizacja',
    'Psychologia edukacji',
    'Zestaw egzaminacyjny',
  ];

  function normalizeHex(hex) {
    if (typeof hex !== 'string') {
      return null;
    }
    const trimmed = hex.trim().replace(/^#/, '');
    if (trimmed.length === 3) {
      return trimmed.split('').map((ch) => ch + ch).join('');
    }
    if (trimmed.length === 6) {
      return trimmed;
    }
    return null;
  }

  function hexToRgb(hex) {
    const value = normalizeHex(hex);
    if (!value) {
      return null;
    }
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    if ([r, g, b].some((channel) => Number.isNaN(channel))) {
      return null;
    }
    return { r, g, b };
  }

  function getTagVariants(tag) {
    const rgb = hexToRgb(TAG_COLOR_MAP[tag] ?? DEFAULT_TAG_COLOR) ?? { r: 127, g: 140, b: 141 };
    return {
      strong: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      soft: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
      onDark: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      text: '#f9f9f9',
    };
  }

  function getUniqueTags(data) {
    const tagSet = new Set();
    data.forEach((item) => {
      (item?.tags || []).forEach((tag) => {
        if (typeof tag === 'string' && tag.trim()) {
          tagSet.add(tag.trim());
        }
      });
    });
    const orderIndex = new Map(TAG_ORDER.map((tag, index) => [tag, index]));
    return Array.from(tagSet).sort((a, b) => {
      const orderA = orderIndex.has(a) ? orderIndex.get(a) : Number.MAX_SAFE_INTEGER;
      const orderB = orderIndex.has(b) ? orderIndex.get(b) : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.localeCompare(b, 'pl', { sensitivity: 'accent' });
    });
  }

  const filterMenu = createFilterMenu({
    tagListEl: tagsContainer,
    clearButton: clearFiltersBtn,
    hideMasteredEl,
    tags: getUniqueTags(QUESTIONS),
    tagColors: TAG_COLOR_MAP,
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

  function clearSelectionStyles() {
    cardEls.forEach((card) => {
      card.classList.remove('selected', 'dimmed', 'auto-picked');
    });
  }

  function setCardsIdle(isIdle) {
    cardEls.forEach((card) => {
      if (!card.hidden) {
        card.classList.toggle('idle', isIdle);
      }
    });
  }

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

  function refreshAllMasteryStates() {
    cardSlots.forEach((slot) => refreshCardMasteryState(slot));
    const masteredCount = mastery.getAll().size;
    if (navMasteredCountEl) {
      navMasteredCountEl.textContent = String(masteredCount);
    }
  }

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
      const variants = getTagVariants(trimmed);
      pill.style.setProperty('--tag-color', variants.soft);
      pill.style.setProperty('--tag-color-strong', variants.strong);
      tagsEl.appendChild(pill);
    });
  }

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
        const variants = getTagVariants(tags[0]);
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

  function pickRandomIndex(pool) {
    if (!Array.isArray(pool) || pool.length === 0) {
      return null;
    }
    return pool[randInt(0, pool.length - 1)] ?? null;
  }

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

  function reset() {
    cardSlots.forEach((slot) => applyQuestionToSlot(slot, null));
    timer.resetAll();
    clearSelectionStyles();
    setCardsIdle(true);
    updateDrawAvailability();
    renderQuestionList();
  }

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

      const numBtn = document.createElement('button');
      numBtn.type = 'button';
      numBtn.className = 'question-item__num';
      numBtn.textContent = String(idx + 1).padStart(2, '0');
      numBtn.title = isMastered ? 'Przywróć do puli' : 'Oznacz jako opanowane';
      numBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        mastery.toggleMastered(idx);
      });

      const textBtn = document.createElement('button');
      textBtn.type = 'button';
      textBtn.className = 'question-item__text';
      textBtn.textContent = entry.text;
      textBtn.title = 'Pokaż na ekranie';
      textBtn.addEventListener('click', () => {
        showQuestionOnStage(idx, { startTimer: false });
      });

      const primaryTag = Array.isArray(entry.tags) && entry.tags[0] ? entry.tags[0] : '';
      if (primaryTag) {
        const variants = getTagVariants(primaryTag);
        item.style.setProperty('--tag-color-strong', variants.strong);
        item.style.setProperty('--tag-color', variants.soft);
      }

      item.appendChild(numBtn);
      item.appendChild(textBtn);
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
