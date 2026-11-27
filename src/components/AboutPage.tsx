import { useEffect, useRef } from 'react';
import { RouteSlug } from '../routes';

interface AboutPageProps {
  onNavigate: (slug: RouteSlug, hash?: string) => void;
}

const CAPABILITIES = [
  {
    num: '01',
    title: 'Product & Business Alignment',
    body: 'Partnering closely with product and business teams to translate customer problems and priorities into clear, end-to-end experiences.',
  },
  {
    num: '02',
    title: 'Research & Conversion Craft',
    body: 'Collaborating with research and data to validate flows, spot drop-offs early, and craft self-assisted journeys that reduce friction.',
  },
  {
    num: '03',
    title: 'Scalable Design Systems',
    body: 'Building and maintaining reusable components with auto layout so complex products stay fast, consistent, and maintainable.',
  },
  {
    num: '04',
    title: 'Prototyping & Engineering Handoff',
    body: 'Running crisp stakeholder reviews with high-fidelity prototypes and working hand-in-hand with engineering to cover real-world edge cases.',
  },
];

const PRINCIPLES = [
  {
    num: '01',
    title: 'Start with the problem, never pixels.',
    body: 'I dig into data, user behavior, and context to pinpoint the real friction before exploring solutions.',
  },
  {
    num: '02',
    title: 'Think in systems, not isolated screens.',
    body: 'Every component and pattern should scale cleanly across flows instead of adding one-off UI debt.',
  },
  {
    num: '03',
    title: 'Design for conversion and long-term trust.',
    body: 'Clarity beats cleverness—experiences should feel intuitive while measurably reducing drop-offs.',
  },
  {
    num: '04',
    title: 'Respect real-world usage & constraints.',
    body: 'I balance user intent with technical and business realities so edge cases work as smoothly as the happy path.',
  },
  {
    num: '05',
    title: 'Ship, measure, and iterate continuously.',
    body: 'Launch is the starting line—feedback, usability testing, and live metrics guide every refinement.',
  },
];

const EXPERIENCE = [
  {
    start: '2024-07',
    startLabel: 'Jul 2024',
    end: '2025-12',
    endLabel: 'Dec 2025',
    company: 'SaveIN',
    role: 'UI UX Designer',
    summary:
      'Designed end-to-end healthcare fintech and consumer wellness journeys across welUp, Full Body Test booking, and AI Report Analysis.',
  },
  {
    start: '2023-11',
    startLabel: 'Nov 2023',
    end: '2023-12',
    endLabel: 'Dec 2023',
    company: 'Betterway',
    role: 'Product Design Intern',
    summary:
      'Simplified core onboarding and everyday product flows with rapid prototyping and user feedback.',
  },
  {
    start: '2023-07',
    startLabel: 'Jul 2023',
    end: '2023-09',
    endLabel: 'Sept 2023',
    company: 'Atmana',
    role: 'UI UX Design Intern',
    summary:
      'Crafted intuitive mobile interfaces, interactive prototypes, and reusable UI components.',
  },
  {
    start: '2022-06',
    startLabel: 'Jun 2022',
    end: '2023-04',
    endLabel: 'Apr 2023',
    company: 'Bobble AI',
    role: 'Product Design Intern',
    summary:
      'Contributed to high-scale consumer mobile experiences, visual explorations, and interaction patterns.',
  },
];

const TOOLKIT = [
  {
    group: 'Core Craft',
    items: [
      'End-to-End Product Design',
      'Interaction & Micro-Motion',
      'Design Systems & Auto Layout',
      'High-Fidelity Prototyping',
      'Information Architecture',
    ],
  },
  {
    group: 'Tools',
    items: ['Figma & FigJam', 'Framer', 'Maze & Usability Testing', 'Notion', 'HTML / CSS Fundamentals'],
  },
  {
    group: 'Domains',
    items: [
      'Healthcare Fintech',
      'Consumer Mobile Apps',
      'Self-Assisted Journeys',
      'Conversion & Funnel UX',
      'Accessible Systems',
    ],
  },
];

