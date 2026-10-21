// Hero: a tiny design canvas — drag anything, and use the toolbar to draw
const box = document.querySelector('.hero-box');
const layer = document.querySelector('.draw-layer');
const toolbar = document.querySelector('.toolbar');
let topZ = 2, tool = 'move', selected = null;

// Undo / redo history: each entry is { undo, redo }; undo returns false if there was nothing left to revert
const history = [], redoStack = [];
const record = (undo, redo) => { history.push({ undo, redo }); redoStack.length = 0; };
const place = (el, parent, next) => parent.insertBefore(el, next?.parentNode === parent ? next : null);
function undo() {
  if (pen) {   // mid-path: drop the last point, like Figma
    if (pen.nodes.length > 1) { pen.nodes.pop(); penDraw(); } else penFinish();
    return;
  }
  while (history.length) {
    const a = history.pop();
    if (a.undo() !== false) { redoStack.push(a); return; }
  }
}
function redo() {
  penFinish();
  const a = redoStack.pop();
  if (a) { a.redo(); history.push(a); }
}

const select = el => {
  selected?.classList.remove('selected');
  selected = el;
  el?.classList.add('selected');
};

// Drag with a small threshold, so a plain click can still select or pick a tool
function makeDraggable(el, onTap) {
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0 || tool !== 'move' || el.classList.contains('editing')) return;
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch {}
    const sx = e.clientX, sy = e.clientY;
    const dx = parseFloat(el.style.getPropertyValue('--dx')) || 0;
    const dy = parseFloat(el.style.getPropertyValue('--dy')) || 0;
    let moved = false;
    const move = ev => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return;
      if (!moved) {
        moved = true;
        el.classList.add('in', 'dragging');
        if (el !== toolbar) el.style.zIndex = ++topZ;
      }
      el.style.setProperty('--dx', `${dx + ev.clientX - sx}px`);
      el.style.setProperty('--dy', `${dy + ev.clientY - sy}px`);
      el.classList.toggle('moved', dx + ev.clientX - sx !== 0 || dy + ev.clientY - sy !== 0);
    };
    const up = ev => {
      el.classList.remove('dragging');
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      if (moved) {
        const nx = el.style.getPropertyValue('--dx'), ny = el.style.getPropertyValue('--dy');
        // .moved = off its original spot (the avatar drops its hover zoom then)
        const to = (x, y) => {
          el.style.setProperty('--dx', x);
          el.style.setProperty('--dy', y);
          el.classList.toggle('moved', parseFloat(x) !== 0 || parseFloat(y) !== 0);
        };
        to(nx, ny);
        record(() => { if (!el.isConnected) return false; to(`${dx}px`, `${dy}px`); }, () => to(nx, ny));
      }
      if (!moved && ev.type === 'pointerup') onTap?.(e);   // use the press target: capture retargets pointerup
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });
}

[...box.children].forEach(el => makeDraggable(el, el === toolbar
  ? e => { const t = e.target.closest('.tool'); if (t) setTool(t.dataset.tool); }
  : () => select(null)));

function setTool(name) {
  if (name !== 'pen') penFinish();
  tool = name;
  toolbar.querySelectorAll('.tool').forEach(t => {
    const on = t.dataset.tool === name;
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-pressed', on);
  });
  layer.hidden = name === 'move';
  layer.dataset.tool = name;
  if (name !== 'move') select(null);
}
toolbar.addEventListener('keydown', e => {
  const t = e.target.closest('.tool');
  if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setTool(t.dataset.tool); }
});

// The orange arrow cursor gives way to a crosshair / text cursor while drawing
layer.addEventListener('pointerenter', () => cursor.classList.add('hidden'));
layer.addEventListener('pointerleave', () => cursor.classList.remove('hidden'));

// Objects live inside .hero-box, so convert page coordinates to box coordinates
const toBox = e => { const r = box.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
function addObj(cls, x, y) {
  const el = document.createElement('div');
  el.className = `obj ${cls}`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.zIndex = ++topZ;
  box.append(el);
  makeDraggable(el, () => select(el));
  record(() => {
    if (!el.isConnected) return false;   // e.g. an empty text box that already removed itself
    if (selected === el) select(null);
    el.remove();
  }, () => box.append(el));
  return el;
}
function editText(el, target = el) {
  el.classList.add('editing');
  target.contentEditable = 'plaintext-only';
  target.focus();
  const done = () => {
    target.contentEditable = 'false';
    el.classList.remove('editing');
    if (!target.textContent.trim()) el.remove();
  };
  target.addEventListener('blur', done, { once: true });
  target.addEventListener('keydown', e => {
    if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey && el.classList.contains('obj-comment'))) {
      e.preventDefault();
      target.blur();
    }
  });
}

