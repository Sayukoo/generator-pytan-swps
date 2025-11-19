QUnit.module('masteryManager', function(hooks) {
  hooks.beforeEach(function() {
    // Clear local storage before each test
    window.localStorage.clear();
  });

  QUnit.test('should exist on the window object', function(assert) {
    assert.ok(window.masteryManager, 'masteryManager exists');
    assert.equal(typeof window.masteryManager.isMastered, 'function', 'isMastered is a function');
    assert.equal(typeof window.masteryManager.setMastered, 'function', 'setMastered is a function');
    assert.equal(typeof window.masteryManager.toggleMastered, 'function', 'toggleMastered is a function');
  });

  QUnit.test('setMastered should mark a question as mastered', function(assert) {
    const { masteryManager } = window;
    masteryManager.setMastered(1, true);
    assert.true(masteryManager.isMastered(1), 'Question 1 should be mastered');
  });

  QUnit.test('setMastered should un-mark a question as mastered', function(assert) {
    const { masteryManager } = window;
    masteryManager.setMastered(1, true);
    masteryManager.setMastered(1, false);
    assert.false(masteryManager.isMastered(1), 'Question 1 should not be mastered');
  });

  QUnit.test('toggleMastered should toggle the mastered state', function(assert) {
    const { masteryManager } = window;
    masteryManager.toggleMastered(2);
    assert.true(masteryManager.isMastered(2), 'Question 2 should be mastered');
    masteryManager.toggleMastered(2);
    assert.false(masteryManager.isMastered(2), 'Question 2 should not be mastered');
  });

  QUnit.test('getAll should return a set of all mastered questions', function(assert) {
    const { masteryManager } = window;
    masteryManager.setMastered(3, true);
    masteryManager.setMastered(5, true);
    const mastered = masteryManager.getAll();
    assert.equal(mastered.size, 2, 'There should be 2 mastered questions');
    assert.true(mastered.has(3), 'Mastered set should contain question 3');
    assert.true(mastered.has(5), 'Mastered set should contain question 5');
  });

  QUnit.test('clearAll should clear all mastered questions', function(assert) {
    const { masteryManager } = window;
    masteryManager.setMastered(1, true);
    masteryManager.setMastered(2, true);
    masteryManager.clearAll();
    const mastered = masteryManager.getAll();
    assert.equal(mastered.size, 0, 'There should be no mastered questions');
  });
});

QUnit.done(function(details) {
  console.log(`Total: ${details.total}, Failed: ${details.failed}, Passed: ${details.passed}, Runtime: ${details.runtime}`);
});
