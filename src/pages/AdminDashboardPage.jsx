import { useQuery } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import './AdminDashboardPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function DashboardIcon({ name }) {
  const iconProps = {
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
    className: 'dashboard-card__icon',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  switch (name) {
    case 'catalog':
      return (
        <svg {...iconProps}>
          <path d="M4.5 5.5h6v13h-6z" />
          <path d="M13.5 5.5h6v7h-6z" />
          <path d="M13.5 15.5h6v3h-6z" />
        </svg>
      )
    case 'inventory':
      return (
        <svg {...iconProps}>
          <path d="M4.5 8.5 12 4.5l7.5 4-7.5 4z" />
          <path d="M4.5 8.5V16l7.5 4 7.5-4V8.5" />
          <path d="M12 12.5V20" />
        </svg>
      )
    case 'payments':
      return (
        <svg {...iconProps}>
          <rect x="4.5" y="6.5" width="15" height="11" rx="2.5" />
          <path d="M4.5 10.5h15" />
          <path d="M8 14.5h4" />
        </svg>
      )
    case 'orders':
      return (
        <svg {...iconProps}>
          <path d="M6 4.5h9.5l2.5 2.5v12.5H6z" />
          <path d="M15.5 4.5v3h3" />
          <path d="M8.5 11h7" />
          <path d="M8.5 14h5" />
        </svg>
      )
    default:
      return null
  }
}

function StatCard({ label, value, tone = 'default' }) {
  return (
    <article className={`admin-stat-card admin-stat-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function ActionCard({ to, eyebrow, title, description, cta, icon }) {
  return (
    <Link to={to} className="dashboard-card">
      <div className="dashboard-card__top">
        <span className="dashboard-card__eyebrow">{eyebrow}</span>
        <span className="dashboard-card__badge">
          <DashboardIcon name={icon} />
        </span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <span className="dashboard-card__cta">{cta}</span>
    </Link>
  )
}

function AdminDashboardPage() {
  const { isAdmin, logout, loading, user, accessToken } = useAuth()

  const summaryQuery = useQuery({
    queryKey: ['admin-summary', accessToken],
    enabled: !loading && isAdmin && Boolean(accessToken),
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/api/admin/summary`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to load dashboard summary.')
      }

      return payload.metrics
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  })

  if (loading) {
    return (
      <main className="admin-shell">
        <section className="admin-state-card">
          <p className="admin-kicker">Admin access</p>
          <h1>Loading your workspace...</h1>
          <p>Just a moment while we open the dashboard.</p>
        </section>
      </main>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  const metrics = summaryQuery.data

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="admin-hero__copy">
          <p className="admin-kicker">Back office</p>
          <h1>Good to see you, {user?.fullName || 'Admin'}.</h1>
          <p>
            This is the quick stop for the store. Keep the catalog tidy, keep stock moving, and
            check payments without digging through noise.
          </p>

          <div className="admin-hero__actions">
            <Link className="admin-button" to="/admin/catalog">
              Open catalog
            </Link>
            <Link className="admin-button admin-button--ghost" to="/admin/orders">
              Open orders
            </Link>
            <Link className="admin-button admin-button--ghost" to="/admin/inventory">
              Check inventory
            </Link>
          <Link className="admin-button admin-button--ghost" to="/admin/payments">
            View payments
          </Link>
          <Link className="admin-button admin-button--ghost" to="/admin/payment-settings">
            Transfer details
          </Link>
          <Link className="admin-button admin-button--ghost" to="/admin/logs">
            Activity log
          </Link>
          <Link className="admin-button admin-button--ghost" to="/products">
            Back to site
          </Link>
          </div>
        </div>

        <button type="button" onClick={logout} className="admin-signout">
          Sign out
        </button>
      </section>

      <section className="admin-status">
        <StatCard label="Orders waiting" value={metrics ? metrics.pendingOrders : '...'} />
        <StatCard
          label="Prescription reviews"
          value={metrics ? metrics.pendingPrescriptionReviews : '...'}
          tone="warm"
        />
        <StatCard label="Low stock" value={metrics ? metrics.lowStockProducts : '...'} tone="soft" />
        <StatCard
          label="Out of stock"
          value={metrics ? metrics.outOfStockProducts : '...'}
          tone="alert"
        />
        <StatCard
          label="Collected so far"
          value={metrics ? `NGN ${Number(metrics.revenue || 0).toLocaleString()}` : '...'}
          tone="accent"
        />
      </section>

      {summaryQuery.isLoading ? <p className="admin-helper">Pulling in the latest numbers...</p> : null}
      {summaryQuery.isError ? (
        <p className="admin-error">{summaryQuery.error?.message || 'Unable to load summary.'}</p>
      ) : null}

      <section className="admin-sections">
        <ActionCard
          to="/admin/catalog"
          eyebrow="Catalog"
          title="Handle products the easy way"
          description="Open the catalog to add medicines, update details, switch categories, or archive items that should no longer appear."
          cta="Go to catalog"
          icon="catalog"
        />
        <ActionCard
          to="/admin/inventory"
          eyebrow="Inventory"
          title="Keep stock moving"
          description="Use the inventory area to adjust counts, add notes, and keep every movement traceable."
          cta="Open stock room"
          icon="inventory"
        />
        <ActionCard
          to="/admin/payments"
          eyebrow="Payments"
          title="See what has cleared"
          description="Review recent payments, spot what is pending, and keep an eye on anything that needs attention."
          cta="Review payments"
          icon="payments"
        />
        <ActionCard
          to="/admin/payment-settings"
          eyebrow="Transfer"
          title="Keep bank details current"
          description="Update the account name, account number, and transfer instructions whenever they change."
          cta="Open transfer settings"
          icon="payments"
        />
        <ActionCard
          to="/admin/logs"
          eyebrow="Audit trail"
          title="See every admin action"
          description="Check who changed orders, products, payments, and transfer settings from one place."
          cta="Open activity log"
          icon="orders"
        />
        <ActionCard
          to="/admin/orders"
          eyebrow="Orders"
          title="Follow every order"
          description="Open the order desk to see each request, check the details, and move the status forward when it is ready."
          cta="Open orders"
          icon="orders"
        />
      </section>

      <section className="admin-footer-note">
        <p>
          Start with the section that needs you most right now, and move through the rest at your
          pace.
        </p>
      </section>
    </main>
  )
}

export default AdminDashboardPage
