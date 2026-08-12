import './Hero.css'
export default function Hero() {
  return (
    <section className="hero" aria-label="Hero">
      {/* Decorative background blobs */}
      <div className="hero__blob hero__blob--1" aria-hidden="true" />
      <div className="hero__blob hero__blob--2" aria-hidden="true" />

      <div className="container hero__inner " >
        <div className="hero__content">
          <h1 className="hero__title">
            Build the Future<br />
            <span className="hero__title-accent">With Catalyst</span>
          </h1>

          <p className="hero__subtitle">
            Join a team that turns bold ideas into real-world software.
            We move fast, think clearly, and ship with purpose.
          </p>

          {/* Stats row */}
          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-number">20+</span>
              <span className="hero__stat-label">Team Members</span>
            </div>
            <div className="hero__stat-divider" aria-hidden="true" />
            <div className="hero__stat">
              <span className="hero__stat-number">16</span>
              <span className="hero__stat-label">Open Roles</span>
            </div>
            <div className="hero__stat-divider" aria-hidden="true" />
            <div className="hero__stat">
              <span className="hero__stat-number">4.9★</span>
              <span className="hero__stat-label">Glassdoor</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="hero__actions">
            
            <a href="#jobs" className="btn btn--primary hero__btn-lg">
              Explore Open Roles
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a href="#about" className="btn btn--outline">Learn About Us</a>
          </div>
        </div>
      </div>
    </section>
  )
}
