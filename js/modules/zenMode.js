/**
 * Zen Mode Module
 * Provides an ultra-minimalist, distraction-free view containing only
 * the current question and the countdown timer.
 */

function formatClock(totalSeconds) {
  if (typeof totalSeconds !== 'number' || Number.isNaN(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function createZenManager({
  onDraw,
  onSelectSlot,
  onTogglePause,
  isTimerAnswerActive,
  isTimerAnswerPaused,
  getAnswerRemaining,
  getCurrentDuration,
  getSelectedQuestionIndex,
  getCardSlots,
  getQuestions,
}) {
  const overlay = document.getElementById('zenOverlay');
  const exitBtn = document.getElementById('zenExitBtn');
  const timerClock = document.getElementById('zenTimerClock');
  const timerBar = document.getElementById('zenTimerBar');
  const timerStatus = document.getElementById('zenTimerStatus');
  const questionSection = document.getElementById('zenQuestionSection');
  const questionNum = document.getElementById('zenQuestionNumber');
  const questionText = document.getElementById('zenQuestionText');
  const pickSection = document.getElementById('zenPickSection');
  const pickGrid = document.getElementById('zenPickGrid');
  const emptySection = document.getElementById('zenEmptySection');
  const drawBtn = document.getElementById('zenDrawBtn');
  const pauseBtn = document.getElementById('zenPauseBtn');
  const nextBtn = document.getElementById('zenNextBtn');

  let isOpen = false;

  function updateTimer(remaining, phase, { duration } = {}) {
    if (!timerClock) {
      return;
    }
    const totalDuration = duration || (typeof getCurrentDuration === 'function' ? getCurrentDuration() : 120);

    if (phase === 'selection') {
      timerClock.textContent = formatClock(remaining);
      timerClock.classList.remove('is-urgent', 'is-paused');
      if (timerStatus) timerStatus.textContent = 'Wybierz pytanie';
      if (timerBar) {
        timerBar.style.transform = 'scaleX(0)';
        timerBar.classList.remove('is-urgent');
      }
      if (pauseBtn) pauseBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
    } else if (phase === 'answer' || phase === 'paused') {
      timerClock.textContent = formatClock(remaining);
      const isUrgent = typeof remaining === 'number' && remaining <= 10;
      const isPaused = phase === 'paused';

      timerClock.classList.toggle('is-urgent', isUrgent);
      timerClock.classList.toggle('is-paused', isPaused);

      if (timerBar) {
        const scale = totalDuration > 0 && typeof remaining === 'number'
          ? Math.max(0, Math.min(1, remaining / totalDuration))
          : 0;
        timerBar.style.transform = `scaleX(${scale})`;
        timerBar.classList.toggle('is-urgent', isUrgent);
      }

      if (timerStatus) {
        timerStatus.textContent = isPaused ? '⏸ Wstrzymany' : '';
      }

      if (pauseBtn) {
        pauseBtn.hidden = false;
        pauseBtn.textContent = isPaused ? '▶ Wznów' : '⏸ Pauza';
      }
      if (nextBtn) {
        nextBtn.hidden = true;
      }
    } else {
      // Idle / initial
      const displayDuration = typeof getCurrentDuration === 'function' ? getCurrentDuration() : 120;
      timerClock.textContent = formatClock(displayDuration);
      timerClock.classList.remove('is-urgent', 'is-paused');
      if (timerBar) {
        timerBar.style.transform = 'scaleX(0)';
        timerBar.classList.remove('is-urgent');
      }
      if (timerStatus) {
        timerStatus.textContent = '';
      }
      if (pauseBtn) {
        pauseBtn.hidden = true;
      }
    }
  }

  function syncQuestion() {
    const questions = typeof getQuestions === 'function' ? getQuestions() : [];
    const selectedIdx = typeof getSelectedQuestionIndex === 'function' ? getSelectedQuestionIndex() : null;

    if (typeof selectedIdx === 'number' && questions[selectedIdx]) {
      const q = questions[selectedIdx];
      if (questionSection) questionSection.hidden = false;
      if (questionNum) questionNum.textContent = `Pytanie #${selectedIdx + 1}`;
      if (questionText) questionText.textContent = q.text || '';
      if (pickSection) pickSection.hidden = true;
      if (emptySection) emptySection.hidden = true;
      return;
    }

    const slots = typeof getCardSlots === 'function' ? getCardSlots() : [];
    const activeSlots = slots.filter((s) => !s.cardEl?.hidden && typeof s.questionIndex === 'number');

    if (activeSlots.length === 1) {
      const idx = activeSlots[0].questionIndex;
      const q = questions[idx];
      if (questionSection) questionSection.hidden = false;
      if (questionNum) questionNum.textContent = `Pytanie #${idx + 1}`;
      if (questionText) questionText.textContent = q?.text || '';
      if (pickSection) pickSection.hidden = true;
      if (emptySection) emptySection.hidden = true;
      return;
    }

    if (activeSlots.length > 1) {
      if (questionSection) questionSection.hidden = true;
      if (emptySection) emptySection.hidden = true;
      if (pickSection && pickGrid) {
        pickSection.hidden = false;
        pickGrid.innerHTML = '';
        activeSlots.forEach((slot, slotIndex) => {
          const idx = slot.questionIndex;
          const q = questions[idx];
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'zen-pick-card';
          btn.innerHTML = `
            <span class="zen-pick-num">#${idx + 1}</span>
            <span class="zen-pick-text">${q?.text || ''}</span>
          `;
          btn.addEventListener('click', () => {
            if (typeof onSelectSlot === 'function') {
              onSelectSlot(slotIndex);
            }
            syncQuestion();
          });
          pickGrid.appendChild(btn);
        });
      }
      return;
    }

    // No questions loaded
    if (questionSection) questionSection.hidden = true;
    if (pickSection) pickSection.hidden = true;
    if (emptySection) emptySection.hidden = false;
  }

  function syncTimer() {
    const isRunning = typeof isTimerAnswerActive === 'function' && isTimerAnswerActive();
    const isPaused = typeof isTimerAnswerPaused === 'function' && isTimerAnswerPaused();
    const remaining = typeof getAnswerRemaining === 'function' ? getAnswerRemaining() : 0;
    const duration = typeof getCurrentDuration === 'function' ? getCurrentDuration() : 120;

    if (isRunning) {
      updateTimer(remaining, isPaused ? 'paused' : 'answer', { duration });
    } else {
      updateTimer(duration, 'idle', { duration });
    }
  }

  function open() {
    if (!overlay) {
      return;
    }
    isOpen = true;
    overlay.hidden = false;
    document.body.classList.add('in-zen-mode');
    syncQuestion();
    syncTimer();
  }

  function close() {
    if (!overlay) {
      return;
    }
    isOpen = false;
    overlay.hidden = true;
    document.body.classList.remove('in-zen-mode');
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function onAnswerComplete() {
    if (timerClock) {
      timerClock.textContent = '0:00';
      timerClock.classList.remove('is-urgent', 'is-paused');
    }
    if (timerBar) {
      timerBar.style.transform = 'scaleX(0)';
      timerBar.classList.remove('is-urgent');
    }
    if (timerStatus) {
      timerStatus.textContent = 'Czas minął!';
    }
    if (pauseBtn) {
      pauseBtn.hidden = true;
    }
    if (nextBtn) {
      nextBtn.hidden = false;
    }
  }

  // Bind internal event listeners
  if (exitBtn) {
    exitBtn.addEventListener('click', close);
  }

  if (pauseBtn && typeof onTogglePause === 'function') {
    pauseBtn.addEventListener('click', () => {
      onTogglePause();
    });
  }

  if (drawBtn && typeof onDraw === 'function') {
    drawBtn.addEventListener('click', () => {
      onDraw();
      syncQuestion();
      syncTimer();
    });
  }

  if (nextBtn && typeof onDraw === 'function') {
    nextBtn.addEventListener('click', () => {
      nextBtn.hidden = true;
      onDraw();
      syncQuestion();
      syncTimer();
    });
  }

  return {
    open,
    close,
    toggle,
    isActive: () => isOpen,
    syncQuestion,
    syncTimer,
    updateTimer,
    onAnswerComplete,
  };
}
