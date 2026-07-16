import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import './OrderConfirmationPage.css'

function OrderConfirmationPage() {
  const location = useLocation()
  const { orderNumber } = useParams()
  const order = location.state?.order

  if (!orderNumber) {
    return <Navigate to="/products" replace />
  }

  return (
    <main className="confirmation-shell">
      <section className="confirmation-card">
        <p className="confirmation-kicker">Order created</p>
        <h1>We received your order</h1>
        <p>
          Your order number is <strong>{orderNumber}</strong>. We will use this for payment and
          delivery updates.
        </p>

        <div className="confirmation-panel">
          <div>
            <span>Status</span>
            <strong>{order?.status || 'Pending Payment'}</strong>
          </div>
          <div>
            <span>Payment</span>
            <strong>{order?.payment_status || 'Unpaid'}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>NGN {Number(order?.total_amount || 0).toLocaleString()}</strong>
          </div>
        </div>

        <p className="confirmation-note">
          Your order has been saved and is ready for payment.
        </p>

        <div className="confirmation-actions">
          <Link className="confirmation-button" to="/products">
            Continue shopping
          </Link>
          <Link className="confirmation-link" to="/track-order">
            Track order later
          </Link>
        </div>
      </section>
    </main>
  )
}

export default OrderConfirmationPage
