import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { getFriendlyErrorMessage } from '../lib/errorMessages'
import './AdminCatalogPage.css'
import './AdminPaymentsPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function formatCurrency(value) {
  return `NGN ${Number(value || 0).toLocaleString()}`
}

function formatDate(value) {
  if (!value) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function AdminPaymentsPage() {
  const { isAdmin, loading, accessToken } = useAuth()
  const [payments, setPayments] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    if (loading || !isAdmin || !accessToken) {
      return undefined
    }

    let isMounted = true

    const loadPayments = async () => {
      setPageLoading(true)
      setPageError('')

      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/payments`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load payments.')
        }

        if (isMounted) {
          setPayments(payload.payments || [])
        }
      } catch (error) {
        if (isMounted) {
          setPageError(getFriendlyErrorMessage(error, 'We could not load payments right now.'))
        }
      } finally {
        if (isMounted) {
          setPageLoading(false)
        }
      }
    }

    loadPayments()

    return () => {
      isMounted = false
    }
  }, [accessToken, isAdmin, loading, refreshToken])

  const stats = useMemo(() => {
    const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

    return {
      total: payments.length,
      verified: payments.filter((payment) => payment.status === 'Verified').length,
      pending: payments.filter((payment) => payment.status === 'Pending').length,
      failed: payments.filter((payment) => payment.status === 'Failed').length,
      totalAmount,
    }
  }, [payments])

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
        <div>
          <p className="admin-kicker">Admin tools</p>
          <h1>Payments</h1>
          <p>See what has cleared, what is still waiting, and what needs a second look.</p>
        </div>

        <div className="admin-hero__actions">
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={() => setRefreshToken((current) => current + 1)}
          >
            Refresh list
          </button>
          <Link className="admin-button admin-button--ghost" to="/admin">
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="admin-metrics">
        {[
          ['Payments', stats.total],
          ['Verified', stats.verified],
          ['Pending', stats.pending],
          ['Failed', stats.failed],
          ['Total volume', formatCurrency(stats.totalAmount)],
        ].map(([label, value]) => (
          <article key={label} className="admin-metric-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      {pageLoading ? <p className="admin-helper">Loading payment data...</p> : null}
      {pageError ? <p className="admin-error">{pageError}</p> : null}

      <section className="payments-panel">
        {payments.length > 0 ? (
          <div className="payments-table">
            <div className="payments-table__head">
              <span>Order</span>
              <span>Customer</span>
              <span>Reference</span>
              <span>Status</span>
              <span>Amount</span>
              <span>Created</span>
            </div>

              {payments.map((payment) => (
                <article key={payment.id} className="payments-table__row">
                  <div>
                    <strong>{payment.order?.order_number || 'Unknown order'}</strong>
                    <p>{payment.order?.payment_status || payment.status}</p>
                  </div>
                  <div>
                    <strong>{payment.order?.customer_name || 'Unknown customer'}</strong>
                    <p>{payment.order?.customer_email || 'No email available'}</p>
                  </div>
                  <div>
                    <strong className="payments-reference">{payment.reference}</strong>
                    <p>{payment.payment_method === 'transfer' ? 'Manual transfer' : 'Paystack'}</p>
                  </div>
                  <div>
                    <span
                      className={`payments-status payments-status--${String(
                        payment.status || 'pending',
                      ).toLowerCase()}`}
                    >
                      {payment.status || 'Pending'}
                    </span>
                    <p>{payment.receipt_status || 'No receipt yet'}</p>
                  </div>
                  <div>
                    <strong>{formatCurrency(payment.amount)}</strong>
                  </div>
                  <div>
                    <strong>{formatDate(payment.created_at)}</strong>
                  </div>
                </article>
              ))}
          </div>
        ) : (
          <div className="admin-empty">
            <h2>No payments yet</h2>
            <p>Completed transactions will appear here once customers start paying.</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminPaymentsPage
