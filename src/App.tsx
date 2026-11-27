import { useCallback, useEffect, useState } from 'react';
import { AboutPage } from './components/AboutPage';
import { CaseStudyPage } from './components/CaseStudyPage';
import { CustomCursor } from './components/CustomCursor';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroCanvas } from './components/HeroCanvas';
import { NotFoundPage } from './components/NotFoundPage';
import { PlaygroundPage } from './components/PlaygroundPage';
import { WorkGrid } from './components/WorkGrid';
import { CASE_STUDIES } from './data/caseStudies';
import { parseRoute, RouteSlug, routeToPath } from './routes';

const STATIC_META: Record<string, { title: string; desc: string }> = {
  '': {
    title: 'Siddharth Pushkar – Experience & Product Designer Portfolio',
    desc: 'Portfolio of Siddharth Pushkar, an experience designer crafting digital products people enjoy. Case studies in healthcare fintech, budgeting and focus apps.',
  },
  playground: {
    title: 'Playground – Siddharth Pushkar, Product Designer',
    desc: 'Interactive design experiments, spring physics toys, tactile keycaps, contrast tools, and playful craft by Siddharth Pushkar.',
  },
  about: {
    title: 'About – Siddharth Pushkar, Product Designer',
    desc: 'About Siddharth Pushkar, an experience designer from DTU (Delhi Technological University) designing simple, intuitive digital products.',
  },
  '404': {
    title: 'Page not found – Siddharth Pushkar',
    desc: 'Page not found on Siddharth Pushkar’s portfolio.',
  },
};

export default function App() {
  const [route, setRoute] = useState<RouteSlug>(() => parseRoute(window.location.pathname));

  const navigate = useCallback(
    (slug: RouteSlug, hash?: string) => {
      const nextPath = routeToPath(slug, hash);
      if (window.location.pathname + window.location.hash !== nextPath) {
        window.history.pushState({ slug }, '', nextPath);
      }
      setRoute(slug);
      requestAnimationFrame(() => {
        if (hash) {
          const el = document.getElementById(hash.replace(/^#/, ''));
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            return;
          }
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
      });
    },
    [],
  );

  useEffect(() => {
    const onPopState = () => {
      setRoute(parseRoute(window.location.pathname));
      if (window.location.hash) {
        requestAnimationFrame(() => {
          const id = window.location.hash.replace(/^#/, '');
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const study = CASE_STUDIES[route];
    const meta = study
      ? { title: study.title, desc: study.desc }
      : STATIC_META[route] || STATIC_META[''];
    document.title = meta.title;
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl && meta.desc) descEl.setAttribute('content', meta.desc);

    if (study?.bodyClass === 'theme-dark') {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
    }
  }, [route]);

  useEffect(() => {
    const appear = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            appear.unobserve(en.target);
          }
        });
      },
      { threshold: 0.5 },
    );

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    document.querySelectorAll('.appear, .slide-x').forEach((el) => appear.observe(el));
    document.querySelectorAll<HTMLElement>('.reveal').forEach((el, i) => {
      el.style.transitionDelay = `${(i % 2) * 0.12}s`;
      io.observe(el);
    });

    return () => {
      appear.disconnect();
      io.disconnect();
    };
  }, [route]);

  const isCaseStudy = Boolean(CASE_STUDIES[route]);

  return (
    <>
      <CustomCursor />
      <Header currentRoute={route} onNavigate={navigate} />

      {route === '' && (
        <main>
          <HeroCanvas onNavigate={navigate} />
          <WorkGrid onNavigate={(slug) => navigate(slug)} />
        </main>
      )}

      {route === 'playground' && <PlaygroundPage onNavigate={navigate} />}

      {route === 'about' && <AboutPage onNavigate={navigate} />}

      {isCaseStudy && <CaseStudyPage slug={route} onNavigate={navigate} />}

      {route === '404' && <NotFoundPage onNavigate={navigate} />}

      {route !== 'playground' && <Footer onNavigate={navigate} />}
    </>
  );
}
