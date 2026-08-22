/**
 * Mastery Manager Module
 * Manages persisted mastered questions state per question bank.
 */

const activeBank = window.localStorage?.getItem('active_bank') || 'swps';
const STORAGE_KEYS = {
  swps: 'swps-mastered-questions.v3',
  uwr: 'uwr-mastered-questions.v1',
  custom: 'custom-mastered-questions.v1',
};
const LOG_KEYS = {
  swps: 'swps-mastery-log.v1',
  uwr: 'uwr-mastery-log.v1',
  custom: 'custom-mastery-log.v1',
};
const STORAGE_KEY = STORAGE_KEYS[activeBank] || STORAGE_KEYS.swps;
const LOG_KEY = LOG_KEYS[activeBank] || LOG_KEYS.swps;

function todayStamp() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function sanitizeIndex(index) {
  if (typeof index === 'number' && Number.isInteger(index) && index >= 0) {
    return index;
  }
  if (typeof index === 'string' && index.trim() !== '') {
    const parsed = Number(index);
    if (Number.isInteger(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return null;
}

function loadMastered() {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    const valid = parsed
      .map(sanitizeIndex)
      .filter((value) => value !== null);
    return new Set(valid);
  } catch (error) {
    console.warn('[masteryManager] Failed to load mastered list:', error);
    return new Set();
  }
}

function persist(set) {
  try {
    const payload = JSON.stringify(Array.from(set.values()));
    window.localStorage?.setItem(STORAGE_KEY, payload);
  } catch (error) {
    console.warn('[masteryManager] Failed to persist mastered list:', error);
  }
}

function loadLog() {
  try {
    const raw = window.localStorage?.getItem(LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (entry) => entry && Number.isInteger(entry.i) && typeof entry.d === 'string',
    );
  } catch (error) {
    console.warn('[masteryManager] Failed to load mastery log:', error);
    return [];
  }
}

function persistLog(log) {
  try {
    window.localStorage?.setItem(LOG_KEY, JSON.stringify(log.slice(-2000)));
  } catch (error) {
    console.warn('[masteryManager] Failed to persist mastery log:', error);
  }
}

const listeners = new Set();
let masteredSet = loadMastered();
let masteryLog = loadLog();

function emit() {
  const snapshot = new Set(masteredSet);
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (error) {
      console.error('[masteryManager] Listener error:', error);
    }
  });
}

export function getActiveBank() {
  return activeBank;
}

export function isMastered(index) {
  const cleanIndex = sanitizeIndex(index);
  if (cleanIndex === null) {
    return false;
  }
  return masteredSet.has(cleanIndex);
}

export function setMastered(index, flag) {
  const cleanIndex = sanitizeIndex(index);
  if (cleanIndex === null) {
    return false;
  }
  const nextFlag = Boolean(flag);
  const prevFlag = masteredSet.has(cleanIndex);
  if (nextFlag === prevFlag) {
    return prevFlag;
  }
  if (nextFlag) {
    masteredSet.add(cleanIndex);
    masteryLog.push({ i: cleanIndex, d: todayStamp() });
    persistLog(masteryLog);
  } else {
    masteredSet.delete(cleanIndex);
    const logIndex = masteryLog.map((entry) => entry.i).lastIndexOf(cleanIndex);
    if (logIndex !== -1) {
      masteryLog.splice(logIndex, 1);
      persistLog(masteryLog);
    }
  }
  persist(masteredSet);
  emit();
  return nextFlag;
}

export function toggleMastered(index) {
  const cleanIndex = sanitizeIndex(index);
  if (cleanIndex === null) {
    return false;
  }
  const shouldBeMastered = !masteredSet.has(cleanIndex);
  return setMastered(cleanIndex, shouldBeMastered);
}

export function getAll() {
  return new Set(masteredSet);
}

export function clearAll() {
  if (masteredSet.size === 0) {
    return;
  }
  masteredSet = new Set();
  masteryLog = [];
  persist(masteredSet);
  persistLog(masteryLog);
  emit();
}

export function getTodayCount() {
  const today = todayStamp();
  return masteryLog.filter((entry) => entry.d === today).length;
}

export function subscribe(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const masteryManager = {
  getActiveBank,
  isMastered,
  setMastered,
  toggleMastered,
  getAll,
  clearAll,
  getTodayCount,
  subscribe,
};
