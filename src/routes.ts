export type RouteSlug =
  | ''
  | 'playground'
  | 'about'
  | 'full-body-test'
  | 'ai-report-analysis'
  | 'welup'
  | 'budgetin'
  | 'zenze'
  | 'adhd-college-framework'
  | '404';

const VALID_SLUGS = new Set<string>([
  '',
  'playground',
  'about',
  'full-body-test',
  'ai-report-analysis',
  'welup',
  'budgetin',
  'zenze',
  'adhd-college-framework',
]);

export function parseRoute(pathname: string): RouteSlug {
  const cleaned = pathname
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.html$/i, '')
    .replace(/^index$/i, '');

  if (VALID_SLUGS.has(cleaned)) {
    return cleaned as RouteSlug;
  }
  return '404';
}

export function routeToPath(slug: RouteSlug, hash?: string): string {
  const base = slug === '' ? '/' : `/${slug}`;
  return hash ? `${base}#${hash.replace(/^#/, '')}` : base;
}
