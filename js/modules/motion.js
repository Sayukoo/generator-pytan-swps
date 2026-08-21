/**
 * Motion Module
 * Central helpers for pointer-driven 3D tilt, particle bursts,
 * class-replayed animations and stagger bookkeeping.
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
 * Attaches a pointer-following 3D tilt effect to an element.
 * Exposes CSS custom properties consumable by the stylesheet:
 *   --rx, --ry  -> rotateX/rotateY angles (deg)
 *   --px, --py  -> pointer position inside the element (%)
 * Returns a detach function.
 */
export function attachPointerTilt(el, { maxTilt = 6 } = {}) {
  if (!el || el.dataset.tiltBound === 'true') {
    return () => {};
  }
  if (prefersCoarsePointer()) {
    return () => {};
  }
  el.dataset.tiltBound = 'true';

  let rafId = 0;
  let px = 50;
  let py = 50;

  const applyFrame = () => {
    rafId = 0;
    el.style.setProperty('--px', `${px.toFixed(2)}%`);
    el.style.setProperty('--py', `${py.toFixed(2)}%`);
    const rx = ((py - 50) / 50) * -maxTilt;
    const ry = ((px - 50) / 50) * maxTilt;
    el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
  };

  const onPointerMove = (event) => {
    if (prefersReducedMotion()) {
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    px = ((event.clientX - rect.left) / rect.width) * 100;
    py = ((event.clientY - rect.top) / rect.height) * 100;
    if (!rafId) {
      rafId = window.requestAnimationFrame(applyFrame);
    }
  };

  const onPointerLeave = () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--px', '50%');
    el.style.setProperty('--py', '50%');
  };

  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerleave', onPointerLeave);

  return () => {
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerleave', onPointerLeave);
    delete el.dataset.tiltBound;
  };
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
 * Updates text content and plays a springy "bump" animation,
 * but only when the value actually changed.
 */
export function bumpIfChanged(el, nextText) {
  if (!el) {
    return;
  }
  const next = String(nextText);
  if (el.textContent === next) {
    return;
  }
  el.textContent = next;
  replayClass(el, 'bump');
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
