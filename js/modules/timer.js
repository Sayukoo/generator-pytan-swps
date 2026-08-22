/**
 * Timer Manager Module
 * Handles selection phase and answer phase timers,
 * including pause/resume of the answer countdown.
 */

export const DRAW_LABEL = 'Losuj';

export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function createTimerManager({
  drawBtn,
  selectionDuration = 40,
  answerDuration = 120,
  onSelectionTimeout = () => {},
  onAnswerComplete = () => {},
  onTick = () => {},
}) {
  let selectionTimerId = null;
  let answerTimerId = null;
  let delayedLabelTimeout = null;
  let isSelectionActive = false;
  let isAnswerActive = false;
  let isAnswerPaused = false;
  let answerRemaining = 0;
  let config = {
    selectionDuration,
    answerDuration,
  };

  function clearDelayedLabel() {
    if (delayedLabelTimeout) {
      clearTimeout(delayedLabelTimeout);
      delayedLabelTimeout = null;
    }
  }

  function setButtonLabel(label) {
    if (drawBtn) {
      drawBtn.textContent = label;
    }
  }

  function showTimerLabel(seconds, phase) {
    setButtonLabel(formatTime(seconds));
    onTick(seconds, phase, { duration: config.answerDuration });
  }

  function scheduleLabelReset() {
    clearDelayedLabel();
    delayedLabelTimeout = setTimeout(() => {
      delayedLabelTimeout = null;
      if (!isSelectionActive && !isAnswerActive) {
        setButtonLabel(DRAW_LABEL);
      }
    }, 1000);
  }

  function cancelSelection({ resetLabel = true } = {}) {
    if (selectionTimerId) {
      clearInterval(selectionTimerId);
      selectionTimerId = null;
    }
    isSelectionActive = false;
    if (resetLabel && !isAnswerActive) {
      clearDelayedLabel();
      setButtonLabel(DRAW_LABEL);
    }
  }

  function stopAnswerInterval() {
    if (answerTimerId) {
      clearInterval(answerTimerId);
      answerTimerId = null;
    }
  }

  function cancelAnswer({ resetLabel = true } = {}) {
    stopAnswerInterval();
    isAnswerActive = false;
    isAnswerPaused = false;
    if (drawBtn) {
      drawBtn.disabled = false;
      drawBtn.classList.remove('timer-paused');
    }
    if (resetLabel) {
      clearDelayedLabel();
      setButtonLabel(DRAW_LABEL);
    }
  }

  function prepareForDraw() {
    cancelAnswer({ resetLabel: false });
    cancelSelection({ resetLabel: false });
    clearDelayedLabel();
    isSelectionActive = false;
    isAnswerActive = false;
    if (drawBtn) {
      drawBtn.disabled = false;
    }
  }

  function startSelection() {
    if (!drawBtn) {
      return;
    }
    prepareForDraw();
    isSelectionActive = true;

    let remaining = config.selectionDuration;
    showTimerLabel(remaining, 'selection');

    selectionTimerId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        showTimerLabel(0, 'selection');
        cancelSelection({ resetLabel: false });
        scheduleLabelReset();
        onSelectionTimeout();
        return;
      }
      showTimerLabel(remaining, 'selection');
    }, 1000);
  }

  function startAnswer() {
    if (!drawBtn) {
      return false;
    }
    if (isAnswerActive && isAnswerPaused) {
      return resumeAnswer();
    }
    if (isAnswerActive) {
      return false;
    }
    cancelSelection({ resetLabel: false });
    isSelectionActive = false;
    clearDelayedLabel();
    isAnswerActive = true;
    isAnswerPaused = false;
    drawBtn.disabled = true;

    answerRemaining = config.answerDuration;
    showTimerLabel(answerRemaining, 'answer');

    answerTimerId = setInterval(() => {
      answerRemaining -= 1;
      if (answerRemaining <= 0) {
        showTimerLabel(0, 'answer');
        cancelAnswer({ resetLabel: false });
        scheduleLabelReset();
        onAnswerComplete();
        return;
      }
      showTimerLabel(answerRemaining, 'answer');
    }, 1000);

    return true;
  }

  function pauseAnswer() {
    if (!isAnswerActive || isAnswerPaused) {
      return false;
    }
    stopAnswerInterval();
    isAnswerPaused = true;
    if (drawBtn) {
      drawBtn.classList.add('timer-paused');
      drawBtn.textContent = `${formatTime(answerRemaining)} ⏸`;
    }
    onTick(answerRemaining, 'paused', { duration: config.answerDuration });
    return true;
  }

  function resumeAnswer() {
    if (!isAnswerActive || !isAnswerPaused) {
      return false;
    }
    isAnswerPaused = false;
    if (drawBtn) {
      drawBtn.classList.remove('timer-paused');
    }
    showTimerLabel(answerRemaining, 'answer');

    answerTimerId = setInterval(() => {
      answerRemaining -= 1;
      if (answerRemaining <= 0) {
        showTimerLabel(0, 'answer');
        cancelAnswer({ resetLabel: false });
        scheduleLabelReset();
        onAnswerComplete();
        return;
      }
      showTimerLabel(answerRemaining, 'answer');
    }, 1000);
    return true;
  }

  function togglePause() {
    if (isAnswerPaused) {
      return resumeAnswer();
    }
    return pauseAnswer();
  }

  function resetAll() {
    cancelSelection({ resetLabel: false });
    cancelAnswer({ resetLabel: false });
    clearDelayedLabel();
    isSelectionActive = false;
    isAnswerActive = false;
    isAnswerPaused = false;
    answerRemaining = 0;
    if (drawBtn) {
      drawBtn.disabled = false;
    }
    setButtonLabel(DRAW_LABEL);
    onTick(null, 'idle', { duration: config.answerDuration });
  }

  function setDurations({ selectionDuration: sel, answerDuration: ans } = {}) {
    if (typeof sel === 'number' && sel > 0) {
      config.selectionDuration = sel;
    }
    if (typeof ans === 'number' && ans > 0) {
      config.answerDuration = ans;
    }
  }

  return {
    startSelection,
    startAnswer,
    pauseAnswer,
    resumeAnswer,
    togglePause,
    resetAll,
    prepareForDraw,
    cancelSelection,
    cancelAnswer,
    isSelectionActive: () => isSelectionActive,
    isAnswerActive: () => isAnswerActive,
    isAnswerPaused: () => isAnswerPaused,
    getAnswerRemaining: () => answerRemaining,
    setButtonLabel,
    setDurations,
    DRAW_LABEL,
  };
}
