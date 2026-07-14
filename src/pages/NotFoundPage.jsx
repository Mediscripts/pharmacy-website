import { Link } from 'react-router-dom'
import './NotFoundPage.css'

function NotFoundPage() {
  return (
    <div className="page notfound-page">
      <section className="notfound-card">
        <p className="notfound-card__eyebrow">404</p>
        <h1>That page does not exist.</h1>
        <p>
          The route may have moved or never existed. Use the link below to get
          back to the storefront.
        </p>

        <Link className="button button--primary" to="/">
          Go home
        </Link>
      </section>
    </div>
  )
}

export default NotFoundPage
