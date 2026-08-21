/**
 * Cards Module
 * Handles card slots DOM representation, rendering tags, animations,
 * pointer-driven 3D tilt and selection styles.
 */

import { getTagVariants } from './tags.js';
import {
  attachPointerTilt,
  replayClass,
  setStaggerIndex,
} from './motion.js';

export function createCardSlots(onMasteryToggle) {
  const cardElements = Array.from(document.querySelectorAll('.card'));
  const slots = cardElements.map((cardEl) => {
    const slot = {
      cardEl,
      numEl: cardEl.querySelector('.num'),
      questionEl: cardEl.querySelector('.question'),
      tagsEl: cardEl.querySelector('.card-tags'),
      masteryBtn: cardEl.querySelector('.card-mastery'),
      questionIndex: null,
    };
    attachPointerTilt(cardEl);
    if (slot.masteryBtn && typeof onMasteryToggle === 'function') {
      slot.masteryBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (typeof slot.questionIndex === 'number') {
          onMasteryToggle(slot.questionIndex);
        }
      });
    }
    return slot;
  });
  return slots;
}

export function clearSelectionStyles(cardEls) {
  cardEls.forEach((card) => {
    card.classList.remove('selected', 'dimmed', 'auto-picked');
  });
}

export function setCardsIdle(cardEls, isIdle) {
  cardEls.forEach((card) => {
    if (!card.hidden) {
      card.classList.toggle('idle', isIdle);
    }
  });
}

export function applySelectionStyles(cardEls, selectedCardEl, { autoPicked = false } = {}) {
  cardEls.forEach((card) => {
    if (card.hidden) {
      return;
    }
    if (card === selectedCardEl) {
      card.classList.add('selected');
      card.classList.toggle('auto-picked', autoPicked);
      card.classList.remove('dimmed');
      if (autoPicked) {
        replayClass(card, 'auto-flash');
      }
    } else {
      card.classList.remove('selected', 'auto-picked');
      card.classList.add('dimmed');
    }
  });
}

export function refreshCardMasteryState(slot, isMasteredFn) {
  if (!slot?.cardEl) {
    return;
  }
  const hasQuestion = typeof slot.questionIndex === 'number';
  const isMastered = hasQuestion && (typeof isMasteredFn === 'function' ? isMasteredFn(slot.questionIndex) : false);
  slot.cardEl.classList.toggle('has-question', hasQuestion);
  slot.cardEl.classList.toggle('mastered', Boolean(isMastered));
  if (slot.masteryBtn) {
    slot.masteryBtn.hidden = !hasQuestion;
    slot.masteryBtn.textContent = isMastered ? 'Przywróć' : 'Opanowane';
    slot.masteryBtn.setAttribute('aria-pressed', String(Boolean(isMastered)));
  }
}

export function renderTags(tagsEl, tags) {
  if (!tagsEl) {
    return;
  }
  tagsEl.innerHTML = '';
  if (!Array.isArray(tags) || tags.length === 0) {
    tagsEl.classList.remove('has-tags');
    return;
  }
  tagsEl.classList.add('has-tags');
  let stagger = 0;
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
    setStaggerIndex(pill, stagger);
    stagger += 1;
    tagsEl.appendChild(pill);
  });
}

export function animateCard(slot) {
  if (!slot?.cardEl || slot.cardEl.hidden) {
    return;
  }
  replayClass(slot.cardEl, 'pop');
  replayClass(slot.cardEl, 'glow');
  if (slot.numEl) {
    replayClass(slot.numEl, 'flip');
  }
  if (slot.questionEl) {
    replayClass(slot.questionEl, 'question-reveal');
  }
  if (slot.tagsEl) {
    Array.from(slot.tagsEl.children).forEach((pill) => {
      replayClass(pill, 'pill-in');
    });
  }
}

export function applyQuestionToSlot(slot, questionIndex, questions, isMasteredFn) {
  if (!slot) {
    return;
  }
  const hasQuestion = typeof questionIndex === 'number'
    && Number.isInteger(questionIndex)
    && questionIndex >= 0
    && questionIndex < (questions?.length || 0);

  slot.questionIndex = hasQuestion ? questionIndex : null;
  const entry = hasQuestion ? questions[questionIndex] : null;
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
  refreshCardMasteryState(slot, isMasteredFn);
}
