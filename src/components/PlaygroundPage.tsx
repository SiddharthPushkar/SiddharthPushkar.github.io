import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Hand,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  StickyNote as StickyNoteIcon,
  X,
} from 'lucide-react';
import { RouteSlug } from '../routes';

interface PlaygroundPageProps {
  onNavigate?: (slug: RouteSlug, hash?: string) => void;
}

type CanvasTool = 'select' | 'hand';

interface StickyColor {
  id: string;
  label: string;
  bg: string;
  dot: string;
}

const STICKY_COLORS: StickyColor[] = [
  { id: 'yellow', label: 'Butter yellow', bg: '#fff3a3', dot: '#f5d742' },
  { id: 'peach', label: 'Warm peach', bg: '#ffd9c2', dot: '#f08a5d' },
  { id: 'blue', label: 'Sky blue', bg: '#d6ecff', dot: '#5aa9ff' },
  { id: 'mint', label: 'Soft mint', bg: '#d4f5e2', dot: '#4cc786' },
  { id: 'lilac', label: 'Soft lilac', bg: '#e8dfff', dot: '#a382f5' },
];

type BoardNode =
  | {
      kind: 'project';
      id: number;
      slug: RouteSlug;
      category: string;
      title: string;
      image: string;
      x: number;
      y: number;
      rotate: number;
      z: number;
    }
  | {
      kind: 'sticky';
      id: number;
      text: string;
      author: string;
      x: number;
      y: number;
      rotate: number;
      bg: string;
      z: number;
    };

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;

// World coordinates centered around (0, 0) with generous spacing so cards never collide
const INITIAL_NODES: BoardNode[] = [
  {
    kind: 'project',
    id: 1,
    slug: 'full-body-test',
    category: 'Healthcare Fintech',
    title: 'Full Body Test',
    image: 'https://framerusercontent.com/images/sBS6Wjn5BVPTfCNMcO3PNYbqJIQ.png?scale-down-to=1024',
    x: -460,
    y: -255,
    rotate: -1.1,
    z: 1,
  },
  {
    kind: 'project',
    id: 2,
    slug: 'ai-report-analysis',
    category: 'Healthcare Fintech',
    title: 'AI Report Analysis',
    image: 'https://framerusercontent.com/images/4iFJlkGc5Fi501XhnyCWqYExdA.png?scale-down-to=1024',
    x: -135,
    y: -265,
    rotate: 0.7,
    z: 2,
  },
  {
    kind: 'project',
    id: 3,
    slug: 'welup',
    category: 'Healthcare Fintech',
    title: 'welUp',
    image: 'https://framerusercontent.com/images/PimddrN4GK3qe2riUvfyat9Q0.png?scale-down-to=1024',
    x: 190,
    y: -250,
    rotate: 1.2,
    z: 3,
  },
  {
    kind: 'project',
    id: 4,
    slug: 'budgetin',
    category: 'Product Design',
    title: 'BudgetIn',
    image: 'https://framerusercontent.com/images/8SJpoqLE8AO1Eq3CVBAmNe43c.webp?width=1024',
    x: -455,
    y: 45,
    rotate: 0.9,
    z: 4,
  },
  {
    kind: 'project',
    id: 5,
    slug: 'zenze',
    category: 'UI/UX Design',
    title: 'Zenze',
    image: 'https://framerusercontent.com/images/0tcuc9aiu6Iw0ZXOJKgJygf854.png',
    x: -135,
    y: 55,
    rotate: -0.8,
    z: 5,
  },
  {
    kind: 'project',
    id: 6,
    slug: 'adhd-college-framework',
    category: 'UX Design',
    title: 'ADHD College Framework',
    image: 'https://framerusercontent.com/images/QBU9mT9vc5vOdG108tTwPiUYXh4.png?scale-down-to=1024',
    x: 190,
    y: 45,
    rotate: -1.1,
    z: 6,
  },
  {
    kind: 'sticky',
    id: 7,
    text: 'Click any card to\nopen the project,\nor drag them around!',
    author: 'sid',
    x: -710,
    y: -115,
    rotate: -2.8,
    bg: '#fff3a3',
    z: 7,
  },
  {
    kind: 'sticky',
    id: 8,
    text: 'Pan anywhere on the\ncanvas or double-click\nto add a sticky note.',
    author: 'sid',
    x: 505,
    y: -95,
    rotate: 2.4,
    bg: '#ffd9c2',
    z: 8,
  },
];

