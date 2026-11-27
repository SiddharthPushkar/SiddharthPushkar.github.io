import { useEffect, useRef } from 'react';
import { RouteSlug } from '../routes';

interface HeroCanvasProps {
  onNavigate: (slug: RouteSlug, hash?: string) => void;
}

export function HeroCanvas({ onNavigate }: HeroCanvasProps) {
  const heroRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const box = boxRef.current;
    const layer = layerRef.current;
    const toolbar = toolbarRef.current;
    if (!hero || !box || !layer || !toolbar) return;

    let topZ = 2;
    let tool = 'move';
    let selected: HTMLElement | null = null;
    const history: Array<{ undo: () => boolean | void; redo: () => void }> = [];
    const redoStack: Array<{ undo: () => boolean | void; redo: () => void }> = [];

    const record = (undo: () => boolean | void, redo: () => void) => {
      history.push({ undo, redo });
      redoStack.length = 0;
    };

    const place = (el: HTMLElement, parent: ParentNode, next: ChildNode | null) => {
      parent.insertBefore(el, next && next.parentNode === parent ? next : null);
    };

    const select = (el: HTMLElement | null) => {
      selected?.classList.remove('selected');
      selected = el;
      el?.classList.add('selected');
    };

    interface PenNode {
      x: number;
      y: number;
      ox: number;
      oy: number;
    }

    interface PenState {
      el: HTMLElement;
      path: SVGPathElement;
      preview: SVGPathElement;
      ui: SVGGElement;
      nodes: PenNode[];
      dragging: boolean;
    }

    let pen: PenState | null = null;

    const layerPt = (e: PointerEvent) => {
      const h = layer.getBoundingClientRect();
      return { x: e.clientX - h.left, y: e.clientY - h.top };
    };

    const seg = (a: PenNode, b: PenNode) =>
      ` C${a.x + a.ox} ${a.y + a.oy} ${b.x - b.ox} ${b.y - b.oy} ${b.x} ${b.y}`;

    const penPath = (nodes: PenNode[], closed = false) => {
      let d = `M${nodes[0].x} ${nodes[0].y}`;
      for (let i = 1; i < nodes.length; i++) d += seg(nodes[i - 1], nodes[i]);
      return closed ? d + seg(nodes[nodes.length - 1], nodes[0]) + ' Z' : d;
    };

    const penDraw = (cursorPt?: { x: number; y: number }) => {
      if (!pen) return;
      const { nodes } = pen;
      const last = nodes[nodes.length - 1];
      pen.path.setAttribute('d', penPath(nodes));
      pen.preview.setAttribute(
        'd',
        cursorPt && !pen.dragging
          ? `M${last.x} ${last.y} C${last.x + last.ox} ${last.y + last.oy} ${cursorPt.x} ${cursorPt.y} ${cursorPt.x} ${cursorPt.y}`
          : '',
      );
      pen.ui.innerHTML = nodes
        .map(
          (n, i) =>
            (n.ox || n.oy
              ? `<line x1="${n.x - n.ox}" y1="${n.y - n.oy}" x2="${n.x + n.ox}" y2="${n.y + n.oy}"/>` +
                `<circle cx="${n.x + n.ox}" cy="${n.y + n.oy}" r="3"/><circle cx="${n.x - n.ox}" cy="${n.y - n.oy}" r="3"/>`
              : '') +
            `<rect x="${n.x - 4}" y="${n.y - 4}" width="8" height="8"${i === 0 ? ' class="first"' : ''}/>`,
        )
        .join('');
    };

    const penFinish = (closed = false) => {
      if (!pen) return;
      if (pen.nodes.length < 2) pen.el.remove();
      else {
        pen.path.setAttribute('d', penPath(pen.nodes, closed));
        pen.preview.remove();
        pen.ui.remove();
      }
      pen = null;
    };

    const undo = () => {
      if (pen) {
        if (pen.nodes.length > 1) {
          pen.nodes.pop();
          penDraw();
        } else {
          penFinish();
        }
        return;
      }
      while (history.length) {
        const a = history.pop();
        if (a && a.undo() !== false) {
          redoStack.push(a);
          return;
        }
      }
    };

    const redo = () => {
      penFinish();
      const a = redoStack.pop();
      if (a) {
        a.redo();
        history.push(a);
      }
    };

    const makeDraggable = (el: HTMLElement, onTap?: (e: PointerEvent) => void) => {
      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0 || tool !== 'move' || el.classList.contains('editing')) return;
        e.preventDefault();
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        const sx = e.clientX;
        const sy = e.clientY;
        const dx = parseFloat(el.style.getPropertyValue('--dx')) || 0;
        const dy = parseFloat(el.style.getPropertyValue('--dy')) || 0;
        let moved = false;

        const move = (ev: PointerEvent) => {
          if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return;
          if (!moved) {
            moved = true;
            el.classList.add('in', 'dragging');
            if (el !== toolbar) el.style.zIndex = String(++topZ);
          }
          el.style.setProperty('--dx', `${dx + ev.clientX - sx}px`);
          el.style.setProperty('--dy', `${dy + ev.clientY - sy}px`);
          el.classList.toggle('moved', dx + ev.clientX - sx !== 0 || dy + ev.clientY - sy !== 0);
        };

        const up = (ev: PointerEvent) => {
          el.classList.remove('dragging');
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', up);
          el.removeEventListener('pointercancel', up);
          if (moved) {
            const nx = el.style.getPropertyValue('--dx');
            const ny = el.style.getPropertyValue('--dy');
            const to = (x: string, y: string) => {
              el.style.setProperty('--dx', x);
              el.style.setProperty('--dy', y);
              el.classList.toggle('moved', parseFloat(x) !== 0 || parseFloat(y) !== 0);
            };
            to(nx, ny);
            record(
              () => {
                if (!el.isConnected) return false;
                to(`${dx}px`, `${dy}px`);
              },
              () => to(nx, ny),
            );
          }
          if (!moved && ev.type === 'pointerup') onTap?.(e);
        };

        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
      };

      el.addEventListener('pointerdown', onPointerDown);
    };

    const setTool = (name: string) => {
      if (name !== 'pen') penFinish();
      tool = name;
      toolbar.querySelectorAll<HTMLElement>('.tool').forEach((t) => {
        const on = t.dataset.tool === name;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-pressed', String(on));
      });
      layer.hidden = name === 'move';
      layer.dataset.tool = name;
      if (name !== 'move') select(null);
    };

    Array.from(box.children).forEach((child) => {
      const el = child as HTMLElement;
      makeDraggable(
        el,
        el === toolbar
          ? (e) => {
              const t = (e.target as HTMLElement).closest<HTMLElement>('.tool');
              if (t?.dataset.tool) setTool(t.dataset.tool);
            }
          : () => select(null),
      );
    });

    const onToolbarKeyDown = (e: KeyboardEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('.tool');
      if (t?.dataset.tool && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setTool(t.dataset.tool);
      }
    };
    toolbar.addEventListener('keydown', onToolbarKeyDown);

    const onLayerEnter = () => document.querySelector('.cursor')?.classList.add('hidden');
    const onLayerLeave = () => document.querySelector('.cursor')?.classList.remove('hidden');
    layer.addEventListener('pointerenter', onLayerEnter);
    layer.addEventListener('pointerleave', onLayerLeave);

    const toBox = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const addObj = (cls: string, x: number, y: number) => {
      const el = document.createElement('div');
      el.className = `obj ${cls}`;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.zIndex = String(++topZ);
      box.append(el);
      makeDraggable(el, () => select(el));
      record(
        () => {
          if (!el.isConnected) return false;
          if (selected === el) select(null);
          el.remove();
        },
        () => box.append(el),
      );
      return el;
    };

    const editText = (el: HTMLElement, target: HTMLElement = el) => {
      el.classList.add('editing');
      target.setAttribute('contenteditable', 'plaintext-only');
      target.focus();
      const done = () => {
        target.setAttribute('contenteditable', 'false');
        el.classList.remove('editing');
        if (!target.textContent?.trim()) el.remove();
      };
      const onKey = (e: KeyboardEvent) => {
        if (
          e.key === 'Escape' ||
          (e.key === 'Enter' && !e.shiftKey && el.classList.contains('obj-comment'))
        ) {
          e.preventDefault();
          target.blur();
        }
      };
      target.addEventListener(
        'blur',
        () => {
          target.removeEventListener('keydown', onKey);
          done();
        },
        { once: true },
      );
      target.addEventListener('keydown', onKey);
    };

    const penStart = () => {
      const r = box.getBoundingClientRect();
      const h = layer.getBoundingClientRect();
      const el = addObj('obj-pen', h.left - r.left, h.top - r.top);
      el.style.width = `${h.width}px`;
      el.style.height = `${h.height}px`;
      el.innerHTML =
        '<svg width="100%" height="100%" style="overflow:visible"><path class="stroke"/><path class="preview"/><g class="pen-ui"></g></svg>';
      pen = {
        el,
        path: el.querySelector('.stroke')!,
        preview: el.querySelector('.preview')!,
        ui: el.querySelector('.pen-ui')!,
        nodes: [],
        dragging: false,
      };
    };

    const penDown = (e: PointerEvent) => {
      const p = layerPt(e);
      if (pen) {
        const first = pen.nodes[0];
        const last = pen.nodes[pen.nodes.length - 1];
        if (pen.nodes.length > 2 && Math.hypot(p.x - first.x, p.y - first.y) < 8) {
          penFinish(true);
          return;
        }
        if (Math.hypot(p.x - last.x, p.y - last.y) < 5) {
          penFinish();
          return;
        }
      } else {
        penStart();
      }
      if (!pen) return;
      const n: PenNode = { x: p.x, y: p.y, ox: 0, oy: 0 };
      pen.nodes.push(n);
      pen.dragging = true;
      try {
        layer.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      const move = (ev: PointerEvent) => {
        const q = layerPt(ev);
        n.ox = q.x - n.x;
        n.oy = q.y - n.y;
        if (Math.hypot(n.ox, n.oy) < 3) {
          n.ox = 0;
          n.oy = 0;
        }
        penDraw();
      };
      const up = (ev: PointerEvent) => {
        layer.removeEventListener('pointermove', move);
        layer.removeEventListener('pointerup', up);
        layer.removeEventListener('pointercancel', up);
        if (pen) {
          pen.dragging = false;
          penDraw(layerPt(ev));
        }
      };
      layer.addEventListener('pointermove', move);
      layer.addEventListener('pointerup', up);
      layer.addEventListener('pointercancel', up);
      penDraw();
    };

    const onLayerMove = (e: PointerEvent) => {
      if (tool === 'pen' && pen && !pen.dragging) penDraw(layerPt(e));
    };
    layer.addEventListener('pointermove', onLayerMove);

    const pencilDown = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      const h = layer.getBoundingClientRect();
      const el = addObj('obj-pen', h.left - r.left, h.top - r.top);
      el.style.width = `${h.width}px`;
      el.style.height = `${h.height}px`;
      el.innerHTML =
        '<svg width="100%" height="100%" style="overflow:visible"><path class="stroke"/></svg>';
      const path = el.querySelector('path')!;
      const p = layerPt(e);
      let d = `M${p.x} ${p.y} L${p.x} ${p.y}`;
      let last = p;
      path.setAttribute('d', d);
      try {
        layer.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      const move = (ev: PointerEvent) => {
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
    };

    const onLayerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const tb = toolbar.getBoundingClientRect();
      if (
        e.clientX >= tb.left &&
        e.clientX <= tb.right &&
        e.clientY >= tb.top &&
        e.clientY <= tb.bottom
      ) {
        const t = document
          .elementsFromPoint(e.clientX, e.clientY)
          .find((n) => n.classList?.contains('tool')) as HTMLElement | undefined;
        if (t?.dataset.tool) setTool(t.dataset.tool);
        return;
      }
      e.preventDefault();
      if (tool === 'pen') {
        penDown(e);
        return;
      }
      if (tool === 'pencil') {
        pencilDown(e);
        return;
      }
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
        requestAnimationFrame(() => editText(el, el.querySelector('.bubble') as HTMLElement));
        return;
      }

      try {
        layer.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      const el = addObj(tool === 'frame' ? 'obj-frame' : 'obj-rect', p.x, p.y);
      const move = (ev: PointerEvent) => {
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
        if (el.offsetWidth < 4 && el.offsetHeight < 4) {
          el.style.width = '100px';
          el.style.height = '100px';
        }
        setTool('move');
        select(el);
      };
      layer.addEventListener('pointermove', move);
      layer.addEventListener('pointerup', up);
      layer.addEventListener('pointercancel', up);
    };
    layer.addEventListener('pointerdown', onLayerDown);

    const onDblClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('.obj-text, .obj-comment');
      if (el) editText(el, el.querySelector<HTMLElement>('.bubble') || el);
    };
    box.addEventListener('dblclick', onDblClick);

    const onHeroPointerDown = (e: PointerEvent) => {
      if (tool === 'move' && !(e.target as HTMLElement).closest('.obj')) select(null);
    };
    hero.addEventListener('pointerdown', onHeroPointerDown);

    const keys: Record<string, string> = {
      v: 'move',
      f: 'frame',
      r: 'rect',
      p: 'pen',
      t: 'text',
      c: 'comment',
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable || (target && /INPUT|TEXTAREA/.test(target.tagName))) return;
      const k = e.key.toLowerCase();
      const mod = (e.ctrlKey || e.metaKey) && !e.altKey;
      if (mod && k === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && k === 'y' && !e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (pen && (k === 'enter' || k === 'escape')) {
        e.preventDefault();
        penFinish();
        return;
      }
      if (k === 'p' && e.shiftKey) setTool('pencil');
      else if (keys[k]) setTool(keys[k]);
      else if (k === 'escape') {
        setTool('move');
        select(null);
      } else if ((k === 'delete' || k === 'backspace') && selected) {
        e.preventDefault();
        const el = selected;
        const parent = el.parentNode;
        const next = el.nextSibling;
        el.remove();
        selected = null;
        if (parent) {
          record(
            () => place(el, parent, next),
            () => {
              if (selected === el) select(null);
              el.remove();
            },
          );
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      toolbar.removeEventListener('keydown', onToolbarKeyDown);
      layer.removeEventListener('pointerenter', onLayerEnter);
      layer.removeEventListener('pointerleave', onLayerLeave);
      layer.removeEventListener('pointermove', onLayerMove);
      layer.removeEventListener('pointerdown', onLayerDown);
      box.removeEventListener('dblclick', onDblClick);
      hero.removeEventListener('pointerdown', onHeroPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      document.querySelector('.cursor')?.classList.remove('hidden');
      box.querySelectorAll('.obj').forEach((n) => n.remove());
    };
  }, []);

  return (
    <section ref={heroRef} className="hero">
      <div className="hero-pattern" aria-hidden="true"></div>
      <div ref={boxRef} className="hero-box">
        <span className="pill appear">
          <strong>EXPERIENCE DESIGNER</strong>
        </span>
        <h1 className="headline appear">Designing digital experiences people actually enjoy.</h1>
        <img
          className="avatar appear"
          src="/assets/aistudio/Untitled_Artwork_1_421cb946.png"
          alt="Illustration of Siddharth"
          width={118}
          height={120}
        />
        <img
          className="key key-cmd appear"
          src="/key-cmd.png"
          alt=""
          aria-hidden="true"
          width={54}
          height={55}
        />
        <img
          className="key key-z appear"
          src="/key-z.png"
          alt=""
          aria-hidden="true"
          width={55}
          height={56}
        />
        <p className="note appear">Let’s create something meaningful together!</p>
        <div className="note-arrow appear">
          <svg viewBox="0 0 103.87 33.82" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M 5.294 23.612 C 4.857 23.462 4.377 23.487 3.96 23.685 C 3.543 23.884 3.223 24.238 3.071 24.669 C 2.919 25.099 2.948 25.57 3.152 25.974 C 3.357 26.379 3.72 26.684 4.161 26.825 L 4.161 26.825 C 5.829 27.36 7.574 27.859 9.3 28.304 C 39.458 35.905 77.803 33.205 96.968 6.55 C 98.015 5.115 98.942 3.715 99.86 2.195 C 99.946 2.051 99.97 1.878 99.927 1.716 C 99.884 1.553 99.777 1.413 99.629 1.328 C 99.481 1.242 99.304 1.217 99.136 1.257 C 98.967 1.297 98.822 1.399 98.732 1.542 L 98.732 1.542 C 97.803 3.012 96.867 4.361 95.815 5.741 C 76.658 31.262 39.395 33.099 10.205 25.133 C 8.548 24.67 6.877 24.156 5.294 23.612 Z"
              fill="rgb(0,0,0)"
            />
            <path
              d="M 85.073 4.441 C 84.857 4.506 84.67 4.646 84.555 4.836 C 84.439 5.027 84.405 5.253 84.46 5.465 C 84.514 5.677 84.654 5.861 84.849 5.977 C 85.043 6.092 85.276 6.13 85.498 6.089 L 85.498 6.089 C 85.942 6.006 86.386 5.923 86.829 5.839 C 91.116 5.025 95.377 4.112 99.613 3.102 L 98.023 2.177 C 98.108 2.511 98.193 2.846 98.28 3.18 C 99.106 6.383 100.043 9.56 101.089 12.711 C 101.227 13.128 101.368 13.545 101.511 13.962 C 101.582 14.168 101.726 14.348 101.922 14.458 C 102.117 14.569 102.348 14.602 102.565 14.549 C 102.782 14.496 102.969 14.362 103.089 14.175 C 103.208 13.988 103.247 13.764 103.21 13.55 L 103.21 13.55 C 103.134 13.117 103.056 12.685 102.975 12.254 C 102.37 8.996 101.655 5.766 100.828 2.562 C 100.742 2.228 100.655 1.894 100.568 1.56 C 100.385 0.863 99.697 0.458 98.978 0.635 C 94.749 1.677 90.547 2.817 86.369 4.054 C 85.937 4.182 85.505 4.311 85.073 4.441 Z"
              fill="rgb(0,0,0)"
            />
          </svg>
        </div>
        <div ref={toolbarRef} className="toolbar appear" role="toolbar" aria-label="Design tools">
          <span
            className="tool is-active"
            role="button"
            tabIndex={0}
            data-tool="move"
            aria-label="Move (V)"
            title="Move (V)"
            aria-pressed="true"
          >
            <svg viewBox="0 0 24 24">
              <path
                transform="translate(6.5 6.5)"
                d="M.198.008 11.903 4.356a.15.15 0 0 1-.005.28L6.758 6.241a.8.8 0 0 0-.517.517L4.637 11.897a.15.15 0 0 1-.281.007L.008.198A.15.15 0 0 1 .198.008Z"
                fill="none"
                stroke="#fafafa"
              />
            </svg>
          </span>
          <span
            className="tool"
            role="button"
            tabIndex={0}
            data-tool="frame"
            aria-label="Frame (F)"
            title="Frame (F)"
            aria-pressed="false"
          >
            <svg viewBox="0 0 24 24">
              <g fill="#fff">
                <path
                  transform="translate(6 6)"
                  d="M1.244 1.244V.467C1.244.209 1.453 0 1.711 0h8.711c.258 0 .467.209.467.467v.777h.778c.257 0 .466.21.466.467v8.711a.466.466 0 0 1-.466.467h-.778v.778a.466.466 0 0 1-.467.466H1.711a.466.466 0 0 1-.467-.466v-.778H.467A.466.466 0 0 1 0 10.422V1.711c0-.257.209-.467.467-.467Zm-.311 8.712H1.4a.78.78 0 0 1 .778.777v.467h7.778v-.467a.78.78 0 0 1 .777-.777h.467V2.178h-.467a.78.78 0 0 1-.777-.778V.933H2.178V1.4a.78.78 0 0 1-.778.778H.933Z"
                />
                <path
                  transform="translate(16 5)"
                  d="M2.333 0c.43 0 .778.348.778.778v1.555c0 .43-.348.778-.778.778H.778A.778.778 0 0 1 0 2.333V.778C0 .348.348 0 .778 0Zm-1.4 2.178h1.245V.933H.933Z"
                />
                <path
                  transform="translate(16 16)"
                  d="M2.333 0c.43 0 .778.348.778.778v1.555c0 .43-.348.778-.778.778H.778A.778.778 0 0 1 0 2.333V.778C0 .348.348 0 .778 0Zm-1.4 2.178h1.245V.933H.933Z"
                />
                <path
                  transform="translate(5 5)"
                  d="M2.333 0c.43 0 .778.348.778.778v1.555c0 .43-.348.778-.778.778H.778A.778.778 0 0 1 0 2.333V.778C0 .348.348 0 .778 0Zm-1.4 2.178h1.245V.933H.933Z"
                />
                <path
                  transform="translate(5 16)"
                  d="M2.333 0c.43 0 .778.348.778.778v1.555c0 .43-.348.778-.778.778H.778A.778.778 0 0 1 0 2.333V.778C0 .348.348 0 .778 0Zm-1.4 2.178h1.245V.933H.933Z"
                />
              </g>
            </svg>
          </span>
          <span
            className="tool"
            role="button"
            tabIndex={0}
            data-tool="rect"
            aria-label="Rectangle (R)"
            title="Rectangle (R)"
            aria-pressed="false"
          >
            <svg viewBox="0 0 24 24">
              <path
                transform="translate(5 5)"
                fill="#fff"
                d="M11.813 0H2.188A2.19 2.19 0 0 0 0 2.188v9.625C0 13.019.981 14 2.188 14h9.625A2.19 2.19 0 0 0 14 11.813V2.188A2.19 2.19 0 0 0 11.813 0Zm1.093 11.812c0 .604-.49 1.094-1.094 1.094H2.187c-.603 0-1.093-.49-1.093-1.094V2.187c0-.603.49-1.093 1.093-1.093h9.625c.604 0 1.094.49 1.094 1.093Z"
              />
            </svg>
          </span>
          <span
            className="tool"
            role="button"
            tabIndex={0}
            data-tool="pen"
            aria-label="Pen (P)"
            title="Pen (P)"
            aria-pressed="false"
          >
            <svg viewBox="0 0 24 24">
              <g fill="none" stroke="#fff">
                <path
                  transform="translate(13.5 13.5)"
                  d="M.14 3.754 3.753.14a.48.48 0 0 1 .677 0l.843.842a.5.5 0 0 1 0 .708L1.689 5.273a.5.5 0 0 1-.707 0L.14 4.43a.48.48 0 0 1 0-.676Z"
                />
                <path
                  transform="translate(5.5 5.5)"
                  d="M.962.228A.78.78 0 0 1 1.754.038l7.383 2.378c.558.18.96.669 1.029 1.251l.3 2.532c.054.456-.104.912-.429 1.237l-2.6 2.601a1.5 1.5 0 0 1-1.237.428l-2.532-.3a1.5 1.5 0 0 1-1.251-1.029L.038 1.754A.78.78 0 0 1 .738.739a.78.78 0 0 1 .224-.511ZM4.49 4.689a.71.71 0 0 0 .083.894.71.71 0 0 0 1.003-.008.71.71 0 0 0 .008-1.003.71.71 0 0 0-.894-.083l-.12.08Z"
                />
                <path transform="translate(6 6)" d="m0 0 5 5" />
              </g>
            </svg>
          </span>
          <span
            className="tool"
            role="button"
            tabIndex={0}
            data-tool="pencil"
            aria-label="Pencil (Shift+P)"
            title="Pencil (Shift+P)"
            aria-pressed="false"
          >
            <svg viewBox="0 0 24 24">
              <g fill="none" stroke="#fff" strokeLinejoin="round">
                <path d="M6.5 17.5l.8-3.3 8.3-8.3a1.4 1.4 0 0 1 2 0l.5.5a1.4 1.4 0 0 1 0 2l-8.3 8.3Z" />
                <path d="m14.4 7.1 2.5 2.5" />
              </g>
            </svg>
          </span>
          <span
            className="tool"
            role="button"
            tabIndex={0}
            data-tool="text"
            aria-label="Text (T)"
            title="Text (T)"
            aria-pressed="false"
          >
            <svg viewBox="0 0 24 24">
              <path
                transform="translate(6 5)"
                fill="#fff"
                d="M4 13h1.5V1H1v2.5H0V0h12v3.5h-1.004V1H6.5v12H8v1H4Z"
              />
            </svg>
          </span>
          <span
            className="tool"
            role="button"
            tabIndex={0}
            data-tool="comment"
            aria-label="Comment (C)"
            title="Comment (C)"
            aria-pressed="false"
          >
            <svg viewBox="0 0 24 24">
              <path
                transform="translate(5.5 5.5)"
                fill="none"
                stroke="#fff"
                d="M5.231.125a6.5 6.5 0 0 1 7.767 6.375 6.4 6.4 0 0 1-.543 2.597l-.06.138.025.148.578 3.455a.14.14 0 0 1-.148.162l-3.469-.579-.148-.025-.136.061a6.4 6.4 0 0 1-2.596.543 6.5 6.5 0 1 1-1.27-12.875Z"
              />
            </svg>
          </span>
        </div>
      </div>
      <div ref={layerRef} className="draw-layer" hidden></div>
      <a
        href="#work"
        className="down"
        aria-label="Scroll to projects"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M7 18V0M7 18 0 11M7 18l7-7"
            transform="translate(5 3)"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
      <a
        href="/playground"
        className="playground-float appear arrow-link"
        draggable={false}
        aria-label="Open interactive Playground"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('playground');
        }}
      >
        <span className="pg-float-art" aria-hidden="true">
          <img
            src="/src/assets/images/playground_studio_icon_1795514416842.jpg"
            alt=""
            width={40}
            height={40}
            draggable={false}
            referrerPolicy="no-referrer"
          />
        </span>
        <span className="pg-float-label">Playground</span>
        <span className="pg-float-arrow" aria-hidden="true">
          <i className="arr"></i>
        </span>
      </a>
      <svg className="svg-defs" aria-hidden="true" focusable="false">
        <defs>
          <StickerFilter id="avatar-sticker" radius={4.5} />
          <StickerFilter id="avatar-sticker-lg" radius={6.2} />
        </defs>
      </svg>
    </section>
  );
}

