import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './CookieConsentBanner.css'

const storageKey = 'mediscripts-cookie-consent'

function CookieConsentBanner() {
  const [decision, setDecision] = useState(null)

  useEffect(() => {
    try {
      const storedDecision = window.localStorage.getItem(storageKey)

      if (storedDecision === 'accepted' || storedDecision === 'declined') {
        setDecision(storedDecision)
      }
    } catch {
      setDecision('accepted')
    }
  }, [])

  if (decision) {
    return null
  }

  const saveDecision = (value) => {
    setDecision(value)

    try {
      window.localStorage.setItem(storageKey, value)
    } catch {
    }
  }

  return (
    <aside className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie notice">
      <div className="cookie-banner__copy">
        <p className="cookie-banner__kicker">Cookies notice</p>
        <h2>We use cookies to keep things smooth.</h2>
        <p>
          Essential cookies help the site work. Optional cookies help us improve the experience.
          You can accept, decline, or read more before deciding.
        </p>
      </div>

      <div className="cookie-banner__actions">
        <Link className="cookie-banner__link" to="/cookies">
          Read more
        </Link>
        <button type="button" className="cookie-banner__button cookie-banner__button--ghost" onClick={() => saveDecision('declined')}>
          Decline
        </button>
        <button type="button" className="cookie-banner__button" onClick={() => saveDecision('accepted')}>
          Accept cookies
        </button>
      </div>
    </aside>
  )
}

export default CookieConsentBanner
