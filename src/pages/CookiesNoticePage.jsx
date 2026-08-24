import { Link } from 'react-router-dom'
import './PolicyPage.css'

function CookiesNoticePage() {
  return (
    <main className="policy-shell">
      <section className="policy-hero">
        <p className="policy-kicker">Cookies notice</p>
        <h1>How we use cookies and similar tools.</h1>
        <p>
          We use cookies and related technologies to keep the site working, remember preferences,
          and understand how visitors use the store.
        </p>
        <div className="policy-meta">
          <span>Last updated: August 24, 2026</span>
          <span>Simple overview</span>
        </div>
      </section>

      <div className="policy-grid">
        <article className="policy-card">
          <h2>What cookies do</h2>
          <ul>
            <li>Keep you signed in where needed.</li>
            <li>Remember shopping activity and preferences.</li>
            <li>Help us understand which pages and features are used most.</li>
          </ul>
        </article>

        <article className="policy-card">
          <h2>Types we may use</h2>
          <ul>
            <li>Essential cookies for site function.</li>
            <li>Preference cookies for a smoother experience.</li>
            <li>Analytics cookies to help improve the website.</li>
          </ul>
        </article>

        <article className="policy-card">
          <h2>Your choices</h2>
          <p>
            You can change cookie preferences in your browser settings. Some features may not work
            properly if essential cookies are disabled.
          </p>
        </article>
      </div>

      <section className="policy-card" style={{ marginTop: '16px' }}>
        <p>
          Read our <Link to="/privacy-policy">Privacy Policy</Link> and{' '}
          <Link to="/terms">Terms of Service</Link> for more details.
        </p>
      </section>
    </main>
  )
}

export default CookiesNoticePage
