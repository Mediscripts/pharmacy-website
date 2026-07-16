import { useQuery } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

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
      <main style={{ maxWidth: '760px', margin: '4rem auto', padding: '2rem' }}>
        Loading dashboard...
      </main>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <main
      style={{
        maxWidth: '960px',
        margin: '4rem auto',
        padding: '2rem',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        background: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div>
          <p style={{ margin: 0, color: '#0f766e', fontWeight: 600 }}>Admin access</p>
          <h1 style={{ margin: '0.2rem 0 0' }}>Dashboard</h1>
        </div>
        <button
          type="button"
          onClick={logout}
          style={{
            padding: '0.7rem 1rem',
            borderRadius: '999px',
            border: '1px solid #cbd5e1',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Log out
        </button>
      </div>

      <p style={{ color: '#475569', marginTop: '1rem' }}>
        Welcome{user?.fullName ? `, ${user.fullName}` : ''}. This is the first admin-only screen.
        Product, inventory, and prescription management can be added here next.
      </p>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>Live summary</h2>

        {summaryQuery.isLoading ? <p>Loading summary...</p> : null}
        {summaryQuery.isError ? (
          <p style={{ color: '#b91c1c' }}>{summaryQuery.error?.message}</p>
        ) : null}

        {summaryQuery.data ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            {[
              ['Total orders', summaryQuery.data.totalOrders],
              ['Pending orders', summaryQuery.data.pendingOrders],
              ['Pending reviews', summaryQuery.data.pendingPrescriptionReviews],
              ['Products', summaryQuery.data.totalProducts],
              ['Low stock', summaryQuery.data.lowStockProducts],
              ['Out of stock', summaryQuery.data.outOfStockProducts],
              ['Revenue', `NGN ${Number(summaryQuery.data.revenue || 0).toLocaleString()}`],
            ].map(([label, value]) => (
              <article
                key={label}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1rem',
                  background: '#f8fafc',
                }}
              >
                <p style={{ margin: 0, color: '#64748b' }}>{label}</p>
                <strong style={{ fontSize: '1.6rem' }}>{value}</strong>
              </article>
            ))}
          </div>
        ) : null}

        <div style={{ marginTop: '1.5rem' }}>
          <Link
            to="/admin/catalog"
            style={{
              display: 'inline-flex',
              padding: '0.8rem 1.1rem',
              borderRadius: '999px',
              background: '#0f766e',
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            Open catalog management
          </Link>
          <Link
            to="/admin/inventory"
            style={{
              display: 'inline-flex',
              marginLeft: '0.75rem',
              padding: '0.8rem 1.1rem',
              borderRadius: '999px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#0f172a',
              textDecoration: 'none',
            }}
          >
            Open inventory management
          </Link>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboardPage
