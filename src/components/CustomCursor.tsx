import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const finePointer = window.matchMedia('(pointer:fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (!finePointer || reducedMotion) return;

    document.documentElement.classList.add('has-cursor');
    let x = -100;
    let y = -100;
    let cx = x;
    let cy = y;
    let rafId = 0;

    const onPointerMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      cursor.classList.add('on');
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      x = e.clientX;
      y = e.clientY;
      cursor.classList.remove('is-pop');
      cursor.classList.add('on', 'is-down');
    };

    const onPointerUp = () => {
      if (!cursor.classList.contains('is-down')) return;
      cursor.classList.remove('is-down', 'is-pop');
      // Force reflow so rapid clicks re-trigger the release spring animation
      void cursor.offsetWidth;
      cursor.classList.add('is-pop');
    };

    const onMouseLeave = () => {
      cursor.classList.remove('on', 'is-down', 'is-pop');
    };

    window.addEventListener('pointermove', onPointerMove, { capture: true, passive: true });
    window.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
    window.addEventListener('pointerup', onPointerUp, { capture: true, passive: true });
    window.addEventListener('pointercancel', onPointerUp, { capture: true, passive: true });
    window.addEventListener('blur', onPointerUp);
    document.addEventListener('mouseleave', onMouseLeave);

    const loop = () => {
      cx += (x - cx) * 0.35;
      cy += (y - cy) * 0.35;
      cursor.style.transform = `translate3d(${cx - 2}px, ${cy - 2}px, 0)`;
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove, { capture: true });
      window.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointerup', onPointerUp, { capture: true });
      window.removeEventListener('pointercancel', onPointerUp, { capture: true });
      window.removeEventListener('blur', onPointerUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);

  return (
    <div ref={cursorRef} className="cursor" aria-hidden="true">
      <svg viewBox="0 0 22 22" width="22" height="22">
        <path
          d="M.065 1.765C-.268.705.741-.284 1.788.075l19.299 6.624c1.145.393 1.236 1.983.143 2.504l-8.262 3.942a1.5 1.5 0 0 0-.629.62l-3.708 7.484c-.54 1.09-2.129.966-2.495-.195L.064 1.764Z"
          fill="#ee7027"
        />
      </svg>
    </div>
  );
}
