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
import { renderQuestionList as renderList } from './modules/questionList.js';
import { setupKeyboardShortcuts } from './modules/keyboard.js';
import { addRipple, updateTopbarInfo, setupHelpModal, celebrateMastery } from './modules/uiHelpers.js';
import { initTheme, setTheme } from './modules/themeManager.js';
import { parseJsonFile, getCustomBank } from './modules/customBankImporter.js';
import { setupStudyPlan } from './modules/studyPlan.js';
import { playTimeUpChime } from './modules/sound.js';
import {
  accentBurstColors,
  burstParticles,
  elementCenter,
  prefersReducedMotion,
  replayClass,
} from './modules/motion.js';
import { createZenManager } from './modules/zenMode.js';

(function () {
  'use strict';

  const { QUESTIONS, ACTIVE_BANK } = window;

  if (!Array.isArray(QUESTIONS) || QUESTIONS.length === 0) {
    throw new Error('Brak danych pytań.');
  }

  const activeBank = ACTIVE_BANK || 'swps50';
  const isSwps50 = activeBank === 'swps50';
  const isUwr = activeBank === 'uwr';

  const BANK_LABELS = {
    swps50: 'SWPS (50) · Licencjat',
    swps: 'SWPS (75) · Magisterskie',
    uwr: 'UWr (31) · Psychologia',
    custom: 'Własna baza',
  };

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

  const menuBtn = document.getElementById('menuBtn');
  const settingsMenu = document.getElementById('settingsMenu');
  const zenModeBtn = document.getElementById('zenModeBtn');
  const zenMenuBtn = document.getElementById('zenMenuBtn');

  const activeBankBadge = document.getElementById('activeBankBadge');
  const activeBankBadgeText = document.getElementById('activeBankBadgeText');
  const examStageIndicator = document.getElementById('examStageIndicator');
  const stageStep1 = document.getElementById('stageStep1');
  const stageStep2 = document.getElementById('stageStep2');
  const nextStageBtn = document.getElementById('nextStageBtn');
  const postNextStageBtn = document.getElementById('postNextStageBtn');
  const postActionsLabel = document.getElementById('postActionsLabel');

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

  const pauseBtn = document.getElementById('pauseBtn');
  const timerTrackFill = document.getElementById('timerTrackFill');
  const postActionsEl = document.getElementById('postActions');
  const postMasteredBtn = document.getElementById('postMasteredBtn');
  const postRetryBtn = document.getElementById('postRetryBtn');
  const postDrawBtn = document.getElementById('postDrawBtn');

  const timerChipBtn = document.getElementById('timerChipBtn');
  const timerChipValue = document.getElementById('timerChipValue');
  const timerPopover = document.getElementById('timerPopover');
  const timerPresetsEl = document.getElementById('timerPresets');
  const timerCustomApply = document.getElementById('timerCustomApply');
  const customTimerInput = document.getElementById('customTimerInput');

  const clearProgressBtn = document.getElementById('clearProgressBtn');
  const clearProgressDialog = document.getElementById('clearProgressDialog');
  const cancelClearProgressBtn = document.getElementById('cancelClearProgress');
  const confirmClearProgressBtn = document.getElementById('confirmClearProgress');

  const cardsRoot = document.getElementById('cardsRoot');

  // Exam stage for SWPS (50): 1 = problemowe, 2 = teoretyczne, 0 = idle/done
  let examStage = isSwps50 ? 1 : 0;
  let stage1Picked = false;
  let stage2Picked = false;
  let zenManager = null;

  function updateExamStageUI() {
    if (!isSwps50) {
      if (examStageIndicator) examStageIndicator.hidden = true;
      if (nextStageBtn) nextStageBtn.hidden = true;
      if (postNextStageBtn) postNextStageBtn.hidden = true;
      return;
    }
    if (examStageIndicator) {
      examStageIndicator.hidden = false;
    }
    if (stageStep1 && stageStep2) {
      if (examStage === 1) {
        stageStep1.classList.add('is-active');
        stageStep1.classList.toggle('is-done', stage1Picked);
        stageStep2.classList.remove('is-active', 'is-done');
      } else if (examStage === 2) {
        stageStep1.classList.remove('is-active');
        stageStep1.classList.add('is-done');
        stageStep2.classList.add('is-active');
        stageStep2.classList.toggle('is-done', stage2Picked);
      } else {
        stageStep1.classList.remove('is-active', 'is-done');
        stageStep2.classList.remove('is-active', 'is-done');
      }
    }
  }

  // Settings menu (⚙)
  function closeSettingsMenu() {
    if (settingsMenu && !settingsMenu.hidden) {
      settingsMenu.hidden = true;
      menuBtn?.setAttribute('aria-expanded', 'false');
    }
  }

  if (menuBtn && settingsMenu) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = settingsMenu.hidden;
      settingsMenu.hidden = !willOpen;
      menuBtn.setAttribute('aria-expanded', String(willOpen));
    });
    settingsMenu.addEventListener('click', (e) => {
      if (e.target instanceof Element && e.target.closest('button:not(.mode-select-item)')) {
        closeSettingsMenu();
      }
    });
  }

  if (activeBankBadge && settingsMenu) {
    activeBankBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = settingsMenu.hidden;
      settingsMenu.hidden = !willOpen;
      menuBtn?.setAttribute('aria-expanded', String(willOpen));
    });
  }

  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) {
      return;
    }
    if (settingsMenu && !settingsMenu.contains(e.target) && !menuBtn?.contains(e.target) && !activeBankBadge?.contains(e.target)) {
      closeSettingsMenu();
    }
    if (timerPopover && !timerPopover.contains(e.target) && !timerChipBtn?.contains(e.target)) {
      closeTimerPopover();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSettingsMenu();
      closeTimerPopover();
    }
  });

  let searchQuery = '';

  if (!drawBtn || !resetBtn || !helpBtn || !helpDialog || !closeHelpBtn) {
    throw new Error('Nie udało się zainicjalizować elementów interfejsu.');
  }

  // Set initial mode & labels
  if (cardsRoot) {
    cardsRoot.dataset.mode = isUwr ? 'single' : 'pair';
  }

  if (activeBankBadgeText) {
    activeBankBadgeText.textContent = BANK_LABELS[activeBank] || 'SWPS (50) · Licencjat';
  }

  function switchBank(bankKey) {
    if (bankKey === 'custom') {
      const customData = getCustomBank();
      if (!customData) {
        closeSettingsMenu();
        if (importDialog) {
          importDialog.showModal();
        }
        return;
      }
    }
    window.localStorage.setItem('active_bank', bankKey);
    window.location.reload();
  }

  const modeButtons = [
    { id: 'mode-swps50', key: 'swps50' },
    { id: 'mode-swps', key: 'swps' },
    { id: 'mode-uwr', key: 'uwr' },
    { id: 'mode-custom', key: 'custom' },
  ];

  modeButtons.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (el) {
      const isActive = activeBank === key;
      el.classList.toggle('is-active', isActive);
      el.setAttribute('aria-checked', String(isActive));
      el.addEventListener('click', () => {
        if (activeBank !== key) {
          switchBank(key);
        } else {
          closeSettingsMenu();
        }
      });
    }
  });

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
    storageKey: `filters_${activeBank}`,
  });

  // Study Plan
  setupStudyPlan({
    dateInputId: 'examDateInput',
    resultContainerId: 'studyPlanResult',
    totalQuestions: QUESTIONS.length,
    masteryManager: mastery,
  });

  function setPostActionsVisible(visible) {
    if (postActionsEl) {
      postActionsEl.hidden = !visible;
    }
  }

  function getSelectedQuestionIndex() {
    const selectedSlot = cardSlots.find(
      (s) => typeof s.questionIndex === 'number' && s.cardEl.classList.contains('selected'),
    );
    return selectedSlot ? selectedSlot.questionIndex : null;
  }

  function applyTimerState(remaining, phase, { duration } = {}) {
    if (!drawBtn) {
      return;
    }
    drawBtn.classList.toggle('timer-selection', phase === 'selection');
    drawBtn.classList.toggle('timer-answer', phase === 'answer' || phase === 'paused');
    const urgent = (phase === 'answer' || phase === 'paused') && typeof remaining === 'number' && remaining <= 10;
    drawBtn.classList.toggle('timer-urgent', urgent);

    if (timerTrackFill) {
      const total = typeof duration === 'number' && duration > 0 ? duration : null;
      if ((phase === 'answer' || phase === 'paused') && total && typeof remaining === 'number') {
        timerTrackFill.style.transform = `scaleX(${Math.max(0, Math.min(1, remaining / total))})`;
        timerTrackFill.classList.toggle('is-urgent', urgent);
      } else {
        timerTrackFill.style.transform = 'scaleX(0)';
        timerTrackFill.classList.remove('is-urgent');
      }
    }

    if (phase === 'answer' || phase === 'paused') {
      if (timerChipBtn) {
        timerChipBtn.hidden = true;
      }
      if (pauseBtn) {
        pauseBtn.hidden = false;
        pauseBtn.textContent = timer.isAnswerPaused() ? '▶ Wznów' : '⏸ Pauza';
      }
    } else if (timerChipBtn) {
      timerChipBtn.hidden = false;
      if (pauseBtn) {
        pauseBtn.hidden = true;
      }
    }

    zenManager?.updateTimer(remaining, phase, { duration });
  }

  function handleAnswerComplete() {
    playTimeUpChime();
    zenManager?.onAnswerComplete();
    if (timerTrackFill) {
      timerTrackFill.style.transform = 'scaleX(0)';
      timerTrackFill.classList.remove('is-urgent');
    }
    if (pauseBtn) {
      pauseBtn.hidden = true;
    }
    if (timerChipBtn) {
      timerChipBtn.hidden = false;
    }
    if (!prefersReducedMotion()) {
      const stageEl = document.querySelector('.stage');
      if (stageEl) {
        replayClass(stageEl, 'time-up-flash');
      }
    }
    const hasSelected = typeof getSelectedQuestionIndex() === 'number';
    setPostActionsVisible(hasSelected);

    if (isSwps50) {
      if (examStage === 1) {
        stage1Picked = true;
        updateExamStageUI();
        if (postNextStageBtn) postNextStageBtn.hidden = false;
        if (nextStageBtn) nextStageBtn.hidden = false;
        if (drawBtn) {
          drawBtn.disabled = false;
          drawBtn.textContent = '2. Ruch: Teoretyczne ➔';
        }
        if (postActionsLabel) postActionsLabel.textContent = '1. Ruch (problemowe) zakończony — przejdź do pytań teoretycznych:';
      } else if (examStage === 2) {
        stage2Picked = true;
        updateExamStageUI();
        if (postNextStageBtn) postNextStageBtn.hidden = true;
        if (nextStageBtn) nextStageBtn.hidden = true;
        if (drawBtn) {
          drawBtn.disabled = false;
          drawBtn.textContent = '🎲 Nowy egzamin';
        }
        if (postActionsLabel) postActionsLabel.textContent = 'Egzamin licencjacki ukończony! Jak poszło?';
      }
    }
  }

  const timer = createTimerManager({
    drawBtn,
    selectionDuration: isUwr ? 1 : 40,
    answerDuration: isUwr ? 180 : 120,
    onSelectionTimeout: handleSelectionTimeout,
    onAnswerComplete: handleAnswerComplete,
    onTick: applyTimerState,
  });

  if (isUwr) {
    timer.setDurations({ answerDuration: 180 });
  }

  const defaultAnswerDuration = isUwr ? 180 : 120;
  const TIMER_STORAGE_KEY = 'custom_timer_s';
  let currentAnswerDuration = defaultAnswerDuration;
  try {
    const savedTimerValue = Number.parseInt(window.localStorage.getItem(TIMER_STORAGE_KEY) || '', 10);
    if (Number.isInteger(savedTimerValue) && savedTimerValue > 0) {
      currentAnswerDuration = savedTimerValue;
      if (customTimerInput) {
        customTimerInput.value = String(savedTimerValue);
      }
    }
  } catch (_) {
    // no-op
  }

  function formatClock(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function syncTimerChip() {
    if (timerChipValue) {
      timerChipValue.textContent = formatClock(currentAnswerDuration);
    }
    if (timerPresetsEl) {
      timerPresetsEl.querySelectorAll('button[data-seconds]').forEach((btn) => {
        btn.classList.toggle('is-active', Number(btn.dataset.seconds) === currentAnswerDuration);
      });
    }
  }

  function setAnswerDuration(seconds) {
    if (!Number.isInteger(seconds) || seconds <= 0) {
      return false;
    }
    currentAnswerDuration = seconds;
    window.localStorage.setItem(TIMER_STORAGE_KEY, String(seconds));
    if (customTimerInput) {
      customTimerInput.value = String(seconds);
    }
    timer.setDurations({ answerDuration: seconds });
    syncTimerChip();
    return true;
  }

  function closeTimerPopover() {
    if (timerPopover && !timerPopover.hidden) {
      timerPopover.hidden = true;
      timerChipBtn?.setAttribute('aria-expanded', 'false');
    }
  }

  function applyCustomTimerValue() {
    if (!customTimerInput) {
      return;
    }
    const val = Number.parseInt(customTimerInput.value, 10);
    if (setAnswerDuration(val)) {
      closeTimerPopover();
    } else {
      customTimerInput.value = String(currentAnswerDuration);
    }
  }

  timer.setDurations({ answerDuration: currentAnswerDuration });
  syncTimerChip();

  if (timerChipBtn && timerPopover) {
    timerChipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = timerPopover.hidden;
      timerPopover.hidden = !willOpen;
      timerChipBtn.setAttribute('aria-expanded', String(willOpen));
    });
  }

  if (timerPresetsEl) {
    timerPresetsEl.addEventListener('click', (e) => {
      const btn = e.target instanceof Element ? e.target.closest('button[data-seconds]') : null;
      if (!btn) {
        return;
      }
      setAnswerDuration(Number.parseInt(btn.dataset.seconds, 10));
      closeTimerPopover();
    });
  }

  if (timerCustomApply) {
    timerCustomApply.addEventListener('click', applyCustomTimerValue);
  }
  if (customTimerInput) {
    customTimerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCustomTimerValue();
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
    renderQuestionList();
    updateDrawAvailability();
  });

  filterMenu.subscribe(() => {
    updateDrawAvailability();
    renderQuestionList();
  });

  function refreshAllMasteryStates() {
    cardSlots.forEach((slot) => {
      const wasMastered = slot.cardEl.classList.contains('mastered');
      refreshCardMasteryState(slot, (idx) => mastery.isMastered(idx));
      const nowMastered = slot.cardEl.classList.contains('mastered');
      if (!wasMastered && nowMastered) {
        celebrateMastery(slot.cardEl, true);
      }
    });
    updateTopbarInfo({
      totalCount: QUESTIONS.length,
      masteredCount: mastery.getAll().size,
      isUwr,
      bankLabel: BANK_LABELS[activeBank],
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
        mastery.toggleMastered(idx);
      },
      searchQuery,
    });
    refreshAllMasteryStates();
  }

  function updateDrawAvailability() {
    const poolCategory = isSwps50 ? (examStage === 2 ? 'theoretical' : 'problem') : null;
    const candidates = getCandidateIndices(QUESTIONS, filterMenu.getState(), (idx) => mastery.isMastered(idx), poolCategory);
    const hasCandidates = candidates.length > 0;
    if (drawBtn && !timer.isAnswerActive()) {
      drawBtn.disabled = !hasCandidates;
    }
    if (drawBtn) {
      drawBtn.classList.toggle('no-candidates', !hasCandidates);
    }
    if (!timer.isAnswerActive() && !timer.isSelectionActive()) {
      let label = timer.DRAW_LABEL;
      if (isSwps50) {
        if (examStage === 1) {
          label = stage1Picked ? '2. Ruch: Teoretyczne ➔' : '1. Ruch: Losuj problemowe';
        } else if (examStage === 2) {
          label = stage2Picked ? '🎲 Nowy egzamin' : '2. Ruch: Losuj teoretyczne';
        }
      }
      timer.setButtonLabel(hasCandidates ? label : 'Brak pytań');
    }
    return hasCandidates;
  }

  function handleAnswerStart(cardEl, { force = false } = {}) {
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
    applySelectionStyles(cardEls, cardEl);
    zenManager?.syncQuestion();
    if (!prefersReducedMotion()) {
      const { x, y } = elementCenter(cardEl);
      burstParticles(x, y, {
        count: 8,
        spread: 60,
        colors: accentBurstColors(cardEl),
      });
    }

    if (isSwps50) {
      if (examStage === 1) {
        stage1Picked = true;
        updateExamStageUI();
        if (nextStageBtn) {
          nextStageBtn.hidden = false;
          nextStageBtn.textContent = '2. Ruch: Teoretyczne ➔';
        }
      } else if (examStage === 2) {
        stage2Picked = true;
        updateExamStageUI();
        if (nextStageBtn) {
          nextStageBtn.hidden = true;
        }
      }
    }
  }

  function advanceToTheoreticalStage() {
    if (!isSwps50) {
      return;
    }
    examStage = 2;
    updateExamStageUI();
    setPostActionsVisible(false);
    if (nextStageBtn) {
      nextStageBtn.hidden = true;
    }
    if (postNextStageBtn) {
      postNextStageBtn.hidden = true;
    }
    timer.resetAll();

    const masteredSet = mastery.getAll();
    const filterState = filterMenu.getState();

    const [firstIndex, secondIndex] = selectQuestionPair(QUESTIONS, filterState, masteredSet, 'theoretical');
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
    zenManager?.syncQuestion();
  }

  if (nextStageBtn) {
    nextStageBtn.addEventListener('click', advanceToTheoreticalStage);
  }
  if (postNextStageBtn) {
    postNextStageBtn.addEventListener('click', advanceToTheoreticalStage);
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
      handleAnswerStart(choice.cardEl, { force: true });
    }
  }

  cardEls.forEach((cardEl) => {
    cardEl.addEventListener('click', () => {
      if (isUwr) {
        return;
      }
      handleAnswerStart(cardEl);
    });
    // Keyboard accessibility: Enter activates a focused card
    cardEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') {
        return;
      }
      e.preventDefault();
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
    setPostActionsVisible(false);
    if (nextStageBtn) {
      nextStageBtn.hidden = true;
    }
    if (postNextStageBtn) {
      postNextStageBtn.hidden = true;
    }

    if (isSwps50) {
      const q = QUESTIONS[index];
      const isTheo = q?.category === 'theoretical';
      examStage = isTheo ? 2 : 1;
      if (examStage === 1) {
        stage1Picked = true;
      } else {
        stage2Picked = true;
      }
      updateExamStageUI();
    }

    if (isUwr) {
      applyQuestionToSlot(cardSlots[0], index, QUESTIONS, (idx) => mastery.isMastered(idx));
      animateCard(cardSlots[0]);
      if (cardSlots[1]) {
        applyQuestionToSlot(cardSlots[1], null, QUESTIONS, (idx) => mastery.isMastered(idx));
      }
      if (startTimer) {
        timer.startAnswer();
        applySelectionStyles(cardEls, cardSlots[0].cardEl);
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
    zenManager?.syncQuestion();
  }

  function draw() {
    if (timer.isAnswerActive()) {
      return;
    }
    setPostActionsVisible(false);

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
      zenManager?.syncQuestion();
      return;
    }

    if (isSwps50) {
      if (examStage === 1 && stage1Picked) {
        advanceToTheoreticalStage();
        return;
      }
      if (examStage === 2 && stage2Picked) {
        stage1Picked = false;
        stage2Picked = false;
        examStage = 1;
      }

      const categoryToDraw = examStage === 2 ? 'theoretical' : 'problem';
      updateExamStageUI();
      if (nextStageBtn) {
        nextStageBtn.hidden = true;
      }
      if (postNextStageBtn) {
        postNextStageBtn.hidden = true;
      }

      const [firstIndex, secondIndex] = selectQuestionPair(QUESTIONS, filterState, masteredSet, categoryToDraw);
      if (firstIndex === null && secondIndex === null) {
        updateDrawAvailability();
        renderQuestionList();
        zenManager?.syncQuestion();
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
      zenManager?.syncQuestion();
      return;
    }

    const [firstIndex, secondIndex] = selectQuestionPair(QUESTIONS, filterState, masteredSet);
    if (firstIndex === null && secondIndex === null) {
      updateDrawAvailability();
      renderQuestionList();
      zenManager?.syncQuestion();
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
    zenManager?.syncQuestion();
  }

  function reset() {
    examStage = isSwps50 ? 1 : 0;
    stage1Picked = false;
    stage2Picked = false;
    updateExamStageUI();
    if (nextStageBtn) {
      nextStageBtn.hidden = true;
    }
    if (postNextStageBtn) {
      postNextStageBtn.hidden = true;
    }
    cardSlots.forEach((slot) => applyQuestionToSlot(slot, null, QUESTIONS, (idx) => mastery.isMastered(idx)));
    timer.resetAll();
    clearSelectionStyles(cardEls);
    setCardsIdle(cardEls, true);
    setPostActionsVisible(false);
    updateDrawAvailability();
    renderQuestionList();
    zenManager?.syncQuestion();
  }

  // Pause / resume of the answer countdown
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => timer.togglePause());
  }

  // Post-answer quick actions
  if (postMasteredBtn) {
    postMasteredBtn.addEventListener('click', () => {
      const idx = getSelectedQuestionIndex();
      if (typeof idx === 'number') {
        mastery.setMastered(idx, true);
      }
      setPostActionsVisible(false);
    });
  }

  if (postRetryBtn) {
    postRetryBtn.addEventListener('click', () => {
      setPostActionsVisible(false);
      timer.startAnswer();
    });
  }

  if (postDrawBtn) {
    postDrawBtn.addEventListener('click', () => {
      setPostActionsVisible(false);
      draw();
    });
  }

  // Clear-progress confirmation dialog
  if (clearProgressBtn && clearProgressDialog) {
    clearProgressBtn.addEventListener('click', () => clearProgressDialog.showModal());
  }
  if (cancelClearProgressBtn && clearProgressDialog) {
    cancelClearProgressBtn.addEventListener('click', () => clearProgressDialog.close());
  }
  if (confirmClearProgressBtn && clearProgressDialog) {
    confirmClearProgressBtn.addEventListener('click', () => {
      mastery.clearAll();
      clearProgressDialog.close();
    });
  }

  drawBtn.addEventListener('click', (event) => {
    if (drawBtn.disabled) {
      return;
    }
    addRipple(drawBtn, event);
    draw();
  });

  resetBtn.addEventListener('click', reset);

  zenManager = createZenManager({
    onDraw: draw,
    onSelectSlot: (slotIndex) => {
      if (cardSlots[slotIndex]?.cardEl) {
        handleAnswerStart(cardSlots[slotIndex].cardEl, { force: true });
      }
    },
    onTogglePause: () => timer.togglePause(),
    isTimerAnswerActive: () => timer.isAnswerActive(),
    isTimerAnswerPaused: () => timer.isAnswerPaused(),
    getAnswerRemaining: () => timer.getAnswerRemaining(),
    getCurrentDuration: () => currentAnswerDuration,
    getSelectedQuestionIndex: () => getSelectedQuestionIndex(),
    getCardSlots: () => cardSlots,
    getQuestions: () => QUESTIONS,
  });

  if (zenModeBtn) {
    zenModeBtn.addEventListener('click', () => zenManager.toggle());
  }
  if (zenMenuBtn) {
    zenMenuBtn.addEventListener('click', () => {
      closeSettingsMenu();
      zenManager.open();
    });
  }

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
    onTogglePause: () => timer.togglePause(),
    onToggleZen: () => zenManager?.toggle(),
    isZenActive: () => Boolean(zenManager?.isActive()),
    isTimerAnswerActive: () => timer.isAnswerActive(),
    isDrawDisabled: () => drawBtn.disabled,
  });

  reset();
})();
