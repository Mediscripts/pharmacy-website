import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import useAuth from '../context/useAuth'
import './AdminDashboardPage.css'
import './AdminOrderPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const orderStatuses = [
  'Pending Payment',
  'Paid',
  'Awaiting Prescription',
  'Under Review',
  'Approved',
  'Rejected',
  'Processing',
  'Ready',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Refunded',
]

const paymentStatuses = ['Unpaid', 'Pending Verification', 'Paid', 'Failed', 'Refunded']

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

function isPdfReceipt(payment) {
  return String(payment?.receipt_storage_path || '').toLowerCase().endsWith('.pdf')
}

function AdminOrderPage() {
  const { orderId } = useParams()
  const { isAdmin, loading, accessToken } = useAuth()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [payment, setPayment] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [history, setHistory] = useState([])
  const [statusDraft, setStatusDraft] = useState('Pending Payment')
  const [paymentStatusDraft, setPaymentStatusDraft] = useState('Unpaid')
  const [prescriptionDraft, setPrescriptionDraft] = useState('Pending')
  const [prescriptionNoteDraft, setPrescriptionNoteDraft] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingPrescription, setSavingPrescription] = useState(false)

  useEffect(() => {
    if (loading || !isAdmin || !accessToken || !orderId) {
      return undefined
    }

    let isMounted = true

    const loadOrder = async () => {
      setPageLoading(true)
      setPageError('')
      setMessage('')

      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load the order.')
        }

        if (!isMounted) {
          return
        }

        setOrder(payload.order || null)
        setItems(payload.items || [])
        setPayment(payload.payment || null)
        setPrescriptions(payload.prescriptions || [])
        setHistory(payload.history || [])
        setStatusDraft(payload.order?.status || 'Pending Payment')
        setPaymentStatusDraft(payload.order?.payment_status || 'Unpaid')

        const prescriptionList = payload.prescriptions || []
        const latestPrescription = prescriptionList[prescriptionList.length - 1]
        setPrescriptionDraft(latestPrescription?.review_status || payload.order?.prescription_status || 'Pending')
        setPrescriptionNoteDraft(latestPrescription?.review_note || payload.order?.rejection_reason || '')
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

    loadOrder()

    return () => {
      isMounted = false
    }
  }, [accessToken, isAdmin, loading, orderId])

  const totals = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

    return {
      itemCount,
      amount: items.reduce(
        (sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0),
        0,
      ),
    }
  }, [items])

  const handleSave = async (event) => {
    event.preventDefault()

    if (!order) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          status: statusDraft,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to update the order.')
      }

      setOrder(payload.order)
      setStatusDraft(payload.order.status)
      setPaymentStatusDraft(payload.order.payment_status)
      setMessage('Order status updated.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePrescriptionSave = async (event) => {
    event.preventDefault()

    if (!order) {
      return
    }

    if (prescriptionDraft === 'Rejected' && !prescriptionNoteDraft.trim()) {
      setMessage('Add a rejection note before rejecting the prescription.')
      return
    }

    setSavingPrescription(true)
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prescriptionStatus: prescriptionDraft,
          prescriptionNote: prescriptionNoteDraft,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to update the prescription review.')
      }

      setOrder(payload.order)
      setStatusDraft(payload.order.status)
      setMessage('Prescription review updated.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSavingPrescription(false)
    }
  }

  const handlePaymentSave = async (event) => {
    event.preventDefault()

    if (!order) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          paymentStatus: paymentStatusDraft,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to update the payment status.')
      }

      setOrder(payload.order)
      setPaymentStatusDraft(payload.order.payment_status)
      setStatusDraft(payload.order.status)
      setPayment(payload.payment || payment)
      setMessage('Payment status updated.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="order-shell">
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

  if (pageLoading) {
    return (
      <main className="order-shell">
        <section className="order-loading">
          <p className="admin-kicker">Orders</p>
          <h1>Loading order details...</h1>
          <p>We are gathering the items, payment, and history for this order.</p>
        </section>
      </main>
    )
  }

  if (pageError) {
    return (
      <main className="order-shell">
        <section className="order-loading">
          <p className="admin-kicker">Orders</p>
          <h1>We could not open this order.</h1>
          <p className="admin-error">{pageError}</p>
          <div className="order-topbar__actions">
            <Link className="admin-button admin-button--ghost" to="/admin/orders">
              Back to orders
            </Link>
            <Link className="admin-button admin-button--ghost" to="/admin">
              Back to dashboard
            </Link>
          </div>
        </section>
      </main>
    )
  }

  if (!order) {
    return <Navigate to="/admin/orders" replace />
  }

  const tone = getStatusTone(order.status)

  return (
    <main className="order-shell">
      <div className="order-topbar">
        <Link className="order-backlink" to="/admin/orders">
          Back to orders
        </Link>
        <div className="order-topbar__actions">
          <Link className="admin-button admin-button--ghost" to="/admin">
            Back to dashboard
          </Link>
        </div>
      </div>

      <section className="order-hero">
        <div className="order-hero__copy">
          <p className="admin-kicker">Order desk</p>
          <h1>{order.order_number}</h1>
          <p>
            {order.customer_name} - {order.customer_email}
          </p>
        </div>

        <div className={`order-status-card order-status-card--${tone}`}>
          <span>Current status</span>
          <strong>{order.status}</strong>
          <small>{order.payment_status}</small>
        </div>
      </section>

      {message ? (
        <p className={message.toLowerCase().includes('updated') ? 'admin-helper' : 'admin-error'}>
          {message}
        </p>
      ) : null}

      <section className="order-layout">
        <div className="order-main">
          <article className="order-panel">
            <div className="order-panel__head">
              <h2>What is in this order</h2>
              <span>
                {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="order-items">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="order-item">
                    <div>
                      <strong>{item.products?.name || 'Unknown product'}</strong>
                      <p>{item.products?.prescription_required ? 'Prescription item' : 'Regular medicine'}</p>
                    </div>
                    <div>
                      <strong>Qty {item.quantity}</strong>
                      <p>{formatCurrency(item.unit_price)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-empty admin-empty--compact">
                  <h2>No items found</h2>
                  <p>This order does not have line items attached yet.</p>
                </div>
              )}
            </div>
          </article>

          <article className="order-panel">
            <div className="order-panel__head">
              <h2>Shipment details</h2>
            </div>

            <div className="order-info-grid">
              <div>
                <span>Customer</span>
                <strong>{order.customer_name}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{order.customer_email}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{order.customer_phone}</strong>
              </div>
              <div className="order-info-grid__wide">
                <span>Delivery address</span>
                <strong>{order.delivery_address}</strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{formatDate(order.created_at)}</strong>
              </div>
              <div>
                <span>Updated</span>
                <strong>{formatDate(order.updated_at)}</strong>
              </div>
            </div>
          </article>

          <article className="order-panel">
            <div className="order-panel__head">
              <h2>Payment</h2>
            </div>

            {payment ? (
              <div className="order-payment">
                <div>
                  <span>Status</span>
                  <strong>{payment.status}</strong>
                </div>
                <div>
                  <span>Method</span>
                  <strong>{payment.payment_method || order.payment_method || 'Paystack'}</strong>
                </div>
                <div>
                  <span>Reference</span>
                  <strong>{payment.reference}</strong>
                </div>
                <div>
                  <span>Amount</span>
                  <strong>{formatCurrency(payment.amount)}</strong>
                </div>
                <div>
                  <span>Receipt</span>
                  <strong>{payment.receipt_status || 'Not submitted'}</strong>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{formatDate(payment.updated_at)}</strong>
                </div>
                {payment.receipt_url ? (
                  <div className="order-info-grid__wide order-payment__receipt">
                    <span>Receipt file</span>
                    {isPdfReceipt(payment) ? (
                      <iframe
                        className="order-payment__viewer order-payment__viewer--pdf"
                        src={payment.receipt_url}
                        title={`Receipt for ${order.order_number}`}
                      />
                    ) : (
                      <img
                        className="order-payment__viewer"
                        src={payment.receipt_url}
                        alt={`Receipt for ${order.order_number}`}
                      />
                    )}
                    <a className="order-payment__link" href={payment.receipt_url} target="_blank" rel="noreferrer">
                      Open receipt in a new tab
                    </a>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="admin-empty admin-empty--compact">
                <h2>No payment record yet</h2>
                <p>Payment information will appear here once it is created.</p>
              </div>
            )}
          </article>

          <article className="order-panel">
            <div className="order-panel__head">
              <h2>Prescription review</h2>
            </div>

            {order.requires_prescription ? (
              <form className="order-editor" onSubmit={handlePrescriptionSave}>
                <label>
                  <span>Review status</span>
                  <select
                    value={prescriptionDraft}
                    onChange={(event) => setPrescriptionDraft(event.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </label>

                <label>
                  <span>Review note</span>
                  <textarea
                    rows={4}
                    value={prescriptionNoteDraft}
                    onChange={(event) => setPrescriptionNoteDraft(event.target.value)}
                    placeholder="Add a short note for approval or rejection."
                  />
                </label>

                <p className="order-help">
                  Approve to move the order forward. Reject with a note so the customer knows what
                  to fix.
                </p>

                <button type="submit" className="admin-button" disabled={savingPrescription}>
                  {savingPrescription ? 'Saving...' : 'Save review'}
                </button>
              </form>
            ) : (
              <div className="admin-empty admin-empty--compact">
                <h2>No prescription review needed</h2>
                <p>This order can move through the normal flow without a document check.</p>
              </div>
            )}

            {prescriptions.length > 0 ? (
              <div className="order-prescriptions">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="order-prescription">
                    <div>
                      <strong>{prescription.review_status}</strong>
                      <p>{formatDate(prescription.reviewed_at || prescription.created_at)}</p>
                      {prescription.review_note ? <span>{prescription.review_note}</span> : null}
                    </div>
                    <a href={prescription.file_url} target="_blank" rel="noreferrer">
                      Open file
                    </a>
                  </div>
                ))}
              </div>
            ) : null}
          </article>

          <article className="order-panel">
            <div className="order-panel__head">
              <h2>Status history</h2>
              <span>
                {history.length} event{history.length === 1 ? '' : 's'}
              </span>
            </div>

            {history.length > 0 ? (
              <div className="order-history">
                {history.map((entry) => (
                  <div key={entry.id} className="order-history__item">
                    <div>
                      <strong>{entry.previous_status || 'Created order'}</strong>
                      <p>to</p>
                      <strong>{entry.new_status}</strong>
                    </div>
                    <div className="order-history__meta">
                      <span>{entry.changed_by_name || 'Admin'}</span>
                      <span>{formatDate(entry.created_at)}</span>
                      {entry.note ? <span>{entry.note}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty admin-empty--compact">
                <h2>No changes yet</h2>
                <p>The first status update will appear here.</p>
              </div>
            )}
          </article>
        </div>

        <aside className="order-sidebar">
          <article className="order-panel order-panel--sticky">
            <div className="order-panel__head">
              <h2>Update status</h2>
              <span>{orderStatuses.length} options</span>
            </div>

            <form className="order-editor" onSubmit={handleSave}>
              <label>
                <span>Order status</span>
                <select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <div className="order-summary">
                <div>
                  <span>Items</span>
                  <strong>{totals.itemCount}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{formatCurrency(order.total_amount || totals.amount)}</strong>
                </div>
                <div>
                  <span>Payment</span>
                  <strong>{order.payment_status}</strong>
                </div>
                <div>
                  <span>Prescription</span>
                  <strong>{order.prescription_status || 'Not set'}</strong>
                </div>
              </div>

              <button type="submit" className="admin-button" disabled={saving}>
                {saving ? 'Saving...' : 'Save status'}
              </button>
            </form>
          </article>

          <article className="order-panel">
            <div className="order-panel__head">
              <h2>Confirm payment</h2>
              <span>{paymentStatuses.length} options</span>
            </div>

            <form className="order-editor" onSubmit={handlePaymentSave}>
              <label>
                <span>Payment status</span>
                <select
                  value={paymentStatusDraft}
                  onChange={(event) => setPaymentStatusDraft(event.target.value)}
                >
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <p className="order-help">
                Mark manual transfers as paid only after the receipt has been checked.
              </p>

              <button type="submit" className="admin-button" disabled={saving}>
                {saving ? 'Saving...' : paymentStatusDraft === 'Paid' ? 'Confirm payment' : 'Save payment status'}
              </button>
            </form>
          </article>
        </aside>
      </section>
    </main>
  )
}

export default AdminOrderPage
