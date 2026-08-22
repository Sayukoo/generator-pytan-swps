/**
 * Filter Menu Module
 * Manages tag filter options and hide mastered checkbox state.
 */

export function slugify(text, fallback) {
  if (typeof text !== 'string' || text.trim() === '') {
    return fallback;
  }
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

export function createFilterMenu({
  tagListEl,
  clearButton,
  hideMasteredEl,
  tags = [],
  tagColors = {},
  storageKey = null,
} = {}) {
  if (!tagListEl) {
    throw new Error('Brak kontenera tagów.');
  }

  function loadPersisted() {
    if (!storageKey) {
      return null;
    }
    try {
      const raw = window.localStorage?.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object') {
        return {
          hideMastered: Boolean(parsed.hideMastered),
          selectedTags: Array.isArray(parsed.selectedTags) ? parsed.selectedTags.filter((t) => typeof t === 'string') : [],
        };
      }
    } catch (_) {
      // no-op
    }
    return null;
  }

  const persisted = loadPersisted();

  const state = {
    hideMastered: hideMasteredEl ? Boolean(hideMasteredEl.checked) : false,
    selectedTags: new Set(),
  };

  if (persisted) {
    state.hideMastered = persisted.hideMastered;
    if (hideMasteredEl) {
      hideMasteredEl.checked = persisted.hideMastered;
    }
    persisted.selectedTags.forEach((tag) => state.selectedTags.add(tag));
  }

  function persistState() {
    if (!storageKey) {
      return;
    }
    try {
      window.localStorage?.setItem(
        storageKey,
        JSON.stringify({
          hideMastered: state.hideMastered,
          selectedTags: Array.from(state.selectedTags),
        }),
      );
    } catch (_) {
      // no-op
    }
  }

  const listeners = new Set();

  function emit() {
    persistState();
    const snapshot = {
      hideMastered: state.hideMastered,
      selectedTags: new Set(state.selectedTags),
    };
    listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error('[filterMenu] Listener error:', error);
      }
    });
  }

  const uniqueTags = Array.from(
    new Set(
      (Array.isArray(tags) ? tags : [])
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag) => tag.length > 0),
    ),
  );

  // Drop persisted tags that no longer exist in this bank
  Array.from(state.selectedTags).forEach((tag) => {
    if (!uniqueTags.includes(tag)) {
      state.selectedTags.delete(tag);
    }
  });

  uniqueTags.forEach((tag, index) => {
    const option = document.createElement('label');
    option.className = 'tag-chip';
    const color = typeof tagColors[tag] === 'string' ? tagColors[tag] : '';
    if (color) {
      option.style.setProperty('--tag-dot-color', color);
    }

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `filter-tag-${slugify(tag, `tag-${index}`)}-${index}`;
    input.value = tag;
    if (state.selectedTags.has(tag)) {
      input.checked = true;
    }
    input.addEventListener('change', () => {
      if (input.checked) {
        state.selectedTags.add(tag);
      } else {
        state.selectedTags.delete(tag);
      }
      emit();
    });

    const dot = document.createElement('span');
    dot.className = 'tag-dot';
    dot.setAttribute('aria-hidden', 'true');

    const labelText = document.createElement('span');
    labelText.className = 'tag-chip__label';
    labelText.textContent = tag;

    option.appendChild(input);
    option.appendChild(dot);
    option.appendChild(labelText);
    tagListEl.appendChild(option);
  });

  if (hideMasteredEl) {
    hideMasteredEl.addEventListener('change', () => {
      state.hideMastered = Boolean(hideMasteredEl.checked);
      emit();
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      state.selectedTags.clear();
      tagListEl.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = false;
      });
      if (hideMasteredEl) {
        hideMasteredEl.checked = false;
        state.hideMastered = false;
      }
      emit();
    });
  }

  function getState() {
    return {
      hideMastered: state.hideMastered,
      selectedTags: new Set(state.selectedTags),
    };
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      return () => {};
    }
    listeners.add(listener);
    listener(getState());
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    getState,
    subscribe,
  };
}
