QUnit.module('createFilterMenu', function(hooks) {
  hooks.beforeEach(function() {
    const fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = `
      <button id="toggle"></button>
      <div id="panel"></div>
      <div id="backdrop"></div>
      <input type="checkbox" id="includeMastered" checked />
      <input type="checkbox" id="includeUnmastered" checked />
      <div id="tagList"></div>
      <button id="clear"></button>
    `;
  });

  QUnit.test('should create a filter menu and return an API', function(assert) {
    const menu = window.createFilterMenu({
      toggleEl: document.getElementById('toggle'),
      panelEl: document.getElementById('panel'),
      tagListEl: document.getElementById('tagList'),
    });
    assert.ok(menu, 'menu exists');
    assert.equal(typeof menu.open, 'function', 'open is a function');
    assert.equal(typeof menu.close, 'function', 'close is a function');
    assert.equal(typeof menu.toggle, 'function', 'toggle is a function');
    assert.equal(typeof menu.isOpen, 'function', 'isOpen is a function');
    assert.equal(typeof menu.getState, 'function', 'getState is a function');
    assert.equal(typeof menu.subscribe, 'function', 'subscribe is a function');
  });

  QUnit.test('getState should return the initial state', function(assert) {
    const menu = window.createFilterMenu({
      toggleEl: document.getElementById('toggle'),
      panelEl: document.getElementById('panel'),
      tagListEl: document.getElementById('tagList'),
      includeMasteredEl: document.getElementById('includeMastered'),
      includeUnmasteredEl: document.getElementById('includeUnmastered'),
    });
    const state = menu.getState();
    assert.true(state.includeMastered, 'includeMastered should be true');
    assert.true(state.includeUnmastered, 'includeUnmastered should be true');
    assert.equal(state.selectedTags.size, 0, 'selectedTags should be empty');
  });

  QUnit.test('should update state when checkboxes are changed', function(assert) {
    const menu = window.createFilterMenu({
      toggleEl: document.getElementById('toggle'),
      panelEl: document.getElementById('panel'),
      tagListEl: document.getElementById('tagList'),
      includeMasteredEl: document.getElementById('includeMastered'),
      includeUnmasteredEl: document.getElementById('includeUnmastered'),
    });
    const includeMasteredEl = document.getElementById('includeMastered');
    includeMasteredEl.checked = false;
    includeMasteredEl.dispatchEvent(new Event('change'));
    const state = menu.getState();
    assert.false(state.includeMastered, 'includeMastered should be false');
  });

  QUnit.test('should update state when tags are selected', function(assert) {
    const menu = window.createFilterMenu({
      toggleEl: document.getElementById('toggle'),
      panelEl: document.getElementById('panel'),
      tagListEl: document.getElementById('tagList'),
      tags: ['tag1', 'tag2'],
    });
    const tag1Checkbox = document.querySelector('input[value="tag1"]');
    tag1Checkbox.checked = true;
    tag1Checkbox.dispatchEvent(new Event('change'));
    const state = menu.getState();
    assert.equal(state.selectedTags.size, 1, 'selectedTags should have 1 tag');
    assert.true(state.selectedTags.has('tag1'), 'selectedTags should contain tag1');
  });

  QUnit.test('clearButton should clear all filters', function(assert) {
    const menu = window.createFilterMenu({
      toggleEl: document.getElementById('toggle'),
      panelEl: document.getElementById('panel'),
      tagListEl: document.getElementById('tagList'),
      includeMasteredEl: document.getElementById('includeMastered'),
      includeUnmasteredEl: document.getElementById('includeUnmastered'),
      clearButton: document.getElementById('clear'),
      tags: ['tag1', 'tag2'],
    });

    const includeMasteredEl = document.getElementById('includeMastered');
    includeMasteredEl.checked = false;
    includeMasteredEl.dispatchEvent(new Event('change'));

    const tag1Checkbox = document.querySelector('input[value="tag1"]');
    tag1Checkbox.checked = true;
    tag1Checkbox.dispatchEvent(new Event('change'));

    const clearButton = document.getElementById('clear');
    clearButton.click();

    const state = menu.getState();
    assert.true(state.includeMastered, 'includeMastered should be true');
    assert.equal(state.selectedTags.size, 0, 'selectedTags should be empty');
  });
});
