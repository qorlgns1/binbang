/**
 * Smoothly scrolls the document to the element with the given ID using a custom easing curve.
 *
 * @param targetId - ID of the target element to scroll to
 * @param offset - Vertical offset in pixels subtracted from the target's top (defaults to 64)
 * @param duration - Animation duration in milliseconds (defaults to 480)
 */
export function smoothScrollTo(targetId: string, offset = 64, duration = 480): void {
  const target = document.getElementById(targetId);
  if (!target) return;

  const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  let start: number | null = null;

  // cubic-bezier(0.22, 1, 0.36, 1)
  const easing = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animation = (currentTime: number): void => {
    if (start === null) start = currentTime;
    const timeElapsed = currentTime - start;
    const progress = Math.min(timeElapsed / duration, 1);
    window.scrollTo(0, startPosition + distance * easing(progress));
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
}