import { RouteSlug } from '../routes';

interface WorkGridProps {
  onNavigate: (slug: RouteSlug) => void;
}

const PROJECTS: Array<{
  slug: RouteSlug;
  category: string;
  title: string;
  image: string;
  alt: string;
  width: number;
  height: number;
}> = [
  {
    slug: 'full-body-test',
    category: 'Healthcare Fintech',
    title: 'Full Body Test',
    image: 'https://framerusercontent.com/images/sBS6Wjn5BVPTfCNMcO3PNYbqJIQ.png?scale-down-to=1024',
    alt: 'Full Body Test project',
    width: 1024,
    height: 330,
  },
  {
    slug: 'ai-report-analysis',
    category: 'Healthcare Fintech',
    title: 'AI Report Analysis',
    image: 'https://framerusercontent.com/images/4iFJlkGc5Fi501XhnyCWqYExdA.png?scale-down-to=1024',
    alt: 'AI Report Analysis project',
    width: 992,
    height: 1024,
  },
  {
    slug: 'welup',
    category: 'Healthcare Fintech',
    title: 'welUp',
    image: 'https://framerusercontent.com/images/PimddrN4GK3qe2riUvfyat9Q0.png?scale-down-to=1024',
    alt: 'welUp project',
    width: 1024,
    height: 514,
  },
  {
    slug: 'budgetin',
    category: 'Product Design',
    title: 'BudgetIn',
    image: 'https://framerusercontent.com/images/8SJpoqLE8AO1Eq3CVBAmNe43c.webp?width=1024',
    alt: 'BudgetIn project',
    width: 1024,
    height: 722,
  },
  {
    slug: 'zenze',
    category: 'UI/UX Design',
    title: 'Zenze',
    image: 'https://framerusercontent.com/images/0tcuc9aiu6Iw0ZXOJKgJygf854.png',
    alt: 'Zenze project',
    width: 940,
    height: 616,
  },
  {
    slug: 'adhd-college-framework',
    category: 'UX Design',
    title: 'ADHD College Framework',
    image: 'https://framerusercontent.com/images/QBU9mT9vc5vOdG108tTwPiUYXh4.png?scale-down-to=1024',
    alt: 'ADHD College Framework project',
    width: 1024,
    height: 576,
  },
];

export function WorkGrid({ onNavigate }: WorkGridProps) {
  return (
    <section id="work" className="work" aria-labelledby="work-title">
      <h2 id="work-title" className="sr-only">
        Projects
      </h2>
      <div className="grid">
        {PROJECTS.map((project) => (
          <a
            key={project.slug}
            className="card reveal"
            href={`/${project.slug}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(project.slug);
            }}
          >
            <div className="thumb">
              <img
                src={project.image}
                alt={project.alt}
                width={project.width}
                height={project.height}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <span className="chip" aria-hidden="true">
                <span className="chip-icon"></span>
              </span>
            </div>
            <small>{project.category}</small>
            <h3>{project.title}</h3>
          </a>
        ))}
      </div>
    </section>
  );
}
