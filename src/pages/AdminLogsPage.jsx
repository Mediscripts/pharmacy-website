import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import './AdminDashboardPage.css'
import './AdminLogsPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function formatDate(value) {
  if (!value) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function AdminLogsPage() {
  const { isAdmin, loading, accessToken } = useAuth()
  const [logs, setLogs] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  useEffect(() => {
    if (loading || !isAdmin || !accessToken) {
      return undefined
    }

    let isMounted = true

    const loadLogs = async () => {
      setPageLoading(true)
      setPageError('')

      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/activity-logs`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load activity logs.')
        }

        if (isMounted) {
          setLogs(payload.logs || [])
        }
      } catch (err) {
        if (isMounted) {
          setPageError(err.message)
        }
      } finally {
        if (isMounted) {
          setPageLoading(false)
        }
      }
    }

    loadLogs()

    return () => {
      isMounted = false
    }
  }, [accessToken, isAdmin, loading])

  if (loading) {
    return (
      <main className="admin-shell">
        <section className="admin-state-card">
          <p className="admin-kicker">Admin access</p>
          <h1>Loading access...</h1>
          <p>Please wait while we verify your session.</p>
        </section>
      </main>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="admin-hero__copy">
          <p className="admin-kicker">Admin tools</p>
          <h1>Activity log</h1>
          <p>See who changed what, when they changed it, and which record they touched.</p>
        </div>

        <div className="admin-hero__actions">
          <Link className="admin-button admin-button--ghost" to="/admin">
            Back to dashboard
          </Link>
          <Link className="admin-button admin-button--ghost" to="/admin/orders">
            Back to orders
          </Link>
        </div>
      </section>

      {pageLoading ? <p className="admin-helper">Loading log entries...</p> : null}
      {pageError ? <p className="admin-error">{pageError}</p> : null}

      <section className="logs-panel">
        {logs.length > 0 ? (
          <div className="logs-list">
            {logs.map((entry) => (
              <article key={entry.id} className="logs-item">
                <div className="logs-item__head">
                  <div>
                    <span>{entry.entity_type}</span>
                    <strong>{entry.summary}</strong>
                  </div>
                  <div className="logs-item__meta">
                    <span>{entry.actor?.full_name || 'Admin'}</span>
                    <span>{formatDate(entry.created_at)}</span>
                  </div>
                </div>

                <p className="logs-item__action">
                  {entry.action} {entry.entity_id ? `on ${entry.entity_id}` : ''}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty">
            <h2>No log entries yet</h2>
            <p>Admin actions will show up here once the team starts changing records.</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminLogsPage
