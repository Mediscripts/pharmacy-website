import { Outlet } from 'react-router-dom'
import CookieConsentBanner from './CookieConsentBanner'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

function SiteLayout() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="site-main">
        <Outlet />
      </main>
      <CookieConsentBanner />
      <SiteFooter />
    </div>
  )
}

export default SiteLayout
