import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function AdminDashboardPage() {
  const { isAdmin, logout, loading, user, accessToken } = useAuth()
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState('')

  useEffect(() => {
    let isMounted = true

    if (loading || !isAdmin || !accessToken) {
      return () => {
        isMounted = false
      }
    }

    const loadSummary = async () => {
      setSummaryLoading(true)
      setSummaryError('')

      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/summary`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load dashboard summary.')
        }

        if (isMounted) {
          setSummary(payload.metrics)
        }
      } catch (error) {
        if (isMounted) {
          setSummaryError(error.message)
        }
      } finally {
        if (isMounted) {
          setSummaryLoading(false)
        }
      }
    }

    loadSummary()

    return () => {
      isMounted = false
    }
  }, [accessToken, isAdmin, loading])

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <p style={{ margin: 0, color: '#0f766e', fontWeight: 600 }}>Admin access</p>
          <h1 style={{ margin: '0.2rem 0 0' }}>Dashboard</h1>
        </div>
        <button type="button" onClick={logout} style={{ padding: '0.7rem 1rem', borderRadius: '999px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Log out</button>
      </div>

      <p style={{ color: '#475569', marginTop: '1rem' }}>
        Welcome{user?.fullName ? `, ${user.fullName}` : ''}. This is the first admin-only screen. Product, inventory, and prescription management can be added here next.
      </p>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>Live summary</h2>

        {summaryLoading ? <p>Loading summary...</p> : null}
        {summaryError ? <p style={{ color: '#b91c1c' }}>{summaryError}</p> : null}

        {summary ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            {[
              ['Total orders', summary.totalOrders],
              ['Pending orders', summary.pendingOrders],
              ['Pending reviews', summary.pendingPrescriptionReviews],
              ['Products', summary.totalProducts],
              ['Low stock', summary.lowStockProducts],
              ['Out of stock', summary.outOfStockProducts],
              ['Revenue', `NGN ${Number(summary.revenue || 0).toLocaleString()}`],
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
