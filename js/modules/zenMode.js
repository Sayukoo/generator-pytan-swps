/**
 * Zen Mode Module
 * Distraction-free view: removes topbar and sidebar,
 * keeping the stage layout unchanged.
 */

export function createZenManager({ onStateChange } = {}) {
  const exitBtn = document.getElementById('zenExitBtn');

  function isActive() {
    return document.body.classList.contains('in-zen-mode');
  }

  function open() {
    document.body.classList.add('in-zen-mode');
    if (exitBtn) {
      exitBtn.hidden = false;
    }
    if (typeof onStateChange === 'function') {
      onStateChange(true);
    }
  }

  function close() {
    document.body.classList.remove('in-zen-mode');
    if (exitBtn) {
      exitBtn.hidden = true;
    }
    if (typeof onStateChange === 'function') {
      onStateChange(false);
    }
  }

  function toggle() {
    if (isActive()) {
      close();
    } else {
      open();
    }
  }

  if (exitBtn) {
    exitBtn.addEventListener('click', close);
  }

  return {
    open,
    close,
    toggle,
    isActive,
  };
}
