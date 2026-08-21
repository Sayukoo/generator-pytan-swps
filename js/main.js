/**
 * Main Application Entry Point
 * Orchestrates modules: mastery, timer, filters, cards, drawer, questionList,
 * keyboard, uiHelpers, themeManager, customBankImporter, studyPlan, motion.
 */

import { masteryManager as mastery } from './modules/mastery.js';
import { createTimerManager } from './modules/timer.js';
import { createFilterMenu } from './modules/filters.js';
import { getUniqueTags, TAG_COLOR_MAP } from './modules/tags.js';
import { selectQuestionPair, selectSingleQuestion, getCandidateIndices } from './modules/drawer.js';
import {
  createCardSlots,
  clearSelectionStyles,
  setCardsIdle,
  applySelectionStyles,
  applyQuestionToSlot,
  animateCard,
  refreshCardMasteryState,
} from './modules/cards.js';
import { renderQuestionList as renderList, popListItem } from './modules/questionList.js';
import { setupKeyboardShortcuts } from './modules/keyboard.js';
import { addRipple, updateTopbarInfo, setupHelpModal, celebrateMastery } from './modules/uiHelpers.js';
import { initTheme, setTheme } from './modules/themeManager.js';
import { parseJsonFile, getCustomBank } from './modules/customBankImporter.js';
import { setupStudyPlan } from './modules/studyPlan.js';
import {
  accentBurstColors,
  burstParticles,
  elementCenter,
  prefersReducedMotion,
  replayClass,
} from './modules/motion.js';

