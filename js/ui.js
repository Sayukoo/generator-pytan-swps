(function (global) {
  'use strict';

  function normalizeHex(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    return hex;
  }

  function hexToRgb(hex) {
    const normalized = normalizeHex(hex);
    const bigint = parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  }

  function getTagVariants(tag) {
    const hex = window.TAG_COLOR_MAP[tag] || '#9ca3af';
    const rgb = hexToRgb(hex);
    return {
      hex,
      rgb,
      soft: `rgba(${rgb}, 0.12)`,
      strong: hex,
    };
  }

  function clearSelectionStyles() {
    const cardSlots = window.UI_STATE.cardSlots;
    cardSlots.forEach((slot) => {
      if (slot) {
        slot.cardEl.classList.remove('selected', 'not-selected', 'auto-picked');
      }
    });
  }

  function setCardsIdle(isIdle) {
    const cardSlots = window.UI_STATE.cardSlots;
    cardSlots.forEach((slot) => {
      if (slot) {
        slot.cardEl.classList.toggle('idle', isIdle);
      }
    });
  }

  function applySelectionStyles(cardEl, { autoPicked = false } = {}) {
    const cardSlots = window.UI_STATE.cardSlots;
    cardSlots.forEach((slot) => {
      if (slot) {
        if (slot.cardEl === cardEl) {
          slot.cardEl.classList.add('selected');
          if (autoPicked) {
            slot.cardEl.classList.add('auto-picked');
          }
        } else {
          slot.cardEl.classList.add('not-selected');
        }
      }
    });
  }

  function animateCard(slot) {
    if (!slot) return;
    slot.cardEl.classList.remove('animate-in');
    void slot.cardEl.offsetWidth;
    slot.cardEl.classList.add('animate-in');
  }

  function applyQuestionToSlot(slot, questionIndex) {
    if (!slot) return;
    slot.questionIndex = questionIndex;

    const { cardEl, metaEl, textEl, numEl } = slot;

    if (questionIndex === null) {
      cardEl.style.removeProperty('--tag-color');
      cardEl.style.removeProperty('--tag-color-strong');
      if (metaEl) metaEl.innerHTML = '';
      if (textEl) textEl.textContent = '';
      if (numEl) numEl.textContent = '?';
      return;
    }

    const q = window.QUESTIONS[questionIndex];
    if (!q) return;

    const primaryTag = Array.isArray(q.tags) && q.tags[0] ? q.tags[0] : '';
    if (primaryTag) {
      const variants = getTagVariants(primaryTag);
      cardEl.style.setProperty('--tag-color-strong', variants.strong);
      cardEl.style.setProperty('--tag-color', variants.soft);
    } else {
      cardEl.style.removeProperty('--tag-color');
      cardEl.style.removeProperty('--tag-color-strong');
    }

    const numStr = String(questionIndex + 1).padStart(2, '0');
    if (numEl) numEl.textContent = numStr;
    if (textEl) textEl.textContent = q.text;

    if (metaEl) {
      metaEl.innerHTML = '';
      if (Array.isArray(q.tags)) {
        q.tags.forEach((tag) => {
          const span = document.createElement('span');
          span.className = 'tag';
          span.textContent = tag;
          const variants = getTagVariants(tag);
          span.style.setProperty('--tag-color-strong', variants.strong);
          span.style.setProperty('--tag-color-soft', variants.soft);
          metaEl.appendChild(span);
        });
      }
    }

    if (typeof window.refreshCardMasteryState === 'function') {
      window.refreshCardMasteryState(slot);
    }
  }

  function showQuestionOnStage(index, { startTimer = false } = {}) {
    const cardSlots = window.UI_STATE.cardSlots;
    applyQuestionToSlot(cardSlots[0], index);
    applyQuestionToSlot(cardSlots[1], null);

    if (cardSlots[1]) {
      cardSlots[1].cardEl.classList.add('idle');
    }

    setCardsIdle(false);
    clearSelectionStyles();
    animateCard(cardSlots[0]);
    applySelectionStyles(cardSlots[0].cardEl, { autoPicked: true });

    if (startTimer && window.timer) {
      window.timer.startAnswer();
    } else if (window.timer) {
      window.timer.resetAll();
    }
  }

  function updateDrawAvailability() {
    const drawBtn = document.getElementById('drawBtn');
    if (!drawBtn || !window.timer) return;
    drawBtn.disabled = window.timer.isAnswerActive();
  }

  function addRipple(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }

  global.UI = {
    normalizeHex,
    hexToRgb,
    getTagVariants,
    clearSelectionStyles,
    setCardsIdle,
    applySelectionStyles,
    animateCard,
    applyQuestionToSlot,
    showQuestionOnStage,
    updateDrawAvailability,
    addRipple
  };
})(window);