export function AboutPage({ onNavigate }: AboutPageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const shotRef = useRef<HTMLDivElement>(null);
  const dimsRef = useRef<HTMLSpanElement>(null);
  const expTlRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const mover = moverRef.current;
    const shot = shotRef.current;
    const dims = dimsRef.current;

    let ro: ResizeObserver | undefined;
    if (dims && dims.parentElement) {
      ro = new ResizeObserver(([e]) => {
        dims.textContent = `${Math.round(e.contentRect.width)} × ${Math.round(e.contentRect.height)}`;
      });
      ro.observe(dims.parentElement);
    }

    if (!frame || !mover || !shot) {
      return () => ro?.disconnect();
    }

    const MIN_W = 120;
    const MAX_W = 960;
    let x = 0;
    let y = 0;

    const place = () => {
      mover.style.setProperty('--dx', `${x}px`);
      mover.style.setProperty('--dy', `${y}px`);
    };

    const floatFrame = () => {
      if (mover.classList.contains('floating')) return;
      frame.style.width = `${frame.offsetWidth}px`;
      frame.style.height = `${frame.offsetHeight}px`;
      mover.style.width = `${mover.offsetWidth}px`;
      mover.classList.add('floating');
    };

    const track = (e: PointerEvent, onMove: (dx: number, dy: number) => void) => {
      e.preventDefault();
      e.stopPropagation();
      floatFrame();
      const target = e.target as HTMLElement;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      mover.classList.add('dragging');
      const sx = e.clientX;
      const sy = e.clientY;
      const move = (ev: PointerEvent) => onMove(ev.clientX - sx, ev.clientY - sy);
      const up = () => {
        mover.classList.remove('dragging');
        target.removeEventListener('pointermove', move);
        target.removeEventListener('pointerup', up);
        target.removeEventListener('pointercancel', up);
      };
      target.addEventListener('pointermove', move);
      target.addEventListener('pointerup', up);
      target.addEventListener('pointercancel', up);
    };

    const onMoverDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (e.button !== 0 || target.classList.contains('h') || target.closest('button')) return;
      const x0 = x;
      const y0 = y;
      track(e, (dx, dy) => {
        x = x0 + dx;
        y = y0 + dy;
        place();
      });
    };
    mover.addEventListener('pointerdown', onMoverDown);

    const handleCleanups: Array<() => void> = [];
    mover.querySelectorAll<HTMLElement>('.h').forEach((h) => {
      const onHandleDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        const sxSign = h.classList.contains('tl') || h.classList.contains('bl') ? -1 : 1;
        const sySign = h.classList.contains('tl') || h.classList.contains('tr') ? -1 : 1;
        const x0 = x;
        const y0 = y;
        const w0 = shot.offsetWidth;
        const ratio = shot.offsetHeight / w0;
        track(e, (dx, dy) => {
          const a = dx * sxSign;
          const b = (dy * sySign) / ratio;
          const w = Math.min(MAX_W, Math.max(MIN_W, w0 + (Math.abs(a) > Math.abs(b) ? a : b)));
          mover.style.width = `${w}px`;
          x = sxSign < 0 ? x0 + (w0 - w) : x0;
          y = sySign < 0 ? y0 + (w0 - w) * ratio : y0;
          place();
        });
      };
      h.addEventListener('pointerdown', onHandleDown);
      handleCleanups.push(() => h.removeEventListener('pointerdown', onHandleDown));
    });

    return () => {
      ro?.disconnect();
      mover.removeEventListener('pointerdown', onMoverDown);
      handleCleanups.forEach((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const tl = expTlRef.current;
    if (!tl) return;

    let rafId = 0;

    const updateTimeline = () => {
      const items = Array.from(tl.querySelectorAll<HTMLLIElement>('li'));
      if (items.length < 2) return;

      const tlRect = tl.getBoundingClientRect();
      const firstDotY = 9.5;
      const lastItem = items[items.length - 1];
      const lastDotY = lastItem.offsetTop + 9.5;
      const maxSpan = Math.max(1, lastDotY - firstDotY);

      const triggerY = window.innerHeight * 0.56;
      const rawTravel = triggerY - (tlRect.top + firstDotY);
      const clampedTravel = Math.max(0, Math.min(maxSpan, rawTravel));

      tl.style.setProperty('--tl-start', `${firstDotY}px`);
      tl.style.setProperty('--tl-span', `${maxSpan}px`);
      tl.style.setProperty('--tl-fill', `${clampedTravel.toFixed(1)}px`);

      let currentIdx = 0;
      items.forEach((item, idx) => {
        const dotOffset = item.offsetTop + 9.5 - firstDotY;
        const reached = idx === 0 || clampedTravel >= dotOffset - 2;
        if (reached) currentIdx = idx;
        item.classList.toggle('is-reached', reached);
      });

      items.forEach((item, idx) => {
        item.classList.toggle('is-current', idx === currentIdx);
      });
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateTimeline);
    };

    updateTimeline();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  return (
    <main className="about">
      <section className="about-hero">
        <div className="about-hero-inner">
          <div ref={frameRef} className="sel-frame">
            <div ref={moverRef} className="sel-move">
              <div className="frame-bar">
                <p className="frame-name" aria-hidden="true">
                  siddharth.png
                </p>
              </div>
              <div ref={shotRef} className="sel-box">
                <img
                  src="https://framerusercontent.com/images/N9bWljoY20GYniOOS6CduLxHw10.png?scale-down-to=1024"
                  alt="Siddharth Pushkar"
                  draggable={false}
                  width={440}
                  height={550}
                  referrerPolicy="no-referrer"
                />
                <span className="h tl"></span>
                <span className="h tr"></span>
                <span className="h bl"></span>
                <span className="h br"></span>
                <span ref={dimsRef} className="dims" data-dims aria-hidden="true"></span>
              </div>
              <p className="about-note" aria-hidden="true">
                drag or resize me!
                <svg viewBox="0 0 60 64" overflow="visible">
                  <path d="M52 6 C 46 28, 34 45, 14 54" />
                  <path d="M23 44 L 14 54 L 27 56" />
                </svg>
              </p>
            </div>
          </div>

          <div className="about-intro">
            <p className="about-kicker">
              <span>Experience &amp; Product Designer</span>
            </p>
            <p className="about-hello">Hi, I am</p>
            <h1 className="about-name">Siddharth Pushkar</h1>
            <p className="about-lede">
              I design products that cut through noise and actually work. Most things are
              overcomplicated. I like simplifying them—not by dumbing things down, but by thinking
              harder.
            </p>
            <div className="about-actions">
              <a
                className="resume-btn arrow-link"
                href="https://drive.google.com/file/d/1Ae9ZBi_jyxLZZPdYR0Hk6OBP8ftwvA7w/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Download Resume</span>
                <i className="arr" aria-hidden="true"></i>
              </a>
              <a
                className="about-btn-ghost arrow-link"
                href="/#work"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('', 'work');
                }}
              >
                <span>Projects</span>
                <i className="arr" aria-hidden="true"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="about-metrics" aria-label="Career snapshot">
          <div className="about-metric">
            <strong className="tabular-nums">3+ yrs</strong>
            <span>Designing fintech, healthcare &amp; consumer mobile products</span>
          </div>
          <div className="about-metric">
            <strong>B.Des, DTU</strong>
            <span>Interaction Design, Delhi Technological University</span>
          </div>
        </div>
      </section>

      <div className="about-body">
        <section className="about-sec">
          <h2>What I do</h2>
          <div className="sec-body sec-body-wide">
            <p className="sec-lede">
              I design <strong>end-to-end product experiences</strong> in close partnership with
              cross-functional teams to ship high-quality, production-ready features that solve real
              user and business problems.
            </p>
            <div className="about-pillars">
              {CAPABILITIES.map((cap) => (
                <div key={cap.num} className="about-pillar">
                  <span className="pillar-num tabular-nums">{cap.num}</span>
                  <h3>{cap.title}</h3>
                  <p>{cap.body}</p>
                </div>
              ))}
            </div>
            <p className="sec-close">
              I focus on building <strong>simple, intuitive experiences for complex systems</strong>
              , optimizing for <strong>conversion, usability, and long-term user trust</strong>.
            </p>
          </div>
        </section>

        <section className="about-sec">
          <h2>How I approach design</h2>
          <div className="sec-body sec-body-wide">
            <p className="sec-lede">
              I’m a <strong>problem-first product designer</strong> who focuses on simplifying
              complex experiences while ensuring every decision drives real impact.
            </p>
            <ol className="about-principles">
              {PRINCIPLES.map((p) => (
                <li key={p.num} className="principle-row">
                  <span className="principle-num tabular-nums">{p.num}</span>
                  <div>
                    <h3>{p.title}</h3>
                    <p>{p.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="about-sec">
          <h2>Experience</h2>
          <ol ref={expTlRef} className="tl tl-scroll sec-body">
            {EXPERIENCE.map((item, idx) => (
              <li
                key={`${item.company}-${item.start}`}
                className={idx === 0 ? 'is-reached' : undefined}
              >
                <span className="tl-date">
                  <time dateTime={item.start}>{item.startLabel}</time> –{' '}
                  <time dateTime={item.end}>{item.endLabel}</time>
                </span>
                <h3>{item.company}</h3>
                <p className="tl-role">{item.role}</p>
                <p className="tl-summary">{item.summary}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-sec">
          <h2>Education</h2>
          <ol className="tl sec-body">
            <li>
              <span className="tl-date">
                <time dateTime="2020-07">Jul 2020</time> – <time dateTime="2024-05">May 2024</time>
              </span>
              <h3>Delhi Technological University</h3>
              <p className="tl-role">Bachelor of Design, Interaction Design</p>
              <small>Formerly known as Delhi College of Engineering (DCE)</small>
            </li>
          </ol>
        </section>

        <section className="about-sec">
          <h2>Craft &amp; Toolkit</h2>
          <div className="sec-body sec-body-wide">
            <div className="about-toolkit">
              {TOOLKIT.map((col) => (
                <div key={col.group} className="toolkit-col">
                  <h3>{col.group}</h3>
                  <ul>
                    {col.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="about-bridge" aria-label="Explore next">
          <a
            href="/#work"
            className="bridge-card arrow-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('', 'work');
            }}
          >
            <small>Case studies</small>
            <span>
              Selected Projects
              <i className="arr" aria-hidden="true"></i>
            </span>
          </a>
          <a
            href="/playground"
            className="bridge-card arrow-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('playground');
            }}
          >
            <small>Interactive experiments</small>
            <span>
              Open Playground
              <i className="arr" aria-hidden="true"></i>
            </span>
          </a>
        </section>
      </div>
    </main>
  );
}
