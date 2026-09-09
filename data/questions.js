(function (global) {
  'use strict';

  let activeBank = global.localStorage?.getItem('active_bank');
  if (!global.localStorage?.getItem('swps50_initialized')) {
    activeBank = 'swps50';
    global.localStorage?.setItem('active_bank', 'swps50');
    global.localStorage?.setItem('swps50_initialized', 'true');
  } else if (!activeBank) {
    activeBank = 'swps50';
  }

  let RAW_QUESTIONS;
  if (activeBank === 'swps50') {
    RAW_QUESTIONS = global.SWPS_LICENCJAT_QUESTIONS || global.SWPS_QUESTIONS;
  } else if (activeBank === 'uwr') {
    RAW_QUESTIONS = global.UWR_QUESTIONS;
  } else if (activeBank === 'custom') {
    try {
      const customRaw = global.localStorage?.getItem('custom_questions_bank');
      const parsed = customRaw ? JSON.parse(customRaw) : null;
      RAW_QUESTIONS = Array.isArray(parsed) && parsed.length > 0 ? parsed : (global.SWPS_LICENCJAT_QUESTIONS || global.SWPS_QUESTIONS);
    } catch (_) {
      RAW_QUESTIONS = global.SWPS_LICENCJAT_QUESTIONS || global.SWPS_QUESTIONS;
    }
  } else {
    RAW_QUESTIONS = global.SWPS_QUESTIONS;
  }

  const QUESTIONS = RAW_QUESTIONS.map((entry) => ({
    text: typeof entry.text === 'string' ? entry.text.trim() : '',
    category: typeof entry.category === 'string' ? entry.category.trim() : null,
    tags: Array.isArray(entry.tags)
      ? entry.tags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag) => tag.length > 0)
      : [],
  }));

  global.QUESTIONS = QUESTIONS;
  global.ACTIVE_BANK = activeBank;
})(window);