// Pen = vector pen (like Figma): click for corner points, click-drag for curve handles,
// click the first point to close, Enter / Esc / double-click to finish an open path
let pen = null;
const layerPt = e => { const h = layer.getBoundingClientRect(); return { x: e.clientX - h.left, y: e.clientY - h.top }; };
const seg = (a, b) => ` C${a.x + a.ox} ${a.y + a.oy} ${b.x - b.ox} ${b.y - b.oy} ${b.x} ${b.y}`;
function penPath(nodes, closed) {
  let d = `M${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) d += seg(nodes[i - 1], nodes[i]);
  return closed ? d + seg(nodes.at(-1), nodes[0]) + ' Z' : d;
}
function penDraw(cursorPt) {
  const { nodes } = pen, last = nodes.at(-1);
  pen.path.setAttribute('d', penPath(nodes));
  pen.preview.setAttribute('d', cursorPt && !pen.dragging
    ? `M${last.x} ${last.y} C${last.x + last.ox} ${last.y + last.oy} ${cursorPt.x} ${cursorPt.y} ${cursorPt.x} ${cursorPt.y}` : '');
  pen.ui.innerHTML = nodes.map((n, i) => ((n.ox || n.oy)
    ? `<line x1="${n.x - n.ox}" y1="${n.y - n.oy}" x2="${n.x + n.ox}" y2="${n.y + n.oy}"/>` +
      `<circle cx="${n.x + n.ox}" cy="${n.y + n.oy}" r="3"/><circle cx="${n.x - n.ox}" cy="${n.y - n.oy}" r="3"/>`
    : '') + `<rect x="${n.x - 4}" y="${n.y - 4}" width="8" height="8"${i === 0 ? ' class="first"' : ''}/>`).join('');
}
function penStart() {
  const r = box.getBoundingClientRect(), h = layer.getBoundingClientRect();
  const el = addObj('obj-pen', h.left - r.left, h.top - r.top);
  el.style.width = `${h.width}px`;
  el.style.height = `${h.height}px`;
  el.innerHTML = '<svg width="100%" height="100%" style="overflow:visible"><path class="stroke"/><path class="preview"/><g class="pen-ui"></g></svg>';
  pen = { el, path: el.querySelector('.stroke'), preview: el.querySelector('.preview'), ui: el.querySelector('.pen-ui'), nodes: [], dragging: false };
}
function penFinish(closed = false) {
  if (!pen) return;
  if (pen.nodes.length < 2) pen.el.remove();
  else { pen.path.setAttribute('d', penPath(pen.nodes, closed)); pen.preview.remove(); pen.ui.remove(); }
  pen = null;
}
function penDown(e) {
  const p = layerPt(e);
  if (pen) {
    const first = pen.nodes[0], last = pen.nodes.at(-1);
    if (pen.nodes.length > 2 && Math.hypot(p.x - first.x, p.y - first.y) < 8) return penFinish(true);
    if (Math.hypot(p.x - last.x, p.y - last.y) < 5) return penFinish();   // double-click / click last point
  } else penStart();
  const n = { x: p.x, y: p.y, ox: 0, oy: 0 };
  pen.nodes.push(n);
  pen.dragging = true;
  try { layer.setPointerCapture(e.pointerId); } catch {}
  const move = ev => {
    const q = layerPt(ev);
    n.ox = q.x - n.x; n.oy = q.y - n.y;
    if (Math.hypot(n.ox, n.oy) < 3) n.ox = n.oy = 0;
    penDraw();
  };
  const up = ev => {
    layer.removeEventListener('pointermove', move);
    layer.removeEventListener('pointerup', up);
    layer.removeEventListener('pointercancel', up);
    if (pen) { pen.dragging = false; penDraw(layerPt(ev)); }
  };
  layer.addEventListener('pointermove', move);
  layer.addEventListener('pointerup', up);
  layer.addEventListener('pointercancel', up);
  penDraw();
}
layer.addEventListener('pointermove', e => { if (tool === 'pen' && pen && !pen.dragging) penDraw(layerPt(e)); });

// Pencil = freehand: press and drag to sketch a stroke; the tool stays on for the next one
function pencilDown(e) {
  const r = box.getBoundingClientRect(), h = layer.getBoundingClientRect();
  const el = addObj('obj-pen', h.left - r.left, h.top - r.top);
  el.style.width = `${h.width}px`;
  el.style.height = `${h.height}px`;
  el.innerHTML = '<svg width="100%" height="100%" style="overflow:visible"><path class="stroke"/></svg>';
  const path = el.querySelector('path'), p = layerPt(e);
  let d = `M${p.x} ${p.y} L${p.x} ${p.y}`, last = p;
  path.setAttribute('d', d);
  try { layer.setPointerCapture(e.pointerId); } catch {}
  const move = ev => {
    const q = layerPt(ev);
    if (Math.hypot(q.x - last.x, q.y - last.y) < 1.5) return;
    d += ` L${q.x} ${q.y}`;
    last = q;
    path.setAttribute('d', d);
  };
  const up = () => {
    layer.removeEventListener('pointermove', move);
    layer.removeEventListener('pointerup', up);
    layer.removeEventListener('pointercancel', up);
  };
  layer.addEventListener('pointermove', move);
  layer.addEventListener('pointerup', up);
  layer.addEventListener('pointercancel', up);
}

layer.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  // The toolbar sits underneath the layer: clicks on it should still pick tools
  const tb = toolbar.getBoundingClientRect();
  if (e.clientX >= tb.left && e.clientX <= tb.right && e.clientY >= tb.top && e.clientY <= tb.bottom) {
    const t = document.elementsFromPoint(e.clientX, e.clientY).find(n => n.classList?.contains('tool'));
    if (t) setTool(t.dataset.tool);
    return;
  }
  e.preventDefault();
  if (tool === 'pen') return penDown(e);
  if (tool === 'pencil') return pencilDown(e);
  const p = toBox(e);

  if (tool === 'text') {
    const el = addObj('obj-text', p.x, p.y - 16);
    setTool('move');
    requestAnimationFrame(() => editText(el));
    return;
  }
  if (tool === 'comment') {
    const el = addObj('obj-comment', p.x, p.y - 32);
    el.innerHTML = '<span class="pin">SP</span><div class="bubble"></div>';
    setTool('move');
    requestAnimationFrame(() => editText(el, el.querySelector('.bubble')));
    return;
  }

  // Frame / Rectangle: drag out the shape
  try { layer.setPointerCapture(e.pointerId); } catch {}
  const el = addObj(tool === 'frame' ? 'obj-frame' : 'obj-rect', p.x, p.y);
  const move = ev => {
    const q = toBox(ev);
    el.style.left = `${Math.min(p.x, q.x)}px`;
    el.style.top = `${Math.min(p.y, q.y)}px`;
    el.style.width = `${Math.abs(q.x - p.x)}px`;
    el.style.height = `${Math.abs(q.y - p.y)}px`;
  };
  const up = () => {
    layer.removeEventListener('pointermove', move);
    layer.removeEventListener('pointerup', up);
    layer.removeEventListener('pointercancel', up);
    if (el.offsetWidth < 4 && el.offsetHeight < 4) el.style.width = el.style.height = '100px';   // a click makes 100×100
    setTool('move');
    select(el);
  };
  layer.addEventListener('pointermove', move);
  layer.addEventListener('pointerup', up);
  layer.addEventListener('pointercancel', up);
});

// Double-click a text or comment to edit it again
box.addEventListener('dblclick', e => {
  const el = e.target.closest('.obj-text, .obj-comment');
  if (el) editText(el, el.querySelector('.bubble') || el);
});
// Click empty space to deselect
document.querySelector('.hero').addEventListener('pointerdown', e => {
  if (tool === 'move' && !e.target.closest('.obj')) select(null);
});

// Shortcuts: V F R P T C pick tools (Shift+P = Pencil), Esc returns to Move, Delete removes the selection,
// Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z or Ctrl+Y redoes
const keys = { v: 'move', f: 'frame', r: 'rect', p: 'pen', t: 'text', c: 'comment' };
addEventListener('keydown', e => {
  if (e.target.isContentEditable || /INPUT|TEXTAREA/.test(e.target.tagName)) return;   // native undo while typing
  const k = e.key.toLowerCase(), mod = (e.ctrlKey || e.metaKey) && !e.altKey;
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k === 'y' && !e.shiftKey) { e.preventDefault(); redo(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (pen && (k === 'enter' || k === 'escape')) { e.preventDefault(); penFinish(); return; }
  if (k === 'p' && e.shiftKey) setTool('pencil');
  else if (keys[k]) setTool(keys[k]);
  else if (k === 'escape') { setTool('move'); select(null); }
  else if ((k === 'delete' || k === 'backspace') && selected) {
    e.preventDefault();
    const el = selected, parent = el.parentNode, next = el.nextSibling;
    el.remove();
    selected = null;
    record(() => place(el, parent, next), () => { if (selected === el) select(null); el.remove(); });
  }
});
