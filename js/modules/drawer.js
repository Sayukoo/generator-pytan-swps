/**
 * Question Drawer Module
 * Contains random number generation and candidate selection logic for drawing questions.
 */

export function randInt(min, max) {
  const range = max - min + 1;
  if (range <= 0) {
    return min;
  }
  const maxUint = 0xFFFFFFFF;
  const limit = Math.floor(maxUint / range) * range;
  const buffer = new Uint32Array(1);
  let value;
  do {
    window.crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return min + (value % range);
}

export function pickRandomIndex(pool) {
  if (!Array.isArray(pool) || pool.length === 0) {
    return null;
  }
  return pool[randInt(0, pool.length - 1)] ?? null;
}

export function getCandidateIndices(questions, filterState, isMasteredFn) {
  if (!Array.isArray(questions)) {
    return [];
  }
  const hideMastered = Boolean(filterState?.hideMastered);
  const tagFilter = filterState?.selectedTags instanceof Set ? filterState.selectedTags : new Set();
  const hasTagFilter = tagFilter.size > 0;
  const matches = [];

  for (let i = 0; i < questions.length; i += 1) {
    const entry = questions[i];
    const mastered = typeof isMasteredFn === 'function' ? isMasteredFn(i) : false;
    if (hideMastered && mastered) {
      continue;
    }
    if (hasTagFilter) {
      const questionTags = Array.isArray(entry.tags) ? entry.tags : [];
      if (!questionTags.some((tag) => tagFilter.has(tag))) {
        continue;
      }
    }
    matches.push(i);
  }
  return matches;
}

export function selectQuestionPair(questions, filterState, masteredSet) {
  const isMasteredFn = (idx) => masteredSet?.has?.(idx);
  const candidates = getCandidateIndices(questions, filterState, isMasteredFn);
  if (candidates.length === 0) {
    return [null, null];
  }
  const unmasteredCandidates = candidates.filter((idx) => !masteredSet?.has?.(idx));
  const firstPool = unmasteredCandidates.length > 0 ? unmasteredCandidates : candidates;
  const firstIndex = pickRandomIndex(firstPool);
  if (firstIndex === null) {
    return [null, null];
  }
  const remaining = candidates.filter((idx) => idx !== firstIndex);
  if (remaining.length === 0) {
    return [firstIndex, null];
  }
  const unmasteredRemaining = remaining.filter((idx) => !masteredSet?.has?.(idx));
  const secondPool = unmasteredRemaining.length > 0 ? unmasteredRemaining : remaining;
  return [firstIndex, pickRandomIndex(secondPool)];
}

export function selectSingleQuestion(questions, filterState, masteredSet) {
  const isMasteredFn = (idx) => masteredSet?.has?.(idx);
  const candidates = getCandidateIndices(questions, filterState, isMasteredFn);
  if (candidates.length === 0) {
    return null;
  }
  const unmastered = candidates.filter((idx) => !masteredSet?.has?.(idx));
  const pool = unmastered.length > 0 ? unmastered : candidates;
  return pickRandomIndex(pool);
}
