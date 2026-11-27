import { useEffect, useRef } from 'react';
import { RouteSlug } from '../routes';

interface HeaderProps {
  currentRoute: RouteSlug;
  onNavigate: (slug: RouteSlug, hash?: string) => void;
}

export function Header({ currentRoute, onNavigate }: HeaderProps) {
  const navWrapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const navWrap = navWrapRef.current;
    if (!navWrap) return;

    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.max(window.scrollY, 0);
        const dy = y - lastY;
        if (y < 80 || dy < -4) navWrap.classList.remove('nav-hidden');
        else if (dy > 4) navWrap.classList.add('nav-hidden');
        if (Math.abs(dy) > 4) lastY = y;
        ticking = false;
      });
    };

    const onFocusIn = () => {
      navWrap.classList.remove('nav-hidden');
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    navWrap.addEventListener('focusin', onFocusIn);

    return () => {
      window.removeEventListener('scroll', onScroll);
      navWrap.removeEventListener('focusin', onFocusIn);
    };
  }, []);

  useEffect(() => {
    navWrapRef.current?.classList.remove('nav-hidden');
  }, [currentRoute]);

  return (
    <header ref={navWrapRef} className="nav-wrap">
      <a
        href="/"
        className="logo"
        aria-label="Siddharth Pushkar – home"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('');
        }}
      >
        <img src="/logo.svg" alt="siddharth pushkar" width={122} height={53} />
      </a>
      <nav className="nav" aria-label="Primary">
        <a
          href="/#work"
          className="roll"
          data-text="Projects"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('', 'work');
          }}
        >
          <span>Projects</span>
        </a>
        <a
          href="/about"
          className="roll"
          data-text="About"
          aria-current={currentRoute === 'about' ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault();
            onNavigate('about');
          }}
        >
          <span>About</span>
        </a>
        <a
          href="/#contact"
          className="roll"
          data-text="Contact"
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById('contact');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else onNavigate('', 'contact');
          }}
        >
          <span>Contact</span>
        </a>
      </nav>
    </header>
  );
}
