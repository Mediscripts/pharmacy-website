import { Link } from 'react-router-dom'
import './SiteFooter.css'

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__eyebrow">Mediscripts Phamarcy</p>
          <p className="site-footer__copy">
            Shop trusted medicines, manage prescriptions with ease, and track every order with confidence.
          </p>
        </div>

        <div className="site-footer__links" aria-label="Footer links">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/track-order">Track Order</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
