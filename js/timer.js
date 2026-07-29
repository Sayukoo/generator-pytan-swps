(function (global) {
  'use strict';

  const DRAW_LABEL = 'Losuj';

  /**
   * Formats total seconds into a MM:SS string representation.
   * @param {number} totalSeconds - The total seconds to format.
   * @returns {string} The formatted time string.
   */
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  /**
   * Creates a timer manager instance for handling selection and answer phases.
   * @param {Object} options - Configuration options.
   * @param {HTMLElement} options.drawBtn - The draw button element to update.
   * @param {number} [options.selectionDuration=40] - Duration in seconds for the selection phase.
   * @param {number} [options.answerDuration=120] - Duration in seconds for the answer phase.
   * @param {Function} [options.onSelectionTimeout] - Callback executed when selection times out.
   * @param {Function} [options.onAnswerComplete] - Callback executed when answer times out.
   * @returns {Object} The timer manager interface.
   */
  function createTimerManager({
    drawBtn,
    selectionDuration = 40,
    answerDuration = 120,
    onSelectionTimeout = () => {},
    onAnswerComplete = () => {},
  }) {
    let selectionTimerId = null;
    let answerTimerId = null;
    let delayedLabelTimeout = null;
    let isSelectionActive = false;
    let isAnswerActive = false;
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

    function showTimerLabel(seconds) {
      setButtonLabel(formatTime(seconds));
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

    function cancelAnswer({ resetLabel = true } = {}) {
      if (answerTimerId) {
        clearInterval(answerTimerId);
        answerTimerId = null;
      }
      isAnswerActive = false;
      if (drawBtn) {
        drawBtn.disabled = false;
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
      showTimerLabel(remaining);

      selectionTimerId = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          showTimerLabel(0);
          cancelSelection({ resetLabel: false });
          scheduleLabelReset();
          onSelectionTimeout();
          return;
        }
        showTimerLabel(remaining);
      }, 1000);
    }

    function startAnswer() {
      if (!drawBtn) {
        return false;
      }
      if (isAnswerActive) {
        return false;
      }
      cancelSelection({ resetLabel: false });
      isSelectionActive = false;
      clearDelayedLabel();
      isAnswerActive = true;
      drawBtn.disabled = true;

      let remaining = config.answerDuration;
      showTimerLabel(remaining);

      answerTimerId = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          showTimerLabel(0);
          cancelAnswer({ resetLabel: false });
          scheduleLabelReset();
          onAnswerComplete();
          return;
        }
        showTimerLabel(remaining);
      }, 1000);

      return true;
    }

    function resetAll() {
      cancelSelection({ resetLabel: false });
      cancelAnswer({ resetLabel: false });
      clearDelayedLabel();
      isSelectionActive = false;
      isAnswerActive = false;
      if (drawBtn) {
        drawBtn.disabled = false;
      }
      setButtonLabel(DRAW_LABEL);
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
      resetAll,
      prepareForDraw,
      cancelSelection,
      cancelAnswer,
      isSelectionActive: () => isSelectionActive,
      isAnswerActive: () => isAnswerActive,
      setButtonLabel,
      setDurations,
      DRAW_LABEL,
    };
  }

  global.createTimerManager = createTimerManager;
})(window);
