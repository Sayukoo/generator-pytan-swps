(function (global) {
  'use strict';

  const { RAW_QUESTIONS } = global;

  if (!Array.isArray(RAW_QUESTIONS)) {
    throw new Error('Brak danych pytań. Upewnij się, że questions-data.js został załadowany przed questions.js.');
  }

  const QUESTIONS = RAW_QUESTIONS.map((entry) => ({
    text: typeof entry.text === 'string' ? entry.text.trim() : '',
    tags: Array.isArray(entry.tags)
      ? entry.tags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag) => tag.length > 0)
      : [],
  }));

  global.QUESTIONS = QUESTIONS;
})(window);