(function () {
  'use strict';

  const { QUESTIONS, ACTIVE_BANK } = window;

  if (!Array.isArray(QUESTIONS) || QUESTIONS.length === 0) {
    throw new Error('Brak danych pytań.');
  }

  const activeBank = ACTIVE_BANK || 'swps';
  const isUwr = activeBank === 'uwr';

  // Initialize Theme
  const currentTheme = initTheme();
  const themeSelectEl = document.getElementById('themeSelect');
  if (themeSelectEl) {
    themeSelectEl.value = currentTheme;
    themeSelectEl.addEventListener('change', (e) => setTheme(e.target.value));
  }

  // DOM Elements
  const drawBtn = document.getElementById('drawBtn');
  const resetBtn = document.getElementById('resetBtn');
  const helpBtn = document.getElementById('helpBtn');
  const helpDialog = document.getElementById('helpDialog');
  const closeHelpBtn = document.getElementById('closeHelp');

  const importBtn = document.getElementById('importBtn');
  const importDialog = document.getElementById('importDialog');
  const closeImportBtn = document.getElementById('closeImport');
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const importStatus = document.getElementById('importStatus');

  const tagsContainer = document.getElementById('filterTagList');
  const clearFiltersBtn = document.getElementById('filterClear');
  const hideMasteredEl = document.getElementById('filterHideMastered');
  const questionListEl = document.getElementById('questionList');
  const searchInputEl = document.getElementById('questionSearchInput');

  const tabSwpsBtn = document.getElementById('tab-swps');
  const tabUwrBtn = document.getElementById('tab-uwr');
  const tabCustomBtn = document.getElementById('tab-custom');

  const cardsRoot = document.getElementById('cardsRoot');
  const customTimerInput = document.getElementById('customTimerInput');

  let searchQuery = '';

  if (!drawBtn || !resetBtn || !helpBtn || !helpDialog || !closeHelpBtn) {
    throw new Error('Nie udało się zainicjalizować elementów interfejsu.');
  }

  // Set initial mode & tabs
  if (cardsRoot) {
    cardsRoot.dataset.mode = isUwr ? 'single' : 'pair';
  }

  if (tabSwpsBtn && tabUwrBtn && tabCustomBtn) {
    tabSwpsBtn.setAttribute('aria-selected', String(activeBank === 'swps'));
    tabUwrBtn.setAttribute('aria-selected', String(activeBank === 'uwr'));
    tabCustomBtn.setAttribute('aria-selected', String(activeBank === 'custom'));

    tabSwpsBtn.classList.toggle('is-active', activeBank === 'swps');
    tabUwrBtn.classList.toggle('is-active', activeBank === 'uwr');
    tabCustomBtn.classList.toggle('is-active', activeBank === 'custom');

    tabSwpsBtn.addEventListener('click', () => {
      if (activeBank !== 'swps') {
        window.localStorage.setItem('active_bank', 'swps');
        window.location.reload();
      }
    });

    tabUwrBtn.addEventListener('click', () => {
      if (activeBank !== 'uwr') {
        window.localStorage.setItem('active_bank', 'uwr');
        window.location.reload();
      }
    });

    tabCustomBtn.addEventListener('click', () => {
      if (activeBank !== 'custom') {
        const customData = getCustomBank();
        if (!customData) {
          if (importDialog) {
            importDialog.showModal();
          }
          return;
        }
        window.localStorage.setItem('active_bank', 'custom');
        window.location.reload();
      }
    });
  }

  // Setup Import Modal & File Drag/Drop
  if (importBtn && importDialog && closeImportBtn) {
    importBtn.addEventListener('click', () => importDialog.showModal());
    closeImportBtn.addEventListener('click', () => importDialog.close());
  }

  async function handleFileSelected(file) {
    if (!file) {
      return;
    }
    try {
      if (importStatus) {
        importStatus.className = 'import-status';
        importStatus.textContent = 'Wczytywanie pliku...';
      }
      const questions = await parseJsonFile(file);
      if (importStatus) {
        importStatus.className = 'import-status success';
        importStatus.textContent = `Pomyślnie zaimportowano ${questions.length} pytań! Ładowanie...`;
      }
      setTimeout(() => {
        window.localStorage.setItem('active_bank', 'custom');
        window.location.reload();
      }, 1000);
    } catch (err) {
      if (importStatus) {
        importStatus.className = 'import-status error';
        importStatus.textContent = err.message || 'Błąd podczas importu pliku.';
      }
    }
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelected(file);
      }
    });
  }

  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        handleFileSelected(file);
      }
    });
  }

  // Card slots & UI helpers
  const cardSlots = createCardSlots((index) => {
    mastery.toggleMastered(index);
  });
  const cardEls = cardSlots.map((slot) => slot.cardEl);
  const slotByCard = new Map(cardSlots.map((slot) => [slot.cardEl, slot]));

  if (isUwr && cardSlots[1]) {
    cardSlots[1].cardEl.hidden = true;
  }

  setupHelpModal(helpBtn, helpDialog, closeHelpBtn);

  // Filter Menu & Timer
  const filterMenu = createFilterMenu({
    tagListEl: tagsContainer,
    clearButton: clearFiltersBtn,
    hideMasteredEl,
    tags: getUniqueTags(QUESTIONS),
    tagColors: TAG_COLOR_MAP,
  });

  // Study Plan
  setupStudyPlan({
    dateInputId: 'examDateInput',
    resultContainerId: 'studyPlanResult',
    totalQuestions: QUESTIONS.length,
    masteryManager: mastery,
  });

  function applyTimerState(remaining, phase) {
    if (!drawBtn) {
      return;
    }
    drawBtn.classList.toggle('timer-selection', phase === 'selection');
    drawBtn.classList.toggle('timer-answer', phase === 'answer');
    const urgent = phase === 'answer' && typeof remaining === 'number' && remaining <= 10;
    drawBtn.classList.toggle('timer-urgent', urgent);
    if (phase === 'answer' && urgent && typeof remaining === 'number') {
      replayClass(drawBtn, 'timer-tick');
    }
  }

  const timer = createTimerManager({
    drawBtn,
    selectionDuration: isUwr ? 1 : 40,
    answerDuration: isUwr ? 180 : 120,
    onSelectionTimeout: handleSelectionTimeout,
    onAnswerComplete: () => {},
    onTick: applyTimerState,
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
        timer.setDurations({ answerDuration: isUwr ? 180 : 120 });
      }
    });
  }

  if (searchInputEl) {
    searchInputEl.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderQuestionList();
    });
  }

  // Subscriptions
  mastery.subscribe(() => {
    refreshAllMasteryStates();
    updateDrawAvailability();
    renderQuestionList();
  });

  filterMenu.subscribe(() => {
    updateDrawAvailability();
    renderQuestionList();
  });

  function refreshAllMasteryStates(changedIndex) {
    cardSlots.forEach((slot) => {
      const wasMastered = slot.cardEl.classList.contains('mastered');
      refreshCardMasteryState(slot, (idx) => mastery.isMastered(idx));
      const nowMastered = slot.cardEl.classList.contains('mastered');
      if (!wasMastered && nowMastered) {
        replayClass(slot.cardEl, 'mastered-pop');
        celebrateMastery(slot.cardEl, true);
      }
    });
    if (typeof changedIndex === 'number') {
      popListItem(questionListEl, changedIndex);
    }
    updateTopbarInfo({
      totalCount: QUESTIONS.length,
      masteredCount: mastery.getAll().size,
      isUwr,
    });
  }

  function renderQuestionList() {
    renderList({
      containerEl: questionListEl,
      questions: QUESTIONS,
      filterState: filterMenu.getState(),
      isMasteredFn: (idx) => mastery.isMastered(idx),
      activeQuestionIndices: cardSlots.map((s) => s.questionIndex),
      onSelectQuestion: (idx) => showQuestionOnStage(idx, { startTimer: true }),
      onToggleMastered: (idx) => {
        const wasMastered = mastery.isMastered(idx);
        mastery.toggleMastered(idx);
        if (!wasMastered && !prefersReducedMotion()) {
          popListItem(questionListEl, idx);
        }
      },
      searchQuery,
    });
    refreshAllMasteryStates();
  }

  function updateDrawAvailability() {
    const candidates = getCandidateIndices(QUESTIONS, filterMenu.getState(), (idx) => mastery.isMastered(idx));
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
    setCardsIdle(cardEls, false);
    applySelectionStyles(cardEls, cardEl, { autoPicked });
    if (!prefersReducedMotion()) {
      const { x, y } = elementCenter(cardEl);
      burstParticles(x, y, {
        count: 10,
        spread: 70,
        colors: accentBurstColors(cardEl),
      });
    }
  }

  function handleSelectionTimeout() {
    if (timer.isAnswerActive() || timer.isSelectionActive() || isUwr) {
      return;
    }
    const available = cardSlots.filter((slot) => !slot.cardEl.hidden && typeof slot.questionIndex === 'number');
    if (available.length === 0) {
      return;
    }
    const prioritized = available.filter((slot) => !mastery.isMastered(slot.questionIndex));
    const pool = prioritized.length > 0 ? prioritized : available;
    const choice = pool[Math.floor(Math.random() * pool.length)];
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

  function showQuestionOnStage(index, { startTimer = false } = {}) {
    if (typeof index !== 'number' || index < 0 || index >= QUESTIONS.length) {
      return;
    }
    clearSelectionStyles(cardEls);
    setCardsIdle(cardEls, false);
    timer.resetAll();

    if (isUwr) {
      applyQuestionToSlot(cardSlots[0], index, QUESTIONS, (idx) => mastery.isMastered(idx));
      animateCard(cardSlots[0]);
      if (cardSlots[1]) {
        applyQuestionToSlot(cardSlots[1], null, QUESTIONS, (idx) => mastery.isMastered(idx));
      }
      if (startTimer) {
        timer.startAnswer();
        applySelectionStyles(cardEls, cardSlots[0].cardEl, { autoPicked: false });
      }
    } else {
      applyQuestionToSlot(cardSlots[0], index, QUESTIONS, (idx) => mastery.isMastered(idx));
      applyQuestionToSlot(cardSlots[1], null, QUESTIONS, (idx) => mastery.isMastered(idx));
      animateCard(cardSlots[0]);
      if (cardSlots[1]) {
        cardSlots[1].cardEl.classList.add('idle');
      }
      if (startTimer) {
        timer.startAnswer();
        applySelectionStyles(cardEls, cardSlots[0].cardEl);
      }
    }
    renderQuestionList();
    updateDrawAvailability();
  }

  function draw() {
    if (timer.isAnswerActive()) {
      return;
    }

    const masteredSet = mastery.getAll();
    const filterState = filterMenu.getState();

    if (isUwr) {
      const index = selectSingleQuestion(QUESTIONS, filterState, masteredSet);
      if (index === null) {
        updateDrawAvailability();
        renderQuestionList();
        return;
      }
      clearSelectionStyles(cardEls);
      setCardsIdle(cardEls, false);
      if (drawBtn) {
        replayClass(drawBtn, 'pulse');
      }
      applyQuestionToSlot(cardSlots[0], index, QUESTIONS, (idx) => mastery.isMastered(idx));
      animateCard(cardSlots[0]);
      if (cardSlots[1]) {
        applyQuestionToSlot(cardSlots[1], null, QUESTIONS, (idx) => mastery.isMastered(idx));
      }
      timer.startAnswer();
      applySelectionStyles(cardEls, cardSlots[0].cardEl);
      updateDrawAvailability();
      renderQuestionList();
      return;
    }

    const [firstIndex, secondIndex] = selectQuestionPair(QUESTIONS, filterState, masteredSet);
    if (firstIndex === null && secondIndex === null) {
      updateDrawAvailability();
      renderQuestionList();
      return;
    }

    clearSelectionStyles(cardEls);
    setCardsIdle(cardEls, false);
    if (drawBtn) {
      replayClass(drawBtn, 'pulse');
    }

    applyQuestionToSlot(cardSlots[0], firstIndex, QUESTIONS, (idx) => mastery.isMastered(idx));
    applyQuestionToSlot(cardSlots[1], secondIndex, QUESTIONS, (idx) => mastery.isMastered(idx));
    animateCard(cardSlots[0]);
    animateCard(cardSlots[1]);

    timer.startSelection();
    updateDrawAvailability();
    renderQuestionList();
  }

  function reset() {
    cardSlots.forEach((slot) => applyQuestionToSlot(slot, null, QUESTIONS, (idx) => mastery.isMastered(idx)));
    timer.resetAll();
    clearSelectionStyles(cardEls);
    setCardsIdle(cardEls, true);
    updateDrawAvailability();
    renderQuestionList();
  }

  drawBtn.addEventListener('click', (event) => {
    if (drawBtn.disabled) {
      return;
    }
    addRipple(drawBtn, event);
    draw();
  });

  resetBtn.addEventListener('click', reset);

  setupKeyboardShortcuts({
    onDraw: draw,
    onReset: reset,
    onSelectCard: (slotIndex) => {
      if (!isUwr && cardSlots[slotIndex]?.cardEl) {
        handleAnswerStart(cardSlots[slotIndex].cardEl);
      }
    },
    onToggleActiveMastered: () => {
      const activeSlot = cardSlots.find((s) => typeof s.questionIndex === 'number' && s.cardEl.classList.contains('selected'));
      if (activeSlot && typeof activeSlot.questionIndex === 'number') {
        mastery.toggleMastered(activeSlot.questionIndex);
      }
    },
    onFocusSearch: () => searchInputEl?.focus(),
    isTimerAnswerActive: () => timer.isAnswerActive(),
    isDrawDisabled: () => drawBtn.disabled,
  });

  reset();
})();
