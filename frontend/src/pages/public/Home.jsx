
import "../../App.css";

function Home() {
  return (
    <main>
      <nav className="navbar">
        <a href="#" className="brand">
          <span className="brand-icon">⌖</span>
          Civic<span>Lens</span>
        </a>

        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </div>

        <div className="nav-actions">
          <a href="/login" className="login-link">Log in</a>
          <a href="/register" className="nav-button">
            Get started <span>↗</span>
          </a>
        </div>
      </nav>

      <section className="hero" id="about">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="live-dot"></span>
            TECHNOLOGY FOR BETTER CITIES
          </div>

          <h1>
            Your city.<br />
            Your voice.<br />
            <span>Real change.</span>
          </h1>

          <p className="hero-description">
            Report civic problems, track their progress and help
            build cleaner, safer and better neighbourhoods.
          </p>

          <div className="hero-actions">
            <a href="/register" className="primary-button">
              Report an issue <span>↗</span>
            </a>
            <a href="#how" className="secondary-button">
              Discover how it works <span>→</span>
            </a>
          </div>

          <div className="hero-note">
            <span>✳</span>
            Making every neighbourhood count.
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-top">
            <span>YOUR NEIGHBOURHOOD</span>
            <span className="map-status">● LIVE PLATFORM</span>
          </div>

          <div className="map-art">
            <div className="road road-one"></div>
            <div className="road road-two"></div>
            <div className="road road-three"></div>
            <div className="park park-one"></div>
            <div className="park park-two"></div>

            <div className="map-pin pin-one">!</div>
            <div className="map-pin pin-two">!</div>
            <div className="map-pin pin-three">!</div>

            <div className="map-label">CIVIC ISSUE MAP</div>
          </div>

          <div className="visual-bottom">
            <div>
              <span className="visual-caption">BUILT FOR CITIZENS</span>
              <h3>See a problem? Report it.</h3>
            </div>
            <span className="visual-arrow">↗</span>
          </div>
        </div>
      </section>

      <section className="intro-strip">
        <span>01 — REPORT</span>
        <span>02 — TRACK</span>
        <span>03 — RESOLVE</span>
        <span>BETTER CITIES START WITH US.</span>
      </section>

      <section className="features-section" id="features">
        <div className="section-heading">
          <div>
            <span className="section-label">WHAT CIVICLENS DOES</span>
            <h2>Small actions.<br />Meaningful impact.</h2>
          </div>
          <p>
            A smarter way to connect citizens, civic authorities
            and communities to solve everyday urban problems.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card feature-orange">
            <div className="feature-icon">◎</div>
            <span>01 / REPORT</span>
            <h3>Report what<br />needs fixing.</h3>
            <p>
              Submit civic complaints with photographs,
              descriptions and location details.
            </p>
            <div className="feature-arrow">↗</div>
          </article>

          <article className="feature-card feature-green">
            <div className="feature-icon">⌖</div>
            <span>02 / TRACK</span>
            <h3>Stay in the<br />loop.</h3>
            <p>
              Follow complaint updates and see how
              issues progress towards resolution.
            </p>
            <div className="feature-arrow">↗</div>
          </article>

          <article className="feature-card feature-cream">
            <div className="feature-icon">✳</div>
            <span>03 / IMPROVE</span>
            <h3>Make change<br />visible.</h3>
            <p>
              Help communities identify recurring
              problems and improve public spaces.
            </p>
            <div className="feature-arrow">↗</div>
          </article>
        </div>
      </section>

      <section className="how-section" id="how">
        <span className="section-label">SIMPLE BY DESIGN</span>
        <h2>Three steps to a better city.</h2>

        <div className="steps">
          <div>
            <span>01</span>
            <h3>Spot an issue</h3>
            <p>Notice a pothole, garbage pile or broken streetlight?</p>
          </div>
          <div>
            <span>02</span>
            <h3>Submit a report</h3>
            <p>Add a photo, description and location.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Follow progress</h3>
            <p>Track updates as the complaint moves forward.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <a href="#" className="brand">
          <span className="brand-icon">⌖</span>
          Civic<span>Lens</span>
        </a>
        <p>Better cities begin with people who care.</p>
        <span>© 2026 CivicLens</span>
      </footer>
    </main>
  );
}

export default Home;
