(function (global) {
  'use strict';

  /**
   * Converts a string to a URL-friendly slug.
   * @param {string} text - The text to slugify.
   * @param {string} fallback - The fallback string if the text is empty or invalid.
   * @returns {string} The slugified text.
   */
  function slugify(text, fallback) {
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

  /**
   * Creates a filter menu controller that manages state and UI for question filtering.
   * @param {Object} options - Configuration options for the filter menu.
   * @param {HTMLElement} options.tagListEl - The DOM element to render tags into.
   * @param {HTMLElement} options.clearButton - The button used to clear filters.
   * @param {HTMLInputElement} options.hideMasteredEl - The checkbox to toggle hiding mastered items.
   * @param {Array<string>} options.tags - The list of tags to display.
   * @param {Object} options.tagColors - A mapping of tag names to color strings.
   * @returns {Object} The filter menu interface.
   */
  function createFilterMenu({
    tagListEl,
    clearButton,
    hideMasteredEl,
    tags = [],
    tagColors = {},
  } = {}) {
    if (!tagListEl) {
      throw new Error('Brak kontenera tagów.');
    }

    const state = {
      hideMastered: hideMasteredEl ? Boolean(hideMasteredEl.checked) : false,
      selectedTags: new Set(),
    };

    const listeners = new Set();

    function emit() {
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

  global.createFilterMenu = createFilterMenu;
})(window);