function getCenteredCamera(width: number, height: number): Camera {
  const initialZoom = width < 768 ? 0.56 : width < 1280 ? 0.8 : 0.9;
  return {
    x: Math.round(width / 2),
    y: Math.round(height / 2 + 18),
    zoom: initialZoom,
  };
}

export function PlaygroundPage({ onNavigate }: PlaygroundPageProps) {
  const canvasRef = useRef<HTMLElement>(null);
  const [camera, setCamera] = useState<Camera>(() =>
    getCenteredCamera(
      typeof window !== 'undefined' ? window.innerWidth : 1280,
      typeof window !== 'undefined' ? window.innerHeight : 760,
    ),
  );
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const [tool, setTool] = useState<CanvasTool>('select');
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [nodes, setNodes] = useState<BoardNode[]>(INITIAL_NODES);
  const [activeColor, setActiveColor] = useState<string>(STICKY_COLORS[0].bg);

  const nextIdRef = useRef(INITIAL_NODES.length + 1);
  const topZRef = useRef(INITIAL_NODES.length + 1);

  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{
    dist: number;
    midX: number;
    midY: number;
    cam: Camera;
  } | null>(null);

  const panStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    camX: number;
    camY: number;
  } | null>(null);

  const nodeDragRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const effectiveHand = tool === 'hand' || spaceHeld;

  const goToProject = useCallback(
    (slug: RouteSlug) => {
      if (onNavigate) {
        onNavigate(slug);
      } else {
        window.location.href = `/${slug}`;
      }
    },
    [onNavigate],
  );

  const focusNoteTextarea = useCallback((id: number) => {
    requestAnimationFrame(() => {
      const ta = canvasRef.current?.querySelector<HTMLTextAreaElement>(
        `textarea[data-note-id="${id}"]`,
      );
      ta?.focus();
    });
  }, []);

  const addNoteAtWorld = useCallback(
    (wx?: number, wy?: number, bgColor?: string) => {
      const canvas = canvasRef.current;
      const cw = canvas?.clientWidth || window.innerWidth;
      const ch = canvas?.clientHeight || window.innerHeight;
      const cam = cameraRef.current;

      const id = nextIdRef.current++;
      const z = topZRef.current++;
      const jitterX = ((id * 59) % 120) - 60;
      const jitterY = ((id * 41) % 90) - 45;

      const viewCenterX = (cw / 2 - cam.x) / cam.zoom;
      const viewCenterY = (ch / 2 - cam.y) / cam.zoom;

      const x = Math.round((wx !== undefined ? wx : viewCenterX + jitterX) - 105);
      const y = Math.round((wy !== undefined ? wy : viewCenterY + jitterY) - 98);
      const rotate = ((id % 5) - 2) * 1.4;

      setNodes((prev) => [
        ...prev,
        {
          kind: 'sticky',
          id,
          text: '',
          author: 'you',
          x,
          y,
          rotate,
          bg: bgColor || activeColor,
          z,
        },
      ]);
      setTool('select');
      focusNoteTextarea(id);
    },
    [activeColor, focusNoteTextarea],
  );

  const zoomAtPoint = useCallback((nextZoomRaw: number, screenX: number, screenY: number) => {
    setCamera((prev) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoomRaw));
      if (nextZoom === prev.zoom) return prev;
      const worldX = (screenX - prev.x) / prev.zoom;
      const worldY = (screenY - prev.y) / prev.zoom;
      return {
        zoom: nextZoom,
        x: screenX - worldX * nextZoom,
        y: screenY - worldY * nextZoom,
      };
    });
  }, []);

  const zoomByStep = useCallback(
    (factor: number) => {
      const canvas = canvasRef.current;
      const cx = (canvas?.clientWidth || window.innerWidth) / 2;
      const cy = (canvas?.clientHeight || window.innerHeight) / 2;
      zoomAtPoint(cameraRef.current.zoom * factor, cx, cy);
    },
    [zoomAtPoint],
  );

  const recenterView = useCallback(() => {
    const canvas = canvasRef.current;
    const cw = canvas?.clientWidth || window.innerWidth;
    const ch = canvas?.clientHeight || window.innerHeight;
    setCamera(getCenteredCamera(cw, ch));
  }, []);

  const resetBoard = useCallback(() => {
    nextIdRef.current = INITIAL_NODES.length + 1;
    topZRef.current = INITIAL_NODES.length + 1;
    setNodes(INITIAL_NODES);
    recenterView();
  }, [recenterView]);

  // Wheel panning (every direction) + Ctrl/Cmd/Pinch zooming anchored to cursor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = canvas.getBoundingClientRect();
        const factor = Math.exp(-e.deltaY * 0.008);
        zoomAtPoint(
          cameraRef.current.zoom * factor,
          e.clientX - rect.left,
          e.clientY - rect.top,
        );
      } else {
        setCamera((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [zoomAtPoint]);

  // Keyboard shortcuts (Space to pan, V select, H hand, S/N sticky, +/- zoom, 0 recenter)
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return Boolean(el && (/INPUT|TEXTAREA/.test(el.tagName) || el.isContentEditable));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'v') setTool('select');
      else if (k === 'h') setTool('hand');
      else if (k === 's' || k === 'n') {
        e.preventDefault();
        addNoteAtWorld();
      } else if (k === '=' || k === '+') {
        e.preventDefault();
        zoomByStep(1.2);
      } else if (k === '-') {
        e.preventDefault();
        zoomByStep(1 / 1.2);
      } else if (k === '0') {
        e.preventDefault();
        recenterView();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false);
    };

    const onBlur = () => setSpaceHeld(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [addNoteAtWorld, recenterView, zoomByStep]);

  const bringToFront = (id: number) => {
    const z = topZRef.current++;
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, z } : n)));
  };

  // Canvas pointer handlers: pan in every direction + two-finger touch pinch zoom
  const onCanvasPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('.pg-dock') || target.closest('.pg-zoom-hud')) return;

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const rect = e.currentTarget.getBoundingClientRect();
      pinchRef.current = {
        dist: Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)),
        midX: (pts[0].x + pts[1].x) / 2 - rect.left,
        midY: (pts[0].y + pts[1].y) / 2 - rect.top,
        cam: { ...cameraRef.current },
      };
      panStartRef.current = null;
      nodeDragRef.current = null;
      setDraggingId(null);
      setIsPanning(true);
      return;
    }

    const onBoardCard = Boolean(target.closest('.pg-sticky') || target.closest('.pg-folio-card'));
    const isMiddleClick = e.button === 1;
    const shouldPan = isMiddleClick || effectiveHand || (!onBoardCard && e.button === 0);

    if (!shouldPan) return;

    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsPanning(true);
    panStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      camX: cameraRef.current.x,
      camY: cameraRef.current.y,
    };
  };

  const onCanvasPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (pinchRef.current && activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const rect = e.currentTarget.getBoundingClientRect();
      const newDist = Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y));
      const newMidX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const newMidY = (pts[0].y + pts[1].y) / 2 - rect.top;
      const base = pinchRef.current;
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, base.cam.zoom * (newDist / base.dist)));
      const worldX = (base.midX - base.cam.x) / base.cam.zoom;
      const worldY = (base.midY - base.cam.y) / base.cam.zoom;
      setCamera({
        zoom: nextZoom,
        x: newMidX - worldX * nextZoom,
        y: newMidY - worldY * nextZoom,
      });
      return;
    }

    const pan = panStartRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return;
    setCamera((prev) => ({
      ...prev,
      x: pan.camX + (e.clientX - pan.startX),
      y: pan.camY + (e.clientY - pan.startY),
    }));
  };

  const onCanvasPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    if (panStartRef.current?.pointerId === e.pointerId) {
      panStartRef.current = null;
      setIsPanning(false);
    }
  };

  // Drag handler for both project cards and sticky notes in world space
  const onNodePointerDown = (e: React.PointerEvent<HTMLElement>, node: BoardNode) => {
    if (effectiveHand || e.button === 1) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.tagName === 'TEXTAREA') {
      bringToFront(node.id);
      return;
    }
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    bringToFront(node.id);
    nodeDragRef.current = {
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: node.x,
      origY: node.y,
      moved: false,
    };
  };

  const onNodePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const drag = nodeDragRef.current;
    if (!drag) return;
    e.stopPropagation();
    const dxScreen = e.clientX - drag.startX;
    const dyScreen = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dxScreen, dyScreen) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      setDraggingId(drag.id);
    }
    const zoom = cameraRef.current.zoom;
    const nx = drag.origX + dxScreen / zoom;
    const ny = drag.origY + dyScreen / zoom;
    setNodes((prev) => prev.map((n) => (n.id === drag.id ? { ...n, x: nx, y: ny } : n)));
  };

  const onNodePointerUp = (e: React.PointerEvent<HTMLElement>, node: BoardNode) => {
    const drag = nodeDragRef.current;
    nodeDragRef.current = null;
    setDraggingId(null);
    if (drag && !drag.moved && e.type === 'pointerup' && node.kind === 'project') {
      goToProject(node.slug);
    }
  };

  const onCanvasDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (effectiveHand) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('.pg-sticky') ||
      target.closest('.pg-folio-card') ||
      target.closest('.pg-dock') ||
      target.closest('.pg-zoom-hud')
    ) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const cam = cameraRef.current;
    addNoteAtWorld((sx - cam.x) / cam.zoom, (sy - cam.y) / cam.zoom);
  };

  const dotStep = Math.max(12, 24 * camera.zoom);

  return (
    <main className="pg-page">
      <section
        ref={canvasRef}
        className={`pg-canvas ${effectiveHand ? 'is-hand' : ''} ${isPanning ? 'is-panning' : ''}`}
        aria-label="Infinite FigJam-style portfolio playground canvas. Drag cards, click a project card to open its case study, or pan in any direction."
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerCancel={onCanvasPointerUp}
        onDoubleClick={onCanvasDoubleClick}
        style={{
          backgroundSize: `${dotStep}px ${dotStep}px`,
          backgroundPosition: `${camera.x}px ${camera.y}px`,
        }}
      >
        <div
          className="pg-world"
          style={{
            transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
          }}
        >
          {nodes.map((node) => {
            const isDragging = draggingId === node.id;

            if (node.kind === 'project') {
              return (
                <article
                  key={node.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Open ${node.title} case study`}
                  onPointerDown={(e) => onNodePointerDown(e, node)}
                  onPointerMove={onNodePointerMove}
                  onPointerUp={(e) => onNodePointerUp(e, node)}
                  onPointerCancel={(e) => onNodePointerUp(e, node)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goToProject(node.slug);
                    }
                  }}
                  className={`pg-folio-card ${isDragging ? 'is-dragging' : ''} ${effectiveHand ? 'is-hand-pass' : ''}`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    zIndex: node.z,
                    transform: isDragging
                      ? 'rotate(0deg) scale(1.035)'
                      : `rotate(${node.rotate}deg)`,
                  }}
                >
                  <div className="pg-folio-thumb">
                    <img
                      src={node.image}
                      alt={node.title}
                      loading="lazy"
                      draggable={false}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="pg-folio-meta">
                    <div className="pg-folio-text">
                      <small className="pg-folio-cat">{node.category}</small>
                      <h3 className="pg-folio-title">{node.title}</h3>
                    </div>
                    <span className="pg-folio-arrow" aria-hidden="true">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                </article>
              );
            }

            return (
              <div
                key={node.id}
                onPointerDown={(e) => onNodePointerDown(e, node)}
                onPointerMove={onNodePointerMove}
                onPointerUp={(e) => onNodePointerUp(e, node)}
                onPointerCancel={(e) => onNodePointerUp(e, node)}
                className={`pg-sticky ${isDragging ? 'is-dragging' : ''} ${effectiveHand ? 'is-hand-pass' : ''}`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  zIndex: node.z,
                  backgroundColor: node.bg,
                  transform: isDragging
                    ? 'rotate(0deg) scale(1.04)'
                    : `rotate(${node.rotate}deg)`,
                }}
              >
                <div className="pg-sticky-top">
                  <span className="pg-sticky-grip" aria-hidden="true" />
                  <button
                    type="button"
                    className="pg-sticky-del"
                    aria-label="Remove sticky note"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNodes((prev) => prev.filter((n) => n.id !== node.id));
                    }}
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </div>
                <textarea
                  data-note-id={node.id}
                  value={node.text}
                  placeholder="Write a note..."
                  readOnly={effectiveHand}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === node.id && n.kind === 'sticky' ? { ...n, text: val } : n,
                      ),
                    );
                  }}
                  aria-label="Sticky note content"
                  className="pg-sticky-input"
                />
                <div className="pg-sticky-foot">
                  <span className="pg-sticky-author">— {node.author}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom-center FigJam floating dock */}
        <div className="pg-dock" role="toolbar" aria-label="Canvas tools">
          <div className="pg-dock-tools" role="group" aria-label="Cursor mode">
            <button
              type="button"
              className={`pg-tool-btn ${!effectiveHand ? 'is-active' : ''}`}
              aria-pressed={!effectiveHand}
              aria-label="Select & drag cards (V)"
              title="Select (V)"
              onClick={() => setTool('select')}
            >
              <MousePointer2 size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`pg-tool-btn ${effectiveHand ? 'is-active' : ''}`}
              aria-pressed={effectiveHand}
              aria-label="Hand pan tool (H or hold Space)"
              title="Pan canvas (H / Space)"
              onClick={() => setTool('hand')}
            >
              <Hand size={15} aria-hidden="true" />
            </button>
          </div>

          <span className="pg-dock-sep" aria-hidden="true" />

          <div className="pg-dock-colors" role="group" aria-label="Sticky note color">
            {STICKY_COLORS.map((c) => {
              const selected = activeColor === c.bg;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`Drop ${c.label} sticky note`}
                  title={c.label}
                  onClick={() => {
                    setActiveColor(c.bg);
                    addNoteAtWorld(undefined, undefined, c.bg);
                  }}
                  className={`pg-color-dot ${selected ? 'is-selected' : ''}`}
                  style={{ backgroundColor: c.dot }}
                />
              );
            })}
          </div>

          <button
            type="button"
            className="pg-dock-btn is-primary"
            onClick={() => addNoteAtWorld()}
            aria-label="Add sticky note (S)"
            title="Add sticky note (S)"
          >
            <StickyNoteIcon size={14} aria-hidden="true" />
            <span>Sticky</span>
          </button>

          <span className="pg-dock-sep" aria-hidden="true" />

          <button
            type="button"
            className="pg-dock-btn"
            onClick={resetBoard}
            aria-label="Reset canvas cards and sticky notes"
            title="Reset board"
          >
            <RotateCcw size={14} aria-hidden="true" />
          </button>
        </div>

        {/* Bottom-right FigJam zoom & recenter HUD */}
        <div className="pg-zoom-hud" aria-label="Canvas zoom controls">
          <button
            type="button"
            className="pg-zoom-btn"
            onClick={() => zoomByStep(1 / 1.2)}
            aria-label="Zoom out (-)"
            title="Zoom out (-)"
          >
            <Minus size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="pg-zoom-pct tabular-nums"
            onClick={recenterView}
            aria-label="Reset zoom and recenter view (0)"
            title="Re-center view (0)"
          >
            {Math.round(camera.zoom * 100)}%
          </button>
          <button
            type="button"
            className="pg-zoom-btn"
            onClick={() => zoomByStep(1.2)}
            aria-label="Zoom in (+)"
            title="Zoom in (+)"
          >
            <Plus size={14} aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
}
