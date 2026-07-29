(function () {
  'use strict';

  const { QUESTIONS, masteryManager, createTimerManager, createFilterMenu, ACTIVE_BANK, UI } = window;

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
  if (!UI) {
    throw new Error('Moduł UI nie jest dostępny.');
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

  if (navTotalCountEl) {
    navTotalCountEl.textContent = String(QUESTIONS.length);
  }
  if (navSubtitleEl) {
    navSubtitleEl.textContent = isUwr
      ? `${QUESTIONS.length} pytań · timer 3 min`
      : `${QUESTIONS.length} pytań · timer 5 min`;
  }
  if (tabSwpsBtn && tabUwrBtn) {
    if (isUwr) {
      tabUwrBtn.classList.add('is-active');
    } else {
      tabSwpsBtn.classList.add('is-active');
    }

    tabSwpsBtn.addEventListener('click', () => {
      if (isUwr) {
        localStorage.setItem('active_bank', 'swps');
        window.location.reload();
      }
    });
    tabUwrBtn.addEventListener('click', () => {
      if (!isUwr) {
        localStorage.setItem('active_bank', 'uwr');
        window.location.reload();
      }
    });
  }

  const cardSlots = [];
  if (cardsRoot) {
    const cards = cardsRoot.querySelectorAll('.card');
    cards.forEach((cardEl) => {
      cardSlots.push({
        cardEl,
        metaEl: cardEl.querySelector('.card-tags'),
        textEl: cardEl.querySelector('.question'),
        masteryBtnEl: cardEl.querySelector('.card-mastery'),
        numEl: cardEl.querySelector('.num'),
        questionIndex: null,
      });
    });
  }
  window.UI_STATE = { cardSlots };

  if (isUwr && cardSlots[1]) {
    cardSlots[1].cardEl.hidden = true;
  }

  const timer = createTimerManager({
    drawBtn: drawBtn,
    selectionDuration: isUwr ? 1 : 40,
    answerDuration: isUwr ? 180 : 120,
    onSelectionTimeout: handleSelectionTimeout,
    onAnswerComplete: () => {
      updateDrawBtnState();
    },
  });
  window.timer = timer;


  function getUniqueTags(data) {
    const tags = new Set();
    data.forEach((q) => {
      if (Array.isArray(q.tags)) {
        q.tags.forEach((t) => tags.add(t));
      }
    });
    return Array.from(tags);
  }

  const allTags = getUniqueTags(QUESTIONS);
  let uniqueTags = window.TAG_ORDER ? window.TAG_ORDER.filter(t => allTags.includes(t)) : allTags;

  const filterMenu = createFilterMenu({
    tagListEl: tagsContainer,
    clearButton: clearFiltersBtn,
    hideMasteredEl: hideMasteredEl,
    tags: uniqueTags,
    tagColors: window.TAG_COLOR_MAP,
  });

  if (filterMenu && filterMenu.subscribe) {
      filterMenu.subscribe(() => renderQuestionList());
  }




  function refreshCardMasteryState(slot) {
    const { questionIndex, masteryBtnEl } = slot;
    if (!masteryBtnEl) return;
    if (questionIndex === null) {
      masteryBtnEl.style.display = 'none';
      return;
    }
    masteryBtnEl.style.display = 'flex';
    const isMastered = mastery.isMastered(questionIndex);
    if (isMastered) {
      masteryBtnEl.classList.add('is-mastered');
      masteryBtnEl.title = 'Przywróć do puli';
    } else {
      masteryBtnEl.classList.remove('is-mastered');
      masteryBtnEl.title = 'Oznacz jako opanowane';
    }
  }
  window.refreshCardMasteryState = refreshCardMasteryState;

  function refreshAllMasteryStates() {
    cardSlots.forEach((slot) => refreshCardMasteryState(slot));
    const masteredCount = mastery.getAll().size;
    if (navMasteredCountEl) {
      navMasteredCountEl.textContent = String(masteredCount);
    }
  }

  function renderTags(tagsEl, tags) {
    if (!tagsEl) return;
    tagsEl.innerHTML = '';
    if (!Array.isArray(tags) || tags.length === 0) {
      tagsEl.classList.remove('has-tags');
      return;
    }
    tagsEl.classList.add('has-tags');
    tags.forEach((tag) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tag-filter';
      btn.textContent = tag;
      const variants = UI.getTagVariants(tag);
      btn.style.setProperty('--tag-rgb', variants.rgb);

      const isActive = filterMenu.getState().selectedTags.has(tag);
      if (isActive) btn.classList.add('is-active');

      btn.addEventListener('click', () => {
        filterMenu.toggleTag(tag);
        btn.classList.toggle('is-active');
      });
      tagsEl.appendChild(btn);
    });
  }

  function handleAnswerStart(cardEl, { autoPicked = false, force = false } = {}) {
    if (!force && (!timer.isSelectionActive() || timer.isAnswerActive())) {
      return;
    }
    UI.applySelectionStyles(cardEl, { autoPicked });
    timer.startAnswer();
    updateDrawBtnState();
  }

  function handleSelectionTimeout() {
    const candidates = cardSlots.filter((slot) => slot.questionIndex !== null);
    if (candidates.length === 0) {
      reset();
      return;
    }
    const chosen = candidates[randInt(0, candidates.length - 1)];
    UI.applySelectionStyles(chosen.cardEl, { autoPicked: true });
    timer.startAnswer();
    updateDrawBtnState();
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickRandomIndex(pool) {
    if (pool.length === 0) return null;
    return pool[randInt(0, pool.length - 1)];
  }

  function getCandidateIndices() {
    const state = filterMenu.getState();
    const hideMastered = Boolean(state.hideMastered);
    const tagFilter = state.selectedTags;
    const hasTagFilter = tagFilter.size > 0;

    const indices = [];
    QUESTIONS.forEach((q, idx) => {
      if (hideMastered && mastery.isMastered(idx)) {
        return;
      }
      if (hasTagFilter) {
        const qTags = Array.isArray(q.tags) ? q.tags : [];
        if (!qTags.some((t) => tagFilter.has(t))) {
          return;
        }
      }
      indices.push(idx);
    });
    return indices;
  }

  function selectQuestionPair() {
    const indices = getCandidateIndices();
    if (indices.length === 0) {
      return [null, null];
    }
    if (indices.length === 1) {
      return [indices[0], null];
    }
    const firstIndex = pickRandomIndex(indices);
    const remaining = indices.filter((i) => i !== firstIndex);
    const secondIndex = pickRandomIndex(remaining);
    return [firstIndex, secondIndex];
  }

  function selectSingleQuestion() {
    const indices = getCandidateIndices();
    if (indices.length === 0) return null;
    return pickRandomIndex(indices);
  }

  function draw() {
    if (timer.isAnswerActive()) {
      return;
    }

    if (isUwr) {
      const index = selectSingleQuestion();
      if (index === null) {
        updateDrawBtnState();
        renderQuestionList();
        return;
      }
      UI.clearSelectionStyles();
      UI.setCardsIdle(false);
      UI.applyQuestionToSlot(cardSlots[0], index);
      UI.applyQuestionToSlot(cardSlots[1], null);
      UI.animateCard(cardSlots[0]);
      if (cardSlots[1]) {
        cardSlots[1].cardEl.classList.add('idle');
      }
      UI.applySelectionStyles(cardSlots[0].cardEl, { autoPicked: true });
      timer.startAnswer();
      updateDrawBtnState();
      renderQuestionList();
      return;
    }

    const [firstIndex, secondIndex] = selectQuestionPair();
    if (firstIndex === null) {
      updateDrawBtnState();
      renderQuestionList();
      return;
    }
    if (secondIndex === null) {
      UI.clearSelectionStyles();
      UI.setCardsIdle(false);
      UI.applyQuestionToSlot(cardSlots[0], firstIndex);
      UI.applyQuestionToSlot(cardSlots[1], null);
      UI.animateCard(cardSlots[0]);
      if (cardSlots[1]) {
        cardSlots[1].cardEl.classList.add('idle');
      }
      UI.applySelectionStyles(cardSlots[0].cardEl, { autoPicked: true });
      timer.startAnswer();
      updateDrawBtnState();
      renderQuestionList();
      return;
    }

    UI.clearSelectionStyles();
    UI.setCardsIdle(false);
    UI.applyQuestionToSlot(cardSlots[0], firstIndex);
    UI.applyQuestionToSlot(cardSlots[1], secondIndex);
    UI.animateCard(cardSlots[0]);
    UI.animateCard(cardSlots[1]);

    timer.startSelection();
    updateDrawBtnState();
    renderQuestionList();
  }

  function reset() {
    cardSlots.forEach((slot) => UI.applyQuestionToSlot(slot, null));
    timer.resetAll();
    UI.clearSelectionStyles();
    UI.setCardsIdle(true);
    updateDrawBtnState();
    renderQuestionList();
  }

  function renderQuestionList() {
    if (!questionListEl) return;

    const state = filterMenu.getState();
    const hideMastered = Boolean(state.hideMastered);
    const tagFilter = state.selectedTags instanceof Set ? state.selectedTags : new Set();
    const hasTagFilter = tagFilter.size > 0;
    const currentSet = new Set(
      cardSlots
        .map((slot) => slot.questionIndex)
        .filter((idx) => typeof idx === 'number')
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

      numBtn.textContent = isMastered ? "✓" : String(idx + 1).padStart(2, '0');

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
        UI.showQuestionOnStage(idx, { startTimer: false });
      });

      const primaryTag = Array.isArray(entry.tags) && entry.tags[0] ? entry.tags[0] : '';
      if (primaryTag) {
        const variants = UI.getTagVariants(primaryTag);
        item.style.setProperty('--tag-color-strong', variants.strong);
        item.style.setProperty('--tag-color', variants.soft);
      }

      item.appendChild(numBtn);
      item.appendChild(textBtn);
      questionListEl.appendChild(item);
    });

    if (visibleCount === 0) {
      const empty = document.createElement('li');
      empty.className = 'question-item--empty';
      empty.textContent = 'Brak pytań spełniających kryteria.';
      questionListEl.appendChild(empty);
    }
  }

  function updateDrawBtnState() {
    if (!drawBtn) return;
    const candidates = getCandidateIndices();
    if (candidates.length === 0) {
      drawBtn.textContent = 'Brak pytań';
      drawBtn.classList.add('no-candidates');
      drawBtn.disabled = true;
    } else {
      drawBtn.textContent = 'Losuj';
      drawBtn.classList.remove('no-candidates');
      drawBtn.disabled = window.timer && window.timer.isAnswerActive();
    }
  }

  window.updateDrawAvailability = updateDrawBtnState;

  function init() {
    mastery.subscribe(() => {
      refreshAllMasteryStates();
      renderQuestionList();
    });
    refreshAllMasteryStates();
    UI.setCardsIdle(true);
    renderQuestionList();

    const allTags = getUniqueTags(QUESTIONS);
  let uniqueTags = window.TAG_ORDER ? window.TAG_ORDER.filter(t => allTags.includes(t)) : allTags;
    renderTags(tagsContainer, uniqueTags);

    if (drawBtn) {
      drawBtn.addEventListener('click', (e) => {
        UI.addRipple(e);
        draw();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', reset);
    }
    if (helpBtn) {
      helpBtn.addEventListener('click', () => helpDialog.showModal());
    }
    if (closeHelpBtn) {
      closeHelpBtn.addEventListener('click', () => helpDialog.close());
    }

    cardSlots.forEach((slot) => {
      if (slot.cardEl) {
        slot.cardEl.addEventListener('click', () => {
          if (slot.questionIndex !== null) {
            handleAnswerStart(slot.cardEl);
          }
        });
      }
      if (slot.masteryBtnEl) {
        slot.masteryBtnEl.addEventListener('click', (event) => {
          event.stopPropagation();
          if (slot.questionIndex !== null) {
            mastery.toggleMastered(slot.questionIndex);
          }
        });
      }
    });

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        filterMenu.clearTags();
        const activeTags = tagsContainer.querySelectorAll('.tag-filter.is-active');
        activeTags.forEach((btn) => btn.classList.remove('is-active'));
      });
    }
    if (hideMasteredEl) {
      hideMasteredEl.checked = filterMenu.getState().hideMastered;
      hideMasteredEl.addEventListener('change', (e) => {
        filterMenu.setHideMastered(e.target.checked);
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        if (
          document.activeElement.tagName === 'BUTTON' ||
          document.activeElement.tagName === 'INPUT' ||
          helpDialog.open
        ) {
          return;
        }
        e.preventDefault();
        draw();
      }
      if (e.code === 'Escape' && helpDialog.open) {
        helpDialog.close();
      }
    });

    if (numA) {
      numA.addEventListener('click', (event) => {
        if (timer.isSelectionActive()) {
          event.stopPropagation();
          handleAnswerStart(cardSlots[0].cardEl, { force: true });
        }
      });
    }
    if (numB) {
      numB.addEventListener('click', (event) => {
        if (timer.isSelectionActive() && cardSlots[1].questionIndex !== null) {
          event.stopPropagation();
          handleAnswerStart(cardSlots[1].cardEl, { force: true });
        }
      });
    }
  }

  init();
})();
