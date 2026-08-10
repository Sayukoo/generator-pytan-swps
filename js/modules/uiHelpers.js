/**
 * UI Helpers Module
 * Helper functions for UI animations, topbar updates, and dialog interactions.
 */

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

export function updateTopbarInfo({ totalCount, masteredCount, isUwr }) {
  const navTotalCountEl = document.getElementById('navTotalCount');
  const navMasteredCountEl = document.getElementById('navMasteredCount');
  const navSubtitleEl = document.getElementById('navSubtitle');

  if (navTotalCountEl) {
    navTotalCountEl.textContent = String(totalCount);
  }
  if (navMasteredCountEl) {
    navMasteredCountEl.textContent = String(masteredCount);
  }
  if (navSubtitleEl) {
    navSubtitleEl.textContent = isUwr
      ? `${totalCount} pytań · timer 3 min`
      : `${totalCount} pytań egzaminacyjnych`;
  }
}

export function setupHelpModal(helpBtn, helpDialog, closeHelpBtn) {
  if (helpBtn && helpDialog) {
    helpBtn.addEventListener('click', () => helpDialog.showModal());
  }
  if (closeHelpBtn && helpDialog) {
    closeHelpBtn.addEventListener('click', () => helpDialog.close());
  }
}
