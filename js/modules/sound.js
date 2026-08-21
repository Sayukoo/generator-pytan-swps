/**
 * Sound Module
 * Subtle WebAudio cues (no external assets). The AudioContext is created
 * lazily on first use to satisfy autoplay policies; every call is fail-safe.
 */

let audioContext = null;

function ensureContext() {
  if (audioContext) {
    return audioContext;
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return null;
    }
    audioContext = new Ctx();
  } catch (_) {
    audioContext = null;
  }
  return audioContext;
}

function playTone(context, { frequency, startAt, duration, gain }) {
  const oscillator = context.createOscillator();
  const amplifier = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, context.currentTime + startAt);
  amplifier.gain.setValueAtTime(0, context.currentTime + startAt);
  amplifier.gain.linearRampToValueAtTime(gain, context.currentTime + startAt + 0.02);
  amplifier.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + startAt + duration);
  oscillator.connect(amplifier);
  amplifier.connect(context.destination);
  oscillator.start(context.currentTime + startAt);
  oscillator.stop(context.currentTime + startAt + duration + 0.05);
}

/**
 * Soft two-note chime played when the answer timer runs out.
 */
export function playTimeUpChime() {
  try {
    const context = ensureContext();
    if (!context) {
      return;
    }
    if (context.state === 'suspended') {
      context.resume();
    }
    playTone(context, { frequency: 660, startAt: 0, duration: 0.28, gain: 0.05 });
    playTone(context, { frequency: 494, startAt: 0.16, duration: 0.42, gain: 0.045 });
  } catch (_) {
    // no-op
  }
}
