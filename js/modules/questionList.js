/**
 * Question List Module
 * Renders the sidebar list of questions, live search, hover tooltips,
 * staggered entrance animations and context menu actions.
 */

import { getTagVariants } from './tags.js';
import { prefersReducedMotion, setStaggerIndex } from './motion.js';

export function renderQuestionList({
  containerEl,
  questions,
  filterState,
  isMasteredFn,
  activeQuestionIndices = [],
  onSelectQuestion,
  onToggleMastered,
  searchQuery = '',
}) {
  if (!containerEl) {
    return;
  }

  const hideMastered = Boolean(filterState?.hideMastered);
  const tagFilter = filterState?.selectedTags instanceof Set ? filterState.selectedTags : new Set();
  const hasTagFilter = tagFilter.size > 0;
  const currentSet = new Set(activeQuestionIndices.filter((idx) => typeof idx === 'number'));
  const normalizedQuery = searchQuery.trim().toLowerCase();

  containerEl.innerHTML = '';
  let visibleCount = 0;

  questions.forEach((entry, idx) => {
    const mastered = typeof isMasteredFn === 'function' ? isMasteredFn(idx) : false;
    if (hideMastered && mastered) {
      return;
    }
    if (hasTagFilter) {
      const tags = Array.isArray(entry.tags) ? entry.tags : [];
      if (!tags.some((tag) => tagFilter.has(tag))) {
        return;
      }
    }

    if (normalizedQuery) {
      const numMatch = String(idx + 1).includes(normalizedQuery);
      const textMatch = entry.text.toLowerCase().includes(normalizedQuery);
      const tagMatch = entry.tags?.some((t) => t.toLowerCase().includes(normalizedQuery));
      if (!numMatch && !textMatch && !tagMatch) {
        return;
      }
    }

    visibleCount += 1;
    const item = document.createElement('li');
    item.className = 'question-item';
    item.dataset.index = String(idx);
    if (mastered) {
      item.classList.add('is-mastered');
    }
    if (currentSet.has(idx)) {
      item.classList.add('is-current');
    }
    if (!prefersReducedMotion()) {
      // Cap the stagger so long lists do not feel sluggish.
      setStaggerIndex(item, Math.min(visibleCount - 1, 30));
    }

    const numText = document.createElement('span');
    numText.className = 'question-item__num';
    numText.textContent = String(idx + 1).padStart(2, '0');

    item.dataset.text = entry.text;

    item.addEventListener('mouseenter', () => {
      let tooltip = document.getElementById('global-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'global-tooltip';
        tooltip.className = 'question-item__text global-tooltip';
        document.body.appendChild(tooltip);
      }
      tooltip.textContent = item.dataset.text;

      const rect = item.getBoundingClientRect();
      tooltip.style.top = `${rect.top + rect.height / 2}px`;
      tooltip.style.left = `${rect.left - 12}px`;
      tooltip.style.transform = `translate(-100%, -50%) scale(1)`;
      tooltip.classList.add('visible');
    });

    item.addEventListener('mouseleave', () => {
      const tooltip = document.getElementById('global-tooltip');
      if (tooltip) {
        tooltip.style.transform = `translate(-100%, -50%) scale(0.95)`;
        tooltip.classList.remove('visible');
      }
    });

    item.title = 'Pokaż na ekranie i zacznij odpowiadać (PPM = oznacz opanowanie)';
    item.addEventListener('click', () => {
      if (typeof onSelectQuestion === 'function') {
        onSelectQuestion(idx);
      }
      const tooltip = document.getElementById('global-tooltip');
      if (tooltip) {
        tooltip.classList.remove('visible');
      }
    });

    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (typeof onToggleMastered === 'function') {
        onToggleMastered(idx);
      }
    });

    const primaryTag = Array.isArray(entry.tags) && entry.tags[0] ? entry.tags[0] : '';
    if (primaryTag) {
      const variants = getTagVariants(primaryTag);
      item.style.setProperty('--tag-color-strong', variants.strong);
      item.style.setProperty('--tag-color', variants.soft);
    }

    item.appendChild(numText);
    containerEl.appendChild(item);
  });

  if (visibleCount === 0) {
    const empty = document.createElement('li');
    empty.className = 'question-item question-item--empty';
    empty.textContent = 'Brak pytań pasujących do filtrów';
    containerEl.appendChild(empty);
  }
}

/**
 * Plays a short pop animation on a list item that just changed
 * its mastery state. Safe to call with a missing element.
 */
export function popListItem(listEl, questionIndex) {
  if (!listEl || typeof questionIndex !== 'number' || prefersReducedMotion()) {
    return;
  }
  const target = listEl.querySelector(`.question-item[data-index="${questionIndex}"]`);
  if (target) {
    target.classList.remove('mastery-pop');
    void target.offsetWidth;
    target.classList.add('mastery-pop');
  }
}
