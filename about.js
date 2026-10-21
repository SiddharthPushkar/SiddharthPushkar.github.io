// About page: the photo is a selected frame on a canvas — drag it to move, drag a corner handle to scale it
// (proportional, anchored at the opposite corner, like Shift-resizing in Figma)
const frame = document.querySelector('.sel-frame');
const mover = frame?.querySelector('.sel-move');
const shot = mover?.querySelector('.sel-box');

if (mover) {
  const MIN_W = 120, MAX_W = 960;
  let x = 0, y = 0;
  const place = () => { mover.style.setProperty('--dx', `${x}px`); mover.style.setProperty('--dy', `${y}px`); };

  // The first time it's touched, keep its spot in the layout and let the frame float above it,
  // so scaling the photo never pushes the text next to it around
  function float() {
    if (mover.classList.contains('floating')) return;
    frame.style.width = `${frame.offsetWidth}px`;
    frame.style.height = `${frame.offsetHeight}px`;
    mover.style.width = `${mover.offsetWidth}px`;
    mover.classList.add('floating');
  }

  function track(e, onMove) {
    e.preventDefault();
    e.stopPropagation();
    float();
    try { e.target.setPointerCapture(e.pointerId); } catch {}
    mover.classList.add('dragging');
    const sx = e.clientX, sy = e.clientY;
    const move = ev => onMove(ev.clientX - sx, ev.clientY - sy);
    const up = () => {
      mover.classList.remove('dragging');
      e.target.removeEventListener('pointermove', move);
      e.target.removeEventListener('pointerup', up);
      e.target.removeEventListener('pointercancel', up);
    };
    e.target.addEventListener('pointermove', move);
    e.target.addEventListener('pointerup', up);
    e.target.addEventListener('pointercancel', up);
  }

  // Move: drag anywhere on the frame except a handle
  mover.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.classList.contains('h')) return;
    const x0 = x, y0 = y;
    track(e, (dx, dy) => { x = x0 + dx; y = y0 + dy; place(); });
  });

  // Scale: corner handles; the photo keeps its 4:5 shape
  mover.querySelectorAll('.h').forEach(h => h.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const sxSign = h.classList.contains('tl') || h.classList.contains('bl') ? -1 : 1;
    const sySign = h.classList.contains('tl') || h.classList.contains('tr') ? -1 : 1;
    const x0 = x, y0 = y, w0 = shot.offsetWidth, ratio = shot.offsetHeight / w0;
    track(e, (dx, dy) => {
      const a = dx * sxSign, b = dy * sySign / ratio;   // grow along whichever axis moved further
      const w = Math.min(MAX_W, Math.max(MIN_W, w0 + (Math.abs(a) > Math.abs(b) ? a : b)));
      mover.style.width = `${w}px`;
      // Left / top handles: shift the frame so the opposite corner stays put
      x = sxSign < 0 ? x0 + (w0 - w) : x0;
      y = sySign < 0 ? y0 + (w0 - w) * ratio : y0;
      place();
    });
  }));
}
