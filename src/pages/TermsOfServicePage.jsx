import { Link } from 'react-router-dom'
import './PolicyPage.css'

function TermsOfServicePage() {
  return (
    <main className="policy-shell">
      <section className="policy-hero">
        <p className="policy-kicker">Terms of service</p>
        <h1>The rules for using the Mediscripts Pharmacy website.</h1>
        <p>
          These terms explain how you can use the site, place orders, and what to expect when
          products or prescriptions are involved.
        </p>
        <div className="policy-meta">
          <span>Last updated: August 24, 2026</span>
          <span>Please review before ordering</span>
        </div>
      </section>

      <div className="policy-grid">
        <article className="policy-card">
          <h2>Using the site</h2>
          <ul>
            <li>You agree to provide accurate information when placing an order.</li>
            <li>You are responsible for keeping your contact details up to date.</li>
            <li>You may not use the site in a way that harms the service or other users.</li>
          </ul>
        </article>

        <article className="policy-card">
          <h2>Orders and availability</h2>
          <ul>
            <li>Orders are subject to product availability and review where required.</li>
            <li>We may reject or cancel an order if something is incorrect or unavailable.</li>
            <li>Product descriptions, pricing, and stock can change without notice.</li>
          </ul>
        </article>

        <article className="policy-card">
          <h2>Prescription items</h2>
          <ul>
            <li>Some products require prescription review before approval.</li>
            <li>We may ask for extra details or decline an order if review does not meet requirements.</li>
            <li>Prescription items are handled through a separate approval flow.</li>
          </ul>
        </article>

        <article className="policy-card">
          <h2>Payments</h2>
          <ul>
            <li>You agree to pay for the products you order using the available payment methods.</li>
            <li>Manual transfer orders may require proof of payment before processing.</li>
            <li>We may hold or cancel an order if payment cannot be confirmed.</li>
          </ul>
        </article>
      </div>

      <section className="policy-card" style={{ marginTop: '16px' }}>
        <p>
          By using the site, you also agree to our <Link to="/privacy-policy">Privacy Policy</Link>{' '}
          and <Link to="/cookies">Cookies Notice</Link>.
        </p>
      </section>
    </main>
  )
}

export default TermsOfServicePage
