/**
 * Keyboard Handler Module
 * Manages global keyboard navigation and shortcuts for the application.
 */

export function setupKeyboardShortcuts({
  onDraw,
  onReset,
  onSelectCard,
  onToggleActiveMastered,
  onFocusSearch,
  isTimerAnswerActive,
  isDrawDisabled,
}) {
  document.addEventListener('keydown', (e) => {
    // Ignore input elements except buttons when using shortcuts
    const targetTag = e.target?.tagName;
    if (targetTag && ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) {
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return;
    }

    if (targetTag === 'BUTTON' && e.code !== 'Space' && e.key !== 'Escape') {
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      if (!isTimerAnswerActive() && !isDrawDisabled()) {
        if (typeof onDraw === 'function') {
          onDraw();
        }
      }
    } else if (e.key && e.key.toLowerCase() === 'r') {
      if (typeof onReset === 'function') {
        onReset();
      }
    } else if (e.key === '1') {
      if (typeof onSelectCard === 'function') {
        onSelectCard(0);
      }
    } else if (e.key === '2') {
      if (typeof onSelectCard === 'function') {
        onSelectCard(1);
      }
    } else if (e.key && e.key.toLowerCase() === 'm') {
      if (typeof onToggleActiveMastered === 'function') {
        onToggleActiveMastered();
      }
    } else if (e.key && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      if (typeof onFocusSearch === 'function') {
        onFocusSearch();
      }
    }
  });
}
