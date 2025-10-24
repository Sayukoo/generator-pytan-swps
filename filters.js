(function (global) {
  'use strict';

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

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function createFilterMenu({
    toggleEl,
    closeEl,
    panelEl,
    backdropEl,
    includeMasteredEl,
    includeUnmasteredEl,
    tagListEl,
    clearButton,
    tags = [],
  } = {}) {
    if (!toggleEl || !panelEl || !tagListEl) {
      throw new Error('Brak wymaganych elementów do utworzenia menu filtrów.');
    }

    const state = {
      includeMastered: includeMasteredEl ? Boolean(includeMasteredEl.checked) : true,
      includeUnmastered: includeUnmasteredEl ? Boolean(includeUnmasteredEl.checked) : true,
      selectedTags: new Set(),
    };

    const listeners = new Set();
    let isOpen = false;

    function emit() {
      const snapshot = {
        includeMastered: state.includeMastered,
        includeUnmastered: state.includeUnmastered,
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

    function ensureBodyClass(flag) {
      if (flag) {
        document.body.classList.add('menu-open');
      } else {
        document.body.classList.remove('menu-open');
      }
    }

    function setMenuOpen(flag) {
      if (isOpen === flag) {
        return;
      }
      isOpen = flag;
      toggleEl.setAttribute('aria-expanded', String(flag));
      panelEl.classList.toggle('is-open', flag);
      panelEl.setAttribute('aria-hidden', String(!flag));
      if (backdropEl) {
        backdropEl.classList.toggle('is-open', flag);
      }
      ensureBodyClass(flag);
      if (flag) {
        const firstInteractive = panelEl.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstInteractive) {
          firstInteractive.focus({ preventScroll: true });
        }
        document.addEventListener('keydown', handleKeydown);
      } else {
        document.removeEventListener('keydown', handleKeydown);
        toggleEl.focus({ preventScroll: true });
      }
    }

    function toggleMenu() {
      setMenuOpen(!isOpen);
    }

    function closeMenu() {
      setMenuOpen(false);
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
    }

    toggleEl.addEventListener('click', toggleMenu);
    if (closeEl) {
      closeEl.addEventListener('click', closeMenu);
    }
    if (backdropEl) {
      backdropEl.addEventListener('click', closeMenu);
    }

    panelEl.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    const uniqueTags = Array.from(
      new Set(
        toArray(tags)
          .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
          .filter((tag) => tag.length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b, 'pl', { sensitivity: 'accent' }));

    uniqueTags.forEach((tag, index) => {
      const option = document.createElement('label');
      option.className = 'filter-tag-option';
      const input = document.createElement('input');
      input.type = 'checkbox';
      const id = `filter-tag-${slugify(tag, `tag-${index}`)}-${index}`;
      input.id = id;
      input.value = tag;
      input.addEventListener('change', () => {
        if (input.checked) {
          state.selectedTags.add(tag);
        } else {
          state.selectedTags.delete(tag);
        }
        emit();
      });
      const faux = document.createElement('span');
      faux.className = 'checkbox-indicator';
      const labelText = document.createElement('span');
      labelText.className = 'label-text';
      labelText.textContent = tag;

      option.appendChild(input);
      option.appendChild(faux);
      option.appendChild(labelText);
      tagListEl.appendChild(option);
    });

    if (includeMasteredEl) {
      includeMasteredEl.addEventListener('change', () => {
        state.includeMastered = Boolean(includeMasteredEl.checked);
        emit();
      });
    }
    if (includeUnmasteredEl) {
      includeUnmasteredEl.addEventListener('change', () => {
        state.includeUnmastered = Boolean(includeUnmasteredEl.checked);
        emit();
      });
    }

    if (clearButton) {
      clearButton.addEventListener('click', () => {
        state.selectedTags.clear();
        const inputs = tagListEl.querySelectorAll('input[type="checkbox"]');
        inputs.forEach((checkbox) => {
          checkbox.checked = false;
        });
        if (includeMasteredEl) {
          includeMasteredEl.checked = true;
          state.includeMastered = true;
        }
        if (includeUnmasteredEl) {
          includeUnmasteredEl.checked = true;
          state.includeUnmastered = true;
        }
        emit();
      });
    }

    function getState() {
      return {
        includeMastered: state.includeMastered,
        includeUnmastered: state.includeUnmastered,
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
      open: () => setMenuOpen(true),
      close: () => setMenuOpen(false),
      toggle: toggleMenu,
      isOpen: () => isOpen,
      getState,
      subscribe,
    };
  }

  global.createFilterMenu = createFilterMenu;
})(window);
