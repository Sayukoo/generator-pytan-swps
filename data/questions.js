(function (global) {
  'use strict';

  const activeBank = global.localStorage?.getItem('active_bank') || 'swps';
  const RAW_QUESTIONS = activeBank === 'uwr' ? global.UWR_QUESTIONS : global.SWPS_QUESTIONS;

  const QUESTIONS = RAW_QUESTIONS.map((entry) => ({
    text: typeof entry.text === 'string' ? entry.text.trim() : '',
    tags: Array.isArray(entry.tags)
      ? entry.tags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag) => tag.length > 0)
      : [],
  }));

  global.QUESTIONS = QUESTIONS;
  global.ACTIVE_BANK = activeBank;
})(window);
