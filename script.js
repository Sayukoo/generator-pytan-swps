(function () {
  'use strict';

  const { QUESTIONS, masteryManager, createTimerManager, createFilterMenu } = window;

  if (!Array.isArray(QUESTIONS) || QUESTIONS.length === 0) {
    throw new Error('Brak danych pytań. Upewnij się, że questions.js został załadowany przed script.js.');
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

  const mastery = masteryManager;

  const numA = document.getElementById('numA');
  const numB = document.getElementById('numB');
  const drawBtn = document.getElementById('drawBtn');
  const resetBtn = document.getElementById('resetBtn');
  const helpBtn = document.getElementById('helpBtn');
  const helpDialog = document.getElementById('helpDialog');
  const closeHelpBtn = document.getElementById('closeHelp');
  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');
  const menuPanel = document.getElementById('menuPanel');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const includeMasteredEl = document.getElementById('filterIncludeMastered');
  const includeUnmasteredEl = document.getElementById('filterIncludeUnmastered');
  const tagsContainer = document.getElementById('filterTagList');
  const clearFiltersBtn = document.getElementById('filterClear');
  const masteryOverviewEl = document.getElementById('masteryOverview');
  const listUnmasteredEl = document.getElementById('listUnmastered');
  const listMasteredEl = document.getElementById('listMastered');
  const countUnmasteredEl = document.getElementById('countUnmastered');
  const countMasteredEl = document.getElementById('countMastered');
  const navMasteredCountEl = document.getElementById('navMasteredCount');
  const navTotalCountEl = document.getElementById('navTotalCount');

  if (!drawBtn || !resetBtn || !helpBtn || !helpDialog || !closeHelpBtn) {
    throw new Error('Nie udało się zainicjalizować elementów interfejsu.');
  }

  if (navTotalCountEl) {
    navTotalCountEl.textContent = String(QUESTIONS.length);
  }
  const cardSlots = Array.from(document.querySelectorAll('.card')).map((cardEl) => {
    const slot = {
      cardEl,
      numEl: cardEl.querySelector('.num'),
      questionEl: cardEl.querySelector('.question'),
      tagsEl: cardEl.querySelector('.card-tags'),
      questionIndex: null,
    };
    return slot;
  });

  const DEFAULT_TAG_COLOR = '#7f8c8d';
  const TAG_COLOR_MAP = {
    'Biologiczne podstawy zachowania': '#27ae60',
    'Kliniczna / Emocji i motywacji': '#e67e22',
    'Psychologia osobowości': '#9b59b6',
    'Psychologia poznawcza': '#2980b9',
    'Metodologia i statystyka': '#f1c40f',
    'Psychologia społeczna': '#e74c3c',
    Psychopatologia: '#c0392b',
    'Psychologia rozwoju': '#16a085',
    Psychometria: '#8e44ad',
    'Psychologia różnic indywidualnych': '#3498db',
    'Diagnoza psychologiczna': '#2c3e50',
    Etyka: '#d35400',
    ...(typeof window.TAG_COLORS === 'object' && window.TAG_COLORS !== null ? window.TAG_COLORS : {}),
  };

  function normalizeHex(hex) {
    if (typeof hex !== 'string') {
      return null;
    }
    const trimmed = hex.trim().replace(/^#/, '');
    if (trimmed.length === 3) {
      return trimmed
        .split('')
        .map((ch) => ch + ch)
        .join('');
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

  function rgbToString({ r, g, b }) {
    return `rgb(${r}, ${g}, ${b})`;
  }

  function rgbaToString({ r, g, b }, alpha) {
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  }

  function getTagVariants(tag) {
    const rgb = hexToRgb(TAG_COLOR_MAP[tag] ?? DEFAULT_TAG_COLOR) ?? hexToRgb(DEFAULT_TAG_COLOR);
    if (!rgb) {
      return {
        strong: '#7f8c8d',
        soft: 'rgba(127, 140, 141, 0.22)',
        accent: 'rgba(127, 140, 141, 0.28)',
        subtle: 'rgba(127, 140, 141, 0.12)',
        text: '#f9f9f9',
        onDark: '#bdc3c7',
      };
    }
    return {
      strong: rgbToString(rgb),
      soft: rgbaToString(rgb, 0.22),
      accent: rgbaToString(rgb, 0.28),
      subtle: rgbaToString(rgb, 0.12),
      text: '#f9f9f9',
      onDark: rgbToString(rgb),
    };
  }
  if (cardSlots.length === 0) {
    throw new Error('Brak kart w interfejsie.');
  }

  const cardEls = cardSlots.map((slot) => slot.cardEl);
  const slotByCard = new Map(cardSlots.map((slot) => [slot.cardEl, slot]));
  const masteryGroups = masteryOverviewEl
    ? Array.from(masteryOverviewEl.querySelectorAll('.mastery-group'))
    : [];

  masteryGroups.forEach((groupEl) => {
    if (!groupEl.dataset.collapsed) {
      groupEl.dataset.collapsed = 'false';
    }
    const headerBtn = groupEl.querySelector('.mastery-group__header');
    if (headerBtn) {
      headerBtn.setAttribute('aria-expanded', groupEl.dataset.collapsed !== 'true' ? 'true' : 'false');
    }
    const listEl = groupEl.querySelector('.mastery-list');
    if (listEl) {
      listEl.setAttribute('aria-hidden', groupEl.dataset.collapsed === 'true' ? 'true' : 'false');
    }
  });

  if (masteryOverviewEl) {
    masteryOverviewEl.addEventListener('click', (event) => {
      const headerBtn = event.target.closest('.mastery-group__header');
      if (headerBtn) {
        const groupEl = headerBtn.closest('.mastery-group');
        if (groupEl) {
          const isCollapsed = groupEl.dataset.collapsed === 'true';
          const next = !isCollapsed;
          groupEl.dataset.collapsed = next ? 'true' : 'false';
          headerBtn.setAttribute('aria-expanded', String(!next));
          const listEl = groupEl.querySelector('.mastery-list');
          if (listEl) {
            listEl.setAttribute('aria-hidden', next ? 'true' : 'false');
          }
        }
        return;
      }
      const target = event.target.closest('.mastery-item');
      if (!target || target.classList.contains('mastery-item--empty')) {
        return;
      }
      const index = Number.parseInt(target.dataset.index, 10);
      if (Number.isInteger(index)) {
        mastery.toggleMastered(index);
      }
    });
  }

  helpBtn.addEventListener('click', () => {
    helpDialog.showModal();
  });
  closeHelpBtn.addEventListener('click', () => {
    helpDialog.close();
  });

  function getUniqueTags(data) {
    const tagSet = new Set();
    data.forEach((item) => {
      if (!item || !Array.isArray(item.tags)) {
        return;
      }
      item.tags.forEach((tag) => {
        const trimmed = typeof tag === 'string' ? tag.trim() : '';
        if (trimmed) {
          tagSet.add(trimmed);
        }
      });
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'pl', { sensitivity: 'accent' }));
  }

  const filterMenu = createFilterMenu({
    toggleEl: menuToggle,
    closeEl: menuClose,
    panelEl: menuPanel,
    backdropEl: menuBackdrop,
    includeMasteredEl,
    includeUnmasteredEl,
    tagListEl: tagsContainer,
    clearButton: clearFiltersBtn,
    tags: getUniqueTags(QUESTIONS),
  });

  const timer = createTimerManager({
    drawBtn,
    selectionDuration: 40,
    answerDuration: 120,
    onSelectionTimeout: handleSelectionTimeout,
    onAnswerComplete: handleAnswerComplete,
  });

  mastery.subscribe(() => {
    refreshAllMasteryStates();
    updateDrawAvailability();
    renderMasteryOverview();
  });

  filterMenu.subscribe(() => {
    updateDrawAvailability();
    renderMasteryOverview();
  });

  function getCardQuestion(cardEl) {
    const slot = slotByCard.get(cardEl);
    if (!slot || typeof slot.questionIndex !== 'number') {
      return '';
    }
    const entry = QUESTIONS[slot.questionIndex];
    return entry && typeof entry.text === 'string' ? entry.text : '';
  }

  function clearSelectionStyles() {
    cardEls.forEach((card) => {
      card.classList.remove('selected', 'dimmed', 'auto-picked');
    });
  }

  function setCardsIdle(isIdle) {
    cardEls.forEach((card) => {
      card.classList.toggle('idle', isIdle);
    });
  }

  function applySelectionStyles(cardEl, { autoPicked = false } = {}) {
    cardEls.forEach((card) => {
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
    if (!slot || !slot.cardEl) {
      return;
    }
    const hasQuestion = typeof slot.questionIndex === 'number';
    const isMastered = hasQuestion && mastery.isMastered(slot.questionIndex);
    slot.cardEl.classList.toggle('has-question', hasQuestion);
    slot.cardEl.classList.toggle('mastered', Boolean(isMastered));
    if (slot.toggleBtn) {
      slot.toggleBtn.disabled = !hasQuestion;
      slot.toggleBtn.textContent = hasQuestion
        ? (isMastered ? 'Przywróć do losowania' : 'Oznacz jako opanowane')
        : 'Oznacz jako opanowane';
      slot.toggleBtn.setAttribute('aria-pressed', String(Boolean(isMastered)));
    }
  }

  function refreshAllMasteryStates() {
    cardSlots.forEach((slot) => refreshCardMasteryState(slot));
  }

  function updateMasteryList(targetEl, indices, activeSet, currentSet) {
    if (!targetEl) {
      return;
    }
    targetEl.innerHTML = '';
    if (!Array.isArray(indices) || indices.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'mastery-item mastery-item--empty';
      empty.textContent = 'Brak pytań';
      targetEl.appendChild(empty);
      return;
    }
    indices.forEach((idx) => {
      const entry = QUESTIONS[idx];
      const item = document.createElement('li');
      item.className = 'mastery-item';
      if (activeSet.has(idx)) {
        item.classList.add('is-active');
      }
      if (currentSet.has(idx)) {
        item.classList.add('is-current');
      }
      item.dataset.index = String(idx);

      const num = document.createElement('span');
      num.className = 'mastery-item__num';
      num.textContent = String(idx + 1).padStart(2, '0');

      const text = document.createElement('span');
      text.className = 'mastery-item__text';
      text.textContent = entry && typeof entry.text === 'string' ? entry.text : '';

      const primaryTag = Array.isArray(entry?.tags) && entry.tags.length > 0
        ? entry.tags[0]
        : '';
      const variants = getTagVariants(primaryTag);
      item.style.setProperty('--tag-color', variants.soft);
      item.style.setProperty('--tag-color-strong', variants.strong);
      item.style.setProperty('--mastery-text-color', variants.text);
      item.title = text.textContent;

      item.appendChild(num);
      item.appendChild(text);
      targetEl.appendChild(item);
    });
  }

  function renderMasteryOverview() {
    if (!listMasteredEl || !listUnmasteredEl) {
      return;
    }
    const masteredSet = mastery.getAll();
    const activeSet = new Set(getCandidateIndices());
    const currentSet = new Set(
      cardSlots
        .map((slot) => slot.questionIndex)
        .filter((idx) => typeof idx === 'number'),
    );
    const masteredIndices = [];
    const unmasteredIndices = [];
    QUESTIONS.forEach((_, idx) => {
      if (masteredSet.has(idx)) {
        masteredIndices.push(idx);
      } else {
        unmasteredIndices.push(idx);
      }
    });

    updateMasteryList(listUnmasteredEl, unmasteredIndices, activeSet, currentSet);
    updateMasteryList(listMasteredEl, masteredIndices, activeSet, currentSet);
    const unmasteredGroup = listUnmasteredEl.closest('.mastery-group');
    if (unmasteredGroup) {
      listUnmasteredEl.setAttribute(
        'aria-hidden',
        unmasteredGroup.dataset.collapsed === 'true' ? 'true' : 'false',
      );
    }
    const masteredGroup = listMasteredEl.closest('.mastery-group');
    if (masteredGroup) {
      listMasteredEl.setAttribute(
        'aria-hidden',
        masteredGroup.dataset.collapsed === 'true' ? 'true' : 'false',
      );
    }

    if (countUnmasteredEl) {
      countUnmasteredEl.textContent = String(unmasteredIndices.length);
    }
    if (countMasteredEl) {
      countMasteredEl.textContent = String(masteredIndices.length);
    }
    if (navMasteredCountEl) {
      navMasteredCountEl.textContent = String(masteredIndices.length);
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
      pill.style.setProperty('--tag-color-text', variants.text);
      tagsEl.appendChild(pill);
    });
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
    const text = entry && typeof entry.text === 'string' ? entry.text : '';
    const tags = entry && Array.isArray(entry.tags) ? entry.tags : [];
    if (slot.numEl) {
      slot.numEl.textContent = hasQuestion ? String(questionIndex + 1) : '?';
    }
    if (slot.questionEl) {
      slot.questionEl.textContent = text;
    }
    if (slot.tagsEl) {
      renderTags(slot.tagsEl, tags);
    }
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
    }
    if (hasQuestion) {
      slot.cardEl.dataset.questionIndex = String(questionIndex);
    } else {
      delete slot.cardEl.dataset.questionIndex;
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
    const available = cardSlots.filter((slot) => typeof slot.questionIndex === 'number');
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

  function handleAnswerComplete() {
    // dodatkowe efekty po zakończeniu odliczania mogą zostać dodane w przyszłości
  }

  cardEls.forEach((cardEl) => {
    cardEl.addEventListener('click', () => {
      handleAnswerStart(cardEl);
    });
  });

  function pickRandomIndex(pool) {
    if (!Array.isArray(pool) || pool.length === 0) {
      return null;
    }
    const idx = randInt(0, pool.length - 1);
    return pool[idx] ?? null;
  }

  function getCandidateIndices() {
    const state = filterMenu.getState();
    const includeMastered = Boolean(state.includeMastered);
    const includeUnmastered = Boolean(state.includeUnmastered);
    const tagFilter = state.selectedTags instanceof Set ? state.selectedTags : new Set();
    const hasTagFilter = tagFilter.size > 0;
    const matches = [];
    for (let i = 0; i < QUESTIONS.length; i += 1) {
      const entry = QUESTIONS[i];
      const isMastered = mastery.isMastered(i);
      if (isMastered && !includeMastered) {
        continue;
      }
      if (!isMastered && !includeUnmastered) {
        continue;
      }
      if (hasTagFilter) {
        const questionTags = Array.isArray(entry.tags) ? entry.tags : [];
        let hasMatch = false;
        for (let j = 0; j < questionTags.length; j += 1) {
          const tag = questionTags[j];
          if (tagFilter.has(tag)) {
            hasMatch = true;
            break;
          }
        }
        if (!hasMatch) {
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
    const state = filterMenu.getState();
    const preferUnmastered = Boolean(state.includeUnmastered);
    const masteredSet = mastery.getAll();
    const unmasteredCandidates = candidates.filter((idx) => !masteredSet.has(idx));

    const firstPool = preferUnmastered && unmasteredCandidates.length > 0
      ? unmasteredCandidates
      : candidates;
    const firstIndex = pickRandomIndex(firstPool);
    if (firstIndex === null) {
      return [null, null];
    }
    const remaining = candidates.filter((idx) => idx !== firstIndex);
    if (remaining.length === 0) {
      return [firstIndex, null];
    }
    let secondPool = remaining;
    if (preferUnmastered) {
      const unmasteredRemaining = remaining.filter((idx) => !masteredSet.has(idx));
      if (unmasteredRemaining.length > 0) {
        secondPool = unmasteredRemaining;
      }
    }
    const secondIndex = pickRandomIndex(secondPool);
    return [firstIndex, secondIndex];
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

  function draw() {
    if (timer.isAnswerActive() || cardEls.some(card => card.classList.contains('is-flipping'))) {
      return;
    }

    const [firstIndex, secondIndex] = selectQuestionPair();
    if (firstIndex === null && secondIndex === null) {
      updateDrawAvailability();
      renderMasteryOverview();
      return;
    }

    clearSelectionStyles();
    setCardsIdle(false);

    cardEls.forEach((card) => {
      card.classList.add('is-flipping');
    });

    // Change questions halfway through the flip
    setTimeout(() => {
      if (cardSlots[0]) {
        applyQuestionToSlot(cardSlots[0], firstIndex);
      }
      if (cardSlots[1]) {
        applyQuestionToSlot(cardSlots[1], secondIndex);
      }

      // Flip back
      cardEls.forEach((card) => {
        card.classList.remove('is-flipping');
      });

      timer.startSelection();
      updateDrawAvailability();
      renderMasteryOverview();
    }, 300); // Half of the 0.6s transition
  }

  function reset() {
    cardSlots.forEach((slot) => applyQuestionToSlot(slot, null));
    timer.resetAll();
    clearSelectionStyles();
    setCardsIdle(true);
    updateDrawAvailability();
    renderMasteryOverview();
  }

  function addRipple(e) {
    if (!drawBtn) {
      return;
    }
    try {
      const rect = drawBtn.getBoundingClientRect();
      const clientX = e?.clientX ?? (e?.touches && e.touches[0] && e.touches[0].clientX);
      const clientY = e?.clientY ?? (e?.touches && e.touches[0] && e.touches[0].clientY);
      const x = (typeof clientX === 'number' ? clientX : (rect.left + rect.width / 2)) - rect.left;
      const y = (typeof clientY === 'number' ? clientY : (rect.top + rect.height / 2)) - rect.top;
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

  function handleDrawButtonClick(event) {
    if (!drawBtn || drawBtn.disabled) {
      return;
    }
    addRipple(event);
    draw();
  }

  if (drawBtn) {
    drawBtn.addEventListener('click', handleDrawButtonClick);
    drawBtn.addEventListener(
      'touchstart',
      (event) => {
        if (!drawBtn.disabled) {
          addRipple(event);
        }
      },
      { passive: true },
    );
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', reset);
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!timer.isAnswerActive()) {
        draw();
      }
    }
    if (e.key && e.key.toLowerCase() === 'r') {
      reset();
    }
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

  reset();
})();
