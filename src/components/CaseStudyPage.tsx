import { useEffect, useRef } from 'react';
import { CASE_STUDIES } from '../data/caseStudies';
import { parseRoute, RouteSlug } from '../routes';

interface CaseStudyPageProps {
  slug: string;
  onNavigate: (slug: RouteSlug, hash?: string) => void;
}

export function CaseStudyPage({ slug, onNavigate }: CaseStudyPageProps) {
  const mainRef = useRef<HTMLElement>(null);
  const study = CASE_STUDIES[slug];

  useEffect(() => {
    const main = mainRef.current;
    if (!main || !study) return;

    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
      main.querySelectorAll<HTMLVideoElement>('video[autoplay]').forEach((v) => {
        v.autoplay = false;
        v.pause();
        v.controls = true;
      });
    }

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-spa-link="true"]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      e.preventDefault();
      const targetSlug = parseRoute(href);
      onNavigate(targetSlug);
    };

    main.addEventListener('click', onClick);
    return () => main.removeEventListener('click', onClick);
  }, [study, onNavigate]);

  if (!study) return null;

  return (
    <main
      ref={mainRef}
      className={study.mainClass}
      dangerouslySetInnerHTML={{ __html: study.mainHtml }}
    />
  );
}
