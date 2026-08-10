import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import './AdminDashboardPage.css'
import './AdminOrdersPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const orderStatusLabels = {
  'Pending Payment': 'Pending payment',
  Paid: 'Paid',
  'Awaiting Prescription': 'Awaiting prescription',
  'Under Review': 'Under review',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Processing: 'Processing',
  Ready: 'Ready for pickup',
  'Out for Delivery': 'Out for delivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
  Refunded: 'Refunded',
}

const statusFilters = ['All', 'Pending Payment', 'Awaiting Prescription', 'Processing', 'Delivered', 'Rejected']

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

function getStatusTone(status) {
  switch (status) {
    case 'Paid':
    case 'Approved':
    case 'Ready':
    case 'Delivered':
      return 'success'
    case 'Pending Payment':
    case 'Awaiting Prescription':
    case 'Under Review':
    case 'Processing':
      return 'pending'
    case 'Rejected':
    case 'Cancelled':
      return 'danger'
    case 'Out for Delivery':
      return 'info'
    case 'Refunded':
      return 'muted'
    default:
      return 'muted'
  }
}

function AdminOrdersPage() {
  const { isAdmin, loading, accessToken } = useAuth()
  const [orders, setOrders] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    if (loading || !isAdmin || !accessToken) {
      return undefined
    }

    let isMounted = true

    const loadOrders = async () => {
      setPageLoading(true)
      setPageError('')

      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/orders`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load orders.')
        }

        if (isMounted) {
          setOrders(payload.orders || [])
        }
      } catch (error) {
        if (isMounted) {
          setPageError(error.message)
        }
      } finally {
        if (isMounted) {
          setPageLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      isMounted = false
    }
  }, [accessToken, isAdmin, loading, refreshToken])

  const stats = useMemo(() => {
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)

    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === 'Pending Payment').length,
      active: orders.filter(
        (order) =>
          ['Paid', 'Processing', 'Ready', 'Out for Delivery'].includes(order.status),
      ).length,
      completed: orders.filter((order) => order.status === 'Delivered').length,
      totalAmount,
    }
  }, [orders])

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orders.filter((order) => {
      if (activeFilter !== 'All' && order.status !== activeFilter) {
        return false
      }

      if (!query) {
        return true
      }

        return [
          order.order_number,
          order.customer_name,
          order.customer_email,
          order.customer_phone,
          order.status,
          order.payment_status,
          order.payment_method,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [activeFilter, orders, search])

  const countsByStatus = useMemo(() => {
    return orders.reduce(
      (counts, order) => {
        counts[order.status] = (counts[order.status] || 0) + 1
        return counts
      },
      { All: orders.length },
    )
  }, [orders])

  if (loading) {
    return (
      <main className="orders-shell">
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
    <main className="orders-shell">
      <section className="orders-hero">
        <div className="orders-hero__copy">
          <p className="admin-kicker">Orders</p>
          <h1>Keep every order moving.</h1>
          <p>
            See what came in, sort the queue by status, and open the details when something needs
            attention.
          </p>
        </div>

        <div className="orders-hero__actions">
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={() => setRefreshToken((current) => current + 1)}
          >
            Refresh orders
          </button>
          <Link className="admin-button admin-button--ghost" to="/admin">
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="orders-metrics">
        {[
          ['Orders', stats.total],
          ['Pending payment', stats.pending],
          ['In motion', stats.active],
          ['Delivered', stats.completed],
          ['Order value', formatCurrency(stats.totalAmount)],
        ].map(([label, value]) => (
          <article key={label} className="orders-metric-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="orders-toolbar">
        <label className="orders-searchbar">
          <span>Search orders</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order number, customer, email, or status"
          />
        </label>

        <div className="orders-filters" role="tablist" aria-label="Order filters">
          {statusFilters.map((status) => (
            <button
              key={status}
              type="button"
              className={`orders-filter-chip${activeFilter === status ? ' orders-filter-chip--active' : ''}`}
              onClick={() => setActiveFilter(status)}
            >
              {status}
              <span>{countsByStatus[status] || 0}</span>
            </button>
          ))}
        </div>
      </section>

      {pageLoading ? <p className="admin-helper">Loading orders...</p> : null}
      {pageError ? <p className="admin-error">{pageError}</p> : null}

      <section className="orders-panel">
        {visibleOrders.length > 0 ? (
          <div className="orders-table-wrap">
            <div className="orders-table">
              <div className="orders-table__head">
                <span>Order</span>
                <span>Customer</span>
                <span>Status</span>
                <span>Payment</span>
                <span>Total</span>
                <span>Updated</span>
                <span>Open</span>
              </div>

              {visibleOrders.map((order) => {
                const tone = getStatusTone(order.status)

                return (
                  <Link key={order.id} to={`/admin/orders/${order.id}`} className="orders-table__row">
                    <div>
                      <strong>{order.order_number}</strong>
                      <p>{order.requires_prescription ? 'Prescription order' : 'Regular medicine'}</p>
                    </div>
                    <div>
                      <strong>{order.customer_name}</strong>
                      <p>{order.customer_email}</p>
                    </div>
                    <div>
                      <span className={`order-status order-status--${tone}`}>
                        {orderStatusLabels[order.status] || order.status}
                      </span>
                      <p>{order.prescription_status || 'No review yet'}</p>
                    </div>
                    <div>
                      <strong>{order.payment_status}</strong>
                      <p>{order.payment_method === 'transfer' ? 'Manual transfer' : 'Paystack'}</p>
                    </div>
                    <div>
                      <strong>{formatCurrency(order.total_amount)}</strong>
                      <p>{order.requires_prescription ? 'Needs review' : 'Ready to handle'}</p>
                    </div>
                    <div>
                      <strong>{formatDate(order.updated_at)}</strong>
                      <p>{formatDate(order.created_at)}</p>
                    </div>
                    <div className="orders-table__open">Open</div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="admin-empty">
            <h2>No orders found</h2>
            <p>Try another filter or search term, or wait for the next order to come in.</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminOrdersPage
