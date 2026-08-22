/**
 * Study Plan Module
 * Calculates and displays a study plan based on a target date, mastery progress
 * and today's completions. Result updates play a soft refresh animation.
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

  function progressBar(percent, label) {
    return `<div class="plan-progress"><div class="plan-progress__bar" style="width:${percent}%"></div></div>`;
  }

  function calculateAndDisplayPlan() {
    const selectedDateStr = dateInput.value;
    const masteredCount = masteryManager.getAll().size;
    const doneToday = masteryManager.getTodayCount();
    const overallPercent = totalQuestions > 0 ? Math.round((masteredCount / totalQuestions) * 100) : 0;

    if (!selectedDateStr) {
      renderPlan(
        `${progressBar(overallPercent)}`
        + `<div class="plan-line">Opanowane: <strong>${masteredCount}/${totalQuestions}</strong> (${overallPercent}%)</div>`
        + (doneToday > 0 ? `<div class="plan-goal"><span>Dziś: <strong>${doneToday}</strong> pyt.</span></div>` : '')
        + `<div class="plan-hint">Wybierz datę egzaminu, aby policzyć tempo nauki.</div>`,
      );
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
      renderPlan(
        `${progressBar(overallPercent)}<div class="plan-line"><strong>Egzamin tuż tuż!</strong></div><div class="plan-line">Opanowane: <strong>${masteredCount}/${totalQuestions}</strong> (${overallPercent}%)</div>`,
      );
      return;
    }

    const questionsLeft = Math.max(0, totalQuestions - masteredCount);

    if (questionsLeft === 0) {
      renderPlan(
        `${progressBar(100)}<div class="plan-line"><strong>Wszystko opanowane! Gratulacje!</strong></div>`,
      );
      return;
    }

    const questionsPerDay = Math.ceil(questionsLeft / daysLeft);
    const goalPercent = Math.min(100, Math.round((doneToday / questionsPerDay) * 100));

    renderPlan(
      `${progressBar(overallPercent)}`
      + `<div class="plan-line">Opanowane: <strong>${masteredCount}/${totalQuestions}</strong> · zostało <strong>${daysLeft}</strong> dni.</div>`
      + `<div class="plan-goal${goalPercent >= 100 ? ' plan-goal--done' : ''}">`
      + `<span>Cel na dziś: <strong>${Math.min(doneToday, questionsPerDay)}/${questionsPerDay}</strong></span>`
      + `<div class="plan-progress plan-progress--goal"><div class="plan-progress__bar" style="width:${goalPercent}%"></div></div>`
      + `</div>`,
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
