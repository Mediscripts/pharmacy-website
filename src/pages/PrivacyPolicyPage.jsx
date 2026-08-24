import { Link } from 'react-router-dom'
import './PolicyPage.css'

function PrivacyPolicyPage() {
  return (
    <main className="policy-shell">
      <section className="policy-hero">
        <p className="policy-kicker">Privacy policy</p>
        <h1>Your information, handled with care.</h1>
        <p>
          This page explains how Mediscripts Pharmacy collects, uses, stores, and protects
          information when you browse, order, or contact us.
        </p>
        <div className="policy-meta">
          <span>Last updated: August 24, 2026</span>
          <span>Plain-language summary</span>
        </div>
      </section>

      <div className="policy-grid">
        <article className="policy-card">
          <h2>What we collect</h2>
          <ul>
            <li>Contact details such as your name, email, and phone number.</li>
            <li>Delivery information and order details.</li>
            <li>Prescription files and payment-related information when needed.</li>
            <li>Basic site usage data that helps us keep the website working well.</li>
          </ul>
        </article>

        <article className="policy-card">
          <h2>How we use it</h2>
          <ul>
            <li>To process orders, payments, delivery, and prescription review.</li>
            <li>To send order updates and support messages.</li>
            <li>To improve the website and keep your experience smooth.</li>
            <li>To meet legal, safety, and business requirements.</li>
          </ul>
        </article>

        <article className="policy-card">
          <h2>Data policy</h2>
          <ul>
            <li>We keep only the data needed to run the service and support your orders.</li>
            <li>Access is limited to people who need it to do their job.</li>
            <li>We may store information with trusted service providers we use to operate the site.</li>
            <li>We do not sell your personal information.</li>
          </ul>
        </article>

        <article className="policy-card">
          <h2>Your choices</h2>
          <p>
            You can contact us if you want to update your details, ask a question about your
            information, or request support with your account or order.
          </p>
        </article>

        <article className="policy-card">
          <h2>Contact</h2>
          <p>
            If you have any privacy questions, email{' '}
            <a href="mailto:support@mediscriptspharmacy.com">support@mediscriptspharmacy.com</a>.
          </p>
        </article>
      </div>

      <section className="policy-card" style={{ marginTop: '16px' }}>
        <p>
          For more details, you can also read our <Link to="/terms">Terms of Service</Link> and{' '}
          <Link to="/cookies">Cookies Notice</Link>.
        </p>
      </section>
    </main>
  )
}

export default PrivacyPolicyPage