function StickerFilter({ id, radius }: { id: string; radius: number }) {
  const inner = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    return {
      key: `i${i}`,
      dx: +(radius * 0.5 * Math.cos(angle)).toFixed(2),
      dy: +(radius * 0.5 * Math.sin(angle)).toFixed(2),
    };
  });
  const outer = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * Math.PI) / 8;
    return {
      key: `o${i}`,
      dx: +(radius * Math.cos(angle)).toFixed(2),
      dy: +(radius * Math.sin(angle)).toFixed(2),
    };
  });
  const rings = [...inner, ...outer];

  return (
    <filter
      id={id}
      x="-35%"
      y="-35%"
      width="170%"
      height="170%"
      colorInterpolationFilters="sRGB"
    >
      {rings.map(({ key, dx, dy }) => (
        <feOffset key={key} in="SourceAlpha" dx={dx} dy={dy} result={key} />
      ))}
      <feMerge result="dilated">
        <feMergeNode in="SourceAlpha" />
        {rings.map(({ key }) => (
          <feMergeNode key={key} in={key} />
        ))}
      </feMerge>
      <feGaussianBlur in="dilated" stdDeviation="1.2" result="haloBlur" />
      <feFlood floodColor="#000000" floodOpacity="0.15" result="haloColor" />
      <feComposite in="haloColor" in2="haloBlur" operator="in" result="haloShadow" />
      <feGaussianBlur in="dilated" stdDeviation="3.5" result="liftBlur" />
      <feOffset in="liftBlur" dx="0" dy="2" result="liftOffset" />
      <feFlood floodColor="#000000" floodOpacity="0.1" result="liftColor" />
      <feComposite in="liftColor" in2="liftOffset" operator="in" result="liftShadow" />
      <feFlood floodColor="#ffffff" result="white" />
      <feComposite in="white" in2="dilated" operator="in" result="outline" />
      <feMerge>
        <feMergeNode in="liftShadow" />
        <feMergeNode in="haloShadow" />
        <feMergeNode in="outline" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}
