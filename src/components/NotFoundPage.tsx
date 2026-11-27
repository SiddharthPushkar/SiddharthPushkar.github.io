import { RouteSlug } from '../routes';

interface NotFoundPageProps {
  onNavigate: (slug: RouteSlug, hash?: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <main className="about">
      <section className="about-hero">
        <div className="nf">
          <p className="about-hello">Error 404</p>
          <h1 className="about-name">This page doesn’t exist</h1>
          <p className="about-lede">
            The link may be broken or the page may have moved. Let’s get you back to the work.
          </p>
          <div className="nf-links">
            <a
              className="resume-btn arrow-link"
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('');
              }}
            >
              <span>Back to home</span>
              <i className="arr" aria-hidden="true"></i>
            </a>
            <a
              className="roll"
              href="/#work"
              data-text="See projects"
              style={{ marginTop: 36 }}
              onClick={(e) => {
                e.preventDefault();
                onNavigate('', 'work');
              }}
            >
              <span>See projects</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
