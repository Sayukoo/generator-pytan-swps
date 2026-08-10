/**
 * Mastery Manager Module
 * Manages persisted mastered questions state per question bank.
 */

const activeBank = window.localStorage?.getItem('active_bank') || 'swps';
const STORAGE_KEY = activeBank === 'uwr' ? 'uwr-mastered-questions.v1' : 'swps-mastered-questions.v3';

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

const listeners = new Set();
let masteredSet = loadMastered();

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
  } else {
    masteredSet.delete(cleanIndex);
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
  persist(masteredSet);
  emit();
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
  subscribe,
};
