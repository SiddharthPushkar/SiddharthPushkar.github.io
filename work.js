// Design-canvas behaviour: drag cards, drag empty space to pan, wheel to pan, ctrl/cmd+wheel or pinch to zoom.
(() => {
  const wrap = document.querySelector('.board-wrap');
  const board = document.querySelector('.board');
  const grid = document.querySelector('.board-grid');
  const zoomLabel = document.querySelector('[data-zoom]');
  const cards = [...board.querySelectorAll('.pcard')];
  let tx = 0, ty = 0, scale = 1, z = 1;

  const apply = () => {
    board.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
    grid.style.backgroundPosition = `${tx}px ${ty}px`;
    grid.style.backgroundSize = `${28 * scale}px ${28 * scale}px`;
    zoomLabel.textContent = Math.round(scale * 100) + '%';
  };

  function fit() {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    board.querySelectorAll('.board-title,.pcard,.frame').forEach(el => {
      x0 = Math.min(x0, el.offsetLeft); y0 = Math.min(y0, el.offsetTop - 30);
      x1 = Math.max(x1, el.offsetLeft + el.offsetWidth); y1 = Math.max(y1, el.offsetTop + el.offsetHeight);
    });
    const pad = 70, W = innerWidth, H = innerHeight - 40;
    scale = Math.min(1, (W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0));
    tx = (W - (x1 - x0) * scale) / 2 - x0 * scale;
    ty = (H - (y1 - y0) * scale) / 2 - y0 * scale + 20;
    apply();
  }

  function zoomAt(f, cx, cy) {
    const ns = Math.min(2, Math.max(.2, scale * f));
    tx = cx - (cx - tx) * (ns / scale); ty = cy - (cy - ty) * (ns / scale); scale = ns; apply();
  }

  wrap.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
    else { tx -= e.deltaX; ty -= e.deltaY; apply(); }
  }, { passive: false });

  let mode = null, sx, sy, ox, oy, card, moved = false;
  wrap.addEventListener('pointerdown', e => {
    card = e.target.closest('.pcard');
    sx = e.clientX; sy = e.clientY; moved = false;
    cards.forEach(c => c.classList.remove('sel'));
    if (card) { mode = 'card'; ox = card.offsetLeft; oy = card.offsetTop; card.classList.add('sel'); card.style.zIndex = ++z; }
    else { mode = 'pan'; ox = tx; oy = ty; }
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', e => {
    if (!mode) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    if (mode === 'pan') { tx = ox + dx; ty = oy + dy; apply(); }
    else if (moved) { card.classList.add('drag'); card.style.left = ox + dx / scale + 'px'; card.style.top = oy + dy / scale + 'px'; }
  });
  const end = () => {
    if (mode === 'card' && card) {
      card.classList.remove('drag');
      if (!moved) location.href = card.dataset.href; // a click (not a drag) opens the case study
    }
    mode = null;
  };
  wrap.addEventListener('pointerup', end);
  wrap.addEventListener('pointercancel', end);

  document.querySelector('[data-zin]').onclick = () => zoomAt(1.2, innerWidth / 2, innerHeight / 2);
  document.querySelector('[data-zout]').onclick = () => zoomAt(1 / 1.2, innerWidth / 2, innerHeight / 2);
  document.querySelector('[data-fit]').onclick = fit;
  addEventListener('resize', fit);
  addEventListener('keydown', e => { if (e.key === '0' || e.key === '1') fit(); });
  fit();
})();
