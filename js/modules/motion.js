/**
 * Motion Module
 * Central helpers for particle bursts, class-replayed animations
 * and stagger bookkeeping.
 * Every effect respects the user's reduced-motion preference.
 */

const reducedQuery =
  typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

const coarsePointerQuery =
  typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)')
    : null;

export function prefersReducedMotion() {
  return Boolean(reducedQuery?.matches);
}

export function prefersCoarsePointer() {
  return Boolean(coarsePointerQuery?.matches);
}

/**
 * Re-triggers a CSS animation class on an element.
 * Forces a reflow so the animation restarts even if the class
 * was already present.
 */
export function replayClass(el, className) {
  if (!el || !className) {
    return;
  }
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

/**
 * Returns the center coordinates of an element in viewport space.
 */
export function elementCenter(el) {
  const rect = el?.getBoundingClientRect();
  if (!rect) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Spawns a short-lived particle burst at viewport coordinates.
 * Particles are plain spans animated purely by CSS keyframes and
 * removed from the DOM as soon as their animation finishes.
 */
export function burstParticles(
  x,
  y,
  {
    count = 16,
    colors = ['#ffffff', '#ffd76a', '#7ef0d4', '#ff8fb1', '#9bb8ff'],
    spread = 90,
  } = {},
) {
  if (prefersReducedMotion()) {
    return;
  }
  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'fx-particle';
    particle.setAttribute('aria-hidden', 'true');

    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.7;
    const distance = spread * (0.5 + Math.random() * 0.75);
    const size = 4 + Math.random() * 6;
    const rotation = Math.round(Math.random() * 540 - 270);

    particle.style.setProperty('--ox', `${x.toFixed(1)}px`);
    particle.style.setProperty('--oy', `${y.toFixed(1)}px`);
    particle.style.setProperty('--dx', `${(Math.cos(angle) * distance).toFixed(1)}px`);
    particle.style.setProperty('--dy', `${(Math.sin(angle) * distance - 26).toFixed(1)}px`);
    particle.style.setProperty('--rot', `${rotation}deg`);
    particle.style.setProperty('--size', `${size.toFixed(1)}px`);
    particle.style.background = colors[i % colors.length];

    document.body.appendChild(particle);
    particle.addEventListener('animationend', () => particle.remove());
    window.setTimeout(() => particle.remove(), 1400);
  }
}

/**
 * Builds a color palette for bursts based on a card's accent variables,
 * falling back to a festive neutral mix.
 */
export function accentBurstColors(el) {
  let accent = '';
  try {
    accent = window.getComputedStyle(el).getPropertyValue('--card-accent-strong').trim();
  } catch (_) {
    accent = '';
  }
  const base = ['#ffffff', '#ffd76a'];
  return accent ? [accent, ...base, '#7ef0d4'] : base.concat('#7ef0d4', '#ff8fb1');
}

/**
 * Stores a stagger index on an element via a CSS custom property.
 * Stylesheets convert it into an animation-delay.
 */
export function setStaggerIndex(el, index, propertyName = '--stagger-i') {
  if (!el) {
    return;
  }
  el.style.setProperty(propertyName, String(index));
}
