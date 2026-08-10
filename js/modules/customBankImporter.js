/**
 * Custom Bank Importer Module
 * Manages loading, validating, and persisting custom question sets from JSON.
 */

const STORAGE_KEY = 'custom_questions_bank';

export function getCustomBank() {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('[customBankImporter] Failed to load custom bank:', err);
    return null;
  }
}

export function saveCustomBank(questionsArray) {
  if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
    throw new Error('Plik musi zawierać tablicę z co najmniej jednym pytaniem.');
  }

  const validated = questionsArray.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Pytanie #${idx + 1} ma nieprawidłowy format.`);
    }
    const text = typeof item.text === 'string' ? item.text.trim() : (typeof item.question === 'string' ? item.question.trim() : '');
    if (!text) {
      throw new Error(`Pytanie #${idx + 1} nie posiada treści ("text").`);
    }
    const tags = Array.isArray(item.tags)
      ? item.tags.map((t) => String(t).trim()).filter((t) => t.length > 0)
      : (typeof item.tag === 'string' ? [item.tag.trim()] : ['Własne']);

    return { text, tags };
  });

  window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(validated));
  return validated;
}

export function clearCustomBank() {
  window.localStorage?.removeItem(STORAGE_KEY);
}

export function parseJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const validated = saveCustomBank(json);
        resolve(validated);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Błąd podczas odczytu pliku.'));
    reader.readAsText(file);
  });
}
