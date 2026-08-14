import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import useCart from '../context/useCart'
import { getFriendlyErrorMessage } from '../lib/errorMessages'
import './OrderConfirmationPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function OrderConfirmationPage() {
  const location = useLocation()
  const { orderNumber } = useParams()
  const [searchParams] = useSearchParams()
  const { clearCart } = useCart()
  const [verification, setVerification] = useState({
    loading: Boolean(searchParams.get('reference')),
    verified: false,
    error: '',
    transactionStatus: '',
    order: location.state?.order || null,
    payment: null,
  })

  const reference = useMemo(
    () => searchParams.get('reference') || searchParams.get('trxref') || '',
    [searchParams],
  )

  useEffect(() => {
    let isMounted = true

    const verifyPayment = async () => {
      if (!reference) {
        if (isMounted) {
          setVerification((current) => ({ ...current, loading: false }))
        }
        return
      }

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/orders/payments/verify?reference=${encodeURIComponent(reference)}`,
        )

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to verify payment right now.')
        }

        if (isMounted) {
          setVerification({
            loading: false,
            verified: Boolean(payload.verified),
            error: payload.verified ? '' : payload.message || 'Payment is still being processed.',
            transactionStatus: payload.transactionStatus || '',
            order: payload.order || location.state?.order || null,
            payment: payload.payment || null,
          })
        }
      } catch (error) {
        if (isMounted) {
          setVerification((current) => ({
            ...current,
            loading: false,
            error: getFriendlyErrorMessage(error, 'We could not verify your payment right now.'),
          }))
        }
      }
    }

    verifyPayment()

    return () => {
      isMounted = false
    }
  }, [location.state?.order, reference])

  useEffect(() => {
    if (verification.verified) {
      clearCart()
    }
  }, [clearCart, verification.verified])

  if (!orderNumber) {
    return <Navigate to="/products" replace />
  }

  const order = verification.order
  const amount = Number(order?.total_amount || 0)
  const paymentStatus = verification.verified
    ? 'Paid'
    : verification.transactionStatus
      ? verification.transactionStatus
      : order?.payment_status || 'Pending Payment'

  return (
    <main className="confirmation-shell">
      <section className="confirmation-card">
        <p className="confirmation-kicker">Order created</p>
        <h1>
          {verification.loading
            ? 'Verifying your payment...'
            : verification.verified
              ? 'Payment confirmed'
              : 'We received your order'}
        </h1>

        <p>
          Your order number is <strong>{orderNumber}</strong>.{' '}
          {verification.loading
            ? 'Please wait while we confirm your transaction.'
            : verification.verified
              ? 'Your payment has been confirmed and your order is ready for the next step.'
              : 'We are keeping your order ready while payment is completed.'}
        </p>

        {verification.error ? <p className="confirmation-error">{verification.error}</p> : null}

        <div className="confirmation-panel">
          <div>
            <span>Status</span>
            <strong>{order?.status || 'Pending Payment'}</strong>
          </div>
          <div>
            <span>Payment</span>
            <strong>{paymentStatus}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>NGN {amount.toLocaleString()}</strong>
          </div>
        </div>

        <p className="confirmation-note">
          {verification.verified
            ? 'Your payment has been verified successfully.'
            : 'If payment is still processing, you can refresh this page after a few seconds.'}
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
