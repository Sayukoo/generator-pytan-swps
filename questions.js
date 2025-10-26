(function (global) {
  'use strict';

  async function loadQuestions() {
    try {
      const response = await fetch('questions.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawQuestions = await response.json();
      return rawQuestions.map((entry) => ({
        text: typeof entry.text === 'string' ? entry.text.trim() : '',
        tags: Array.isArray(entry.tags)
          ? entry.tags
            .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
            .filter((tag) => tag.length > 0)
          : [],
      }));
    } catch (error) {
      console.error('Failed to load questions:', error);
      return [];
    }
  }

  global.loadQuestions = loadQuestions;
})(window);
