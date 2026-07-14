import { Link } from 'react-router-dom'
import SectionHeading from '../components/ui/SectionHeading'
import FeatureCard from '../components/home/FeatureCard'
import { categories, homeFeatures } from '../data/siteContent'
import './HomePage.css'

const workflowSteps = [
  {
    title: 'Browse medicines',
    description:
      'Search by category, compare options, and choose the medicines that fit your needs.',
    icon: 'search',
  },
  {
    title: 'Prescription review',
    description:
      'Prescription-only medicines are checked carefully before approval or payment.',
    icon: 'prescription',
  },
  {
    title: 'Secure payment',
    description:
      'Pay for regular medicines with confidence. Approved prescription orders receive a payment link after review.',
    icon: 'payment',
  },
  {
    title: 'Secure tracking with OTP',
    description:
      'Follow your order status with email verification and private tracking built in.',
    icon: 'delivery',
  },
]

function FlowIcon({ name }) {
  const iconProps = {
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
    className: 'flow-icon',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  switch (name) {
    case 'search':
      return (
        <svg {...iconProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      )
    case 'prescription':
      return (
        <svg {...iconProps}>
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6" />
          <path d="M12 10v6" />
        </svg>
      )
    case 'payment':
      return (
        <svg {...iconProps}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
          <path d="M3.5 10h17" />
          <path d="M8 15h4" />
        </svg>
      )
    case 'delivery':
      return (
        <svg {...iconProps}>
          <path d="M3.5 7.5h11v9h-11z" />
          <path d="M14.5 10h3l3 3v3.5h-6z" />
          <circle cx="7" cy="18" r="1.6" />
          <circle cx="17" cy="18" r="1.6" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...iconProps}>
          <path d="M12 3.5 19 6v5.4c0 4.5-3 8.3-7 9.1-4-.8-7-4.6-7-9.1V6z" />
          <path d="m8.5 12 2.3 2.3 4.9-4.9" />
        </svg>
      )
    default:
      return null
  }
}

function HomePage() {
  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero__copy">
          <p className="hero__kicker">Your trusted pharmacy, online</p>
          <h1>Mediscripts Pharmacy</h1>
          <p className="hero__text">
            Shop trusted medicines, upload prescriptions when needed, pay securely,
            and enjoy fast delivery from a pharmacy that puts your comfort first.
          </p>

          <div className="hero__actions">
            <Link className="button button--primary" to="/products">
              Explore products
            </Link>
            <Link className="button button--secondary" to="/track-order">
              Track an order
            </Link>
          </div>

          <div className="hero__stats" aria-label="Quick facts">
            <div>
              <strong>Quick checkout</strong>
              <span>Order in minutes without creating an account</span>
            </div>
            <div>
              <strong>Prescription support</strong>
              <span>Get the right care for prescription-only medicines</span>
            </div>
            <div>
              <strong>Reliable tracking</strong>
              <span>Follow every order with private, easy updates</span>
            </div>
          </div>
        </div>

        <aside className="hero__panel" aria-label="Platform illustration">
          <div className="hero__art">
            <div className="hero__art-glow hero__art-glow--one" aria-hidden="true" />
            <div className="hero__art-glow hero__art-glow--two" aria-hidden="true" />

            <div className="hero__art-shell">
              <div className="hero__art-shellbar">
                <span />
                <span />
                <span />
                <strong>Your order journey</strong>
              </div>

              <div className="hero__art-shellbody">
                <div className="hero__art-chip hero__art-chip--top">
                  Browse medicines
                </div>

                <div className="hero__art-core">
                  <div className="hero__art-coreicon">
                    <FlowIcon name="shield" />
                  </div>
                  <strong>Simple, secure ordering</strong>
                  <span>Get the medicines you need with a smooth experience from start to finish.</span>
                </div>

                <div className="hero__art-flow">
                  <span>
                    <FlowIcon name="prescription" />
                    Prescription review
                  </span>
                  <span>
                    <FlowIcon name="payment" />
                    Secure payment
                  </span>
                </div>

                <div className="hero__art-chip hero__art-chip--bottom">
                  Secure tracking with OTP
                </div>
              </div>
            </div>
          </div>

          <div className="hero__panel-grid">
            <div className="hero__panel-card">
              <span className="hero__stat">01</span>
              <p>Find the medicines you need in seconds</p>
            </div>
            <div className="hero__panel-card">
              <span className="hero__stat">02</span>
              <p>Upload prescriptions with confidence when required</p>
            </div>
            <div className="hero__panel-card hero__panel-card--accent">
              <span className="hero__stat">03</span>
              <p>Pay securely and track your delivery every step of the way</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="Why customers choose us"
          title="Medicine shopping made simple"
          description="Find exactly what you need, order with confidence, and enjoy a pharmacy experience built around your convenience."
          align="center"
        />

        <div className="home-grid home-grid--features">
          {homeFeatures.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              index={`0${index + 1}`}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      <section className="section section--workflow">
        <SectionHeading
          eyebrow="How it works"
          title="From search to delivery"
          description="A smooth, reassuring buying journey that helps you get your essentials quickly and safely."
          align="center"
        />

        <div className="workflow">
          <div className="workflow__illustration" aria-hidden="true">
            <div className="workflow__track" />
            {workflowSteps.map((step, index) => (
              <div className={`workflow__node workflow__node--${index + 1}`} key={step.title}>
                <span className="workflow__index">{`0${index + 1}`}</span>
                <div className="workflow__nodeicon">
                  <FlowIcon name={step.icon} />
                </div>
                <strong>{step.title}</strong>
              </div>
            ))}
            <div className="workflow__seal">
              <FlowIcon name="shield" />
              <strong>Trusted pharmacy experience</strong>
              <span>Designed for safe fulfillment and secure customer privacy.</span>
            </div>
          </div>

          <div className="workflow__cards">
            {workflowSteps.map((step, index) => (
              <article className="workflow-card" key={step.title}>
                <div className="workflow-card__top">
                  <span className="workflow-card__index">{`0${index + 1}`}</span>
                  <span className="workflow-card__icon">
                    <FlowIcon name={step.icon} />
                  </span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="Built for peace of mind"
          title="The parts customers notice right away"
          description="These are the moments that make the experience feel safe, clear, and trustworthy."
          align="center"
        />

        <div className="trust-grid">
          <article className="trust-card">
            <span className="trust-card__icon">
              <FlowIcon name="prescription" />
            </span>
            <h3>Prescription review</h3>
            <p>
              Prescription-only medicines are reviewed carefully so you can shop with
              confidence and peace of mind.
            </p>
          </article>

          <article className="trust-card">
            <span className="trust-card__icon">
              <FlowIcon name="payment" />
            </span>
            <h3>Secure payment</h3>
            <p>
              Pay securely and receive clear confirmation the moment your order is placed.
            </p>
          </article>

          <article className="trust-card">
            <span className="trust-card__icon">
              <FlowIcon name="delivery" />
            </span>
            <h3>Secure tracking with OTP</h3>
            <p>
              Stay updated with secure, private tracking that keeps you informed from checkout to delivery.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="Categories"
          title="Browse by category"
          description="Everything is grouped clearly so you can find the right medicines faster."
          align="center"
        />

        <div className="category-grid">
          {categories.map((category) => (
            <article className="category-card" key={category}>
              <span>{category}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section home-cta">
        <div>
          <p className="home-cta__eyebrow">Ready when you are</p>
          <h2>Start your order today and enjoy a pharmacy experience that feels calm, clear, and dependable.</h2>
        </div>

        <div className="home-cta__actions">
          <Link className="button button--primary" to="/products">
            Review the store
          </Link>
          <Link className="button button--secondary" to="/contact">
            Talk to us
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
