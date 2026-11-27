import { RouteSlug } from '../routes';

interface FooterProps {
  onNavigate: (slug: RouteSlug, hash?: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer id="contact" className="footer">
      <div className="footer-top">
        <div className="footer-left">
          <p className="eyebrow">Contact</p>
          <h2>Let’s start creating together</h2>
          <div className="contact-info slide-x">
            <div className="ci-item slide-x">
              <p className="ci-label">Get in touch</p>
              <a className="ci-link arrow-link" href="mailto:sid.pushkar@gmail.com">
                <span>sid.pushkar@gmail.com</span>
                <i className="arr" aria-hidden="true"></i>
              </a>
            </div>
            <div className="ci-item">
              <p className="ci-label">Phone</p>
              <a className="ci-link" href="tel:+919654709285">
                <span>+91 9654709285</span>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-right">
          <ul className="footer-nav">
            <li>
              <a
                href="/"
                className="roll"
                data-text="Home"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('');
                }}
              >
                <span>Home</span>
              </a>
            </li>
            <li>
              <a
                href="/playground"
                className="roll"
                data-text="Playground"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('playground');
                }}
              >
                <span>Playground</span>
              </a>
            </li>
            <li>
              <a
                href="/about"
                className="roll"
                data-text="About"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('about');
                }}
              >
                <span>About</span>
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="roll"
                data-text="Contact"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Contact</span>
              </a>
            </li>
          </ul>
          <ul className="social">
            <li>
              <a
                className="arrow-link"
                href="https://www.linkedin.com/in/siddharth-pushkar-b8478710b/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>LinkedIn</span>
                <i className="arr" aria-hidden="true"></i>
              </a>
            </li>
            <li>
              <a
                className="arrow-link"
                href="https://www.behance.net/siddharpushkar"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Behance</span>
                <i className="arr" aria-hidden="true"></i>
              </a>
            </li>
            <li>
              <a
                className="arrow-link"
                href="https://www.instagram.com/siddharthpushkar/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Instagram</span>
                <i className="arr" aria-hidden="true"></i>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom"></div>
    </footer>
  );
}
