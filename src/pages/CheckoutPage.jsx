import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import useCart from '../context/useCart'
import './CheckoutPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasPrescriptionItems = useMemo(
    () => items.some((item) => item.prescriptionRequired),
    [items],
  )

  if (items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to create your order.')
      }

      clearCart()
      navigate(`/checkout/success/${payload.order.order_number}`, {
        state: { order: payload.order },
        replace: true,
      })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="checkout-shell">
      <section className="checkout-hero">
        <div>
          <p className="checkout-kicker">Guest checkout</p>
          <h1>Complete your order</h1>
          <p>
            No account is needed for regular medicines. Prescription-only items follow a separate
            approval process.
          </p>
        </div>
        <div className="checkout-summary-chip">
          <span>Subtotal</span>
          <strong>NGN {subtotal.toLocaleString()}</strong>
        </div>
      </section>

      {hasPrescriptionItems ? (
        <p className="checkout-alert">
          Your cart contains prescription-only items. Please remove them to continue with regular
          medicine checkout.
        </p>
      ) : null}
      {error ? <p className="checkout-error">{error}</p> : null}

      <section className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Delivery details</h2>
          <div className="checkout-grid">
            <label>
              <span>Full name</span>
              <input
                value={form.customerName}
                onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(event) => setForm((current) => ({ ...current, customerEmail: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Phone number</span>
              <input
                value={form.customerPhone}
                onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
                required
              />
            </label>
            <label className="checkout-grid__full">
              <span>Delivery address</span>
              <textarea
                rows={4}
                value={form.deliveryAddress}
                onChange={(event) =>
                  setForm((current) => ({ ...current, deliveryAddress: event.target.value }))
                }
                required
              />
            </label>
          </div>

          <div className="checkout-actions">
            <button type="submit" className="checkout-button" disabled={loading || hasPrescriptionItems}>
              {loading ? 'Creating order...' : 'Place order'}
            </button>
            <Link className="checkout-link" to="/cart">
              Back to cart
            </Link>
          </div>
        </form>

        <aside className="checkout-summary">
          <h2>Order summary</h2>
          <div className="checkout-items">
            {items.map((item) => (
              <article key={item.id} className="checkout-item">
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.category}</p>
                </div>
                <strong>NGN {(item.price * item.quantity).toLocaleString()}</strong>
              </article>
            ))}
          </div>
          <div className="checkout-total">
            <span>Total</span>
            <strong>NGN {subtotal.toLocaleString()}</strong>
          </div>
          <p className="checkout-note">
            Your order will be saved and ready for payment.
          </p>
        </aside>
      </section>
    </main>
  )
}

export default CheckoutPage
