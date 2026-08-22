/**
 * UI Helpers Module
 * Helper functions for UI animations, topbar updates, and dialog interactions.
 */

import {
  burstParticles,
  elementCenter,
  prefersReducedMotion,
  replayClass,
} from './motion.js';

export function addRipple(button, e) {
  if (!button) {
    return;
  }
  try {
    const rect = button.getBoundingClientRect();
    const clientX = e?.clientX ?? e?.touches?.[0]?.clientX;
    const clientY = e?.clientY ?? e?.touches?.[0]?.clientY;
    const x = (typeof clientX === 'number' ? clientX : rect.left + rect.width / 2) - rect.left;
    const y = (typeof clientY === 'number' ? clientY : rect.top + rect.height / 2) - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  } catch (_) {
    // no-op
  }
}

function animateNumberTo(el, target) {
  const next = Number(target);
  if (!el || !Number.isFinite(next)) {
    return;
  }
  const start = Number.parseInt(el.textContent || '0', 10) || 0;
  if (start === next) {
    return;
  }
  if (prefersReducedMotion()) {
    el.textContent = String(next);
    return;
  }
  replayClass(el.parentElement, 'bump');
  const duration = 420;
  const startTime = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(start + (next - start) * eased));
    if (t < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

export function updateTopbarInfo({ totalCount, masteredCount, isUwr }) {
  const navTotalCountEl = document.getElementById('navTotalCount');
  const navMasteredCountEl = document.getElementById('navMasteredCount');
  const navSubtitleEl = document.getElementById('navSubtitle');
  const navProgressEl = document.getElementById('navProgressBar');

  if (navTotalCountEl) {
    navTotalCountEl.textContent = String(totalCount);
  }
  if (navMasteredCountEl) {
    animateNumberTo(navMasteredCountEl, masteredCount);
  }
  if (navProgressEl && totalCount > 0) {
    const percent = Math.min(100, Math.round((masteredCount / totalCount) * 100));
    navProgressEl.style.width = `${percent}%`;
  }
  if (navSubtitleEl) {
    navSubtitleEl.textContent = isUwr
      ? `${totalCount} pytań · timer 3 min`
      : `${totalCount} pytań egzaminacyjnych`;
  }
}

/**
 * Celebrates a newly mastered question with a particle burst.
 * `wasMastered` lets callers skip the effect when un-marking.
 */
export function celebrateMastery(cardEl, wasMastered = true) {
  if (!cardEl || !wasMastered || prefersReducedMotion()) {
    return;
  }
  const { x, y } = elementCenter(cardEl);
  burstParticles(x, y, { count: 22, spread: 110 });
}

export function setupHelpModal(helpBtn, helpDialog, closeHelpBtn) {
  if (helpBtn && helpDialog) {
    helpBtn.addEventListener('click', () => helpDialog.showModal());
  }
  if (closeHelpBtn && helpDialog) {
    closeHelpBtn.addEventListener('click', () => helpDialog.close());
  }
}
