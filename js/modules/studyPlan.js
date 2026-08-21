/**
 * Study Plan Module
 * Calculates and displays a study plan based on a target date and mastery progress.
 * Result updates play a soft refresh animation.
 */

import { prefersReducedMotion, replayClass } from './motion.js';

export function setupStudyPlan({ dateInputId, resultContainerId, totalQuestions, masteryManager }) {
  const dateInput = document.getElementById(dateInputId);
  const resultContainer = document.getElementById(resultContainerId);

  if (!dateInput || !resultContainer) {
    console.warn('[studyPlan] Required DOM elements not found.');
    return;
  }

  const bankId = masteryManager.getActiveBank();
  const storageKey = `exam_date_${bankId}`;

  // Load saved date
  const savedDate = window.localStorage?.getItem(storageKey);
  if (savedDate) {
    dateInput.value = savedDate;
  }

  function calculateAndDisplayPlan() {
    const selectedDateStr = dateInput.value;

    if (!selectedDateStr) {
      resultContainer.innerHTML = '';
      return;
    }

    const selectedDate = new Date(selectedDateStr);
    const today = new Date();

    // Reset time to midnight for accurate day comparison
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const timeDiff = selectedDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysLeft <= 0) {
      renderPlan('<strong>Egzamin tuż tuż!</strong>');
      return;
    }

    const masteredCount = masteryManager.getAll().size;
    const questionsLeft = Math.max(0, totalQuestions - masteredCount);

    if (questionsLeft === 0) {
      renderPlan('<strong>Wszystko opanowane! Gratulacje!</strong>');
      return;
    }

    const questionsPerDay = Math.ceil(questionsLeft / daysLeft);

    renderPlan(
      `Do opanowania: ${questionsLeft} pytań.<br>Pozostało: ${daysLeft} dni.<br><strong>Cel: ${questionsPerDay} pytań/dzień.</strong>`,
    );
  }

  function renderPlan(html) {
    if (resultContainer.innerHTML === html) {
      return;
    }
    resultContainer.innerHTML = html;
    if (!prefersReducedMotion()) {
      replayClass(resultContainer, 'plan-refresh');
    }
  }

  // Event listener for date input
  dateInput.addEventListener('change', (e) => {
    const newDate = e.target.value;
    if (newDate) {
      window.localStorage?.setItem(storageKey, newDate);
    } else {
      window.localStorage?.removeItem(storageKey);
    }
    calculateAndDisplayPlan();
  });

  // Subscribe to mastery changes
  masteryManager.subscribe(calculateAndDisplayPlan);

  // Initial calculation
  calculateAndDisplayPlan();
}
