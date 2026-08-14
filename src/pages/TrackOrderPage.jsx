import { useMemo, useState } from 'react'
import { getFriendlyErrorMessage } from '../lib/errorMessages'
import './TrackOrderPage.css'

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

function getStatusTone(status) {
  switch (status) {
    case 'Delivered':
      return 'success'
    case 'Paid':
    case 'Processing':
    case 'Ready':
    case 'Out for Delivery':
      return 'info'
    case 'Pending Payment':
    case 'Awaiting Prescription':
    case 'Under Review':
      return 'pending'
    case 'Rejected':
    case 'Cancelled':
      return 'danger'
    default:
      return 'muted'
  }
}

function getTimelineStep(status) {
  switch (status) {
    case 'Pending Payment':
      return 0
    case 'Paid':
      return 1
    case 'Awaiting Prescription':
    case 'Under Review':
      return 2
    case 'Approved':
    case 'Processing':
    case 'Ready':
      return 3
    case 'Out for Delivery':
    case 'Delivered':
      return 4
    default:
      return 0
  }
}

function formatAmount(value) {
  return `NGN ${Number(value || 0).toLocaleString()}`
}

function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [session, setSession] = useState(null)
  const [trackingResult, setTrackingResult] = useState(null)
  const [loadingSession, setLoadingSession] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const showCodeStage = session?.hasActiveCode || session?.status === 'code_active'
  const canSendCode = session?.canSendCode !== false
  const timelineStep = getTimelineStep(trackingResult?.order?.status)
  const statusTone = useMemo(() => {
    if (!session) {
      return 'muted'
    }

    return getStatusTone(
      session.status === 'rate_limited'
        ? 'Cancelled'
        : session.status === 'code_active'
          ? 'Out for Delivery'
          : 'Pending Payment',
    )
  }, [session])

  const resetResult = () => {
    setTrackingResult(null)
    setMessage('')
    setError('')
  }

  const handleSessionSubmit = async (event) => {
    event.preventDefault()
    setLoadingSession(true)
    resetResult()

    try {
      const response = await fetch(`${apiBaseUrl}/api/tracking/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber,
          email,
        }),
      })

      const payload = await response.json()

      if (!response.ok && response.status !== 429) {
        throw new Error(payload.message || 'Unable to check this order.')
      }

      setSession(payload)
      setMessage(payload.message || '')
      setError(response.ok ? '' : getFriendlyErrorMessage(payload, 'We could not check that order right now.'))
      setOtp('')
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'We could not check that order right now.'))
      setMessage('')
      setSession(null)
    } finally {
      setLoadingSession(false)
    }
  }

  const handleSendCode = async () => {
    setSendingCode(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/tracking/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber,
          email,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to send the tracking code.')
      }

      setSession((current) => ({
        ...(current || {}),
        ...payload,
        hasActiveCode: true,
        status: 'code_active',
      }))
      setMessage(payload.message || 'Tracking code sent.')
      setError('')
      setOtp('')
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'We could not send the tracking code right now.'))
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyCode = async (event) => {
    event.preventDefault()
    setVerifyingCode(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/tracking/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber,
          email,
          otp,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to verify the tracking code.')
      }

      setTrackingResult(payload)
      setMessage(payload.message || 'Tracking confirmed.')
      setError('')
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'We could not verify that code right now.'))
    } finally {
      setVerifyingCode(false)
    }
  }

  return (
    <div className="track-shell">
      <section className="track-hero">
        <div className="track-hero__copy">
          <p className="track-kicker">Tracking</p>
          <h1>Check your order without creating an account.</h1>
          <p>
            Enter your order number and email, then use the code we send to your inbox to view
            the latest status.
          </p>
        </div>

        <aside className="track-hero__panel">
          <div className={`track-status track-status--${statusTone}`}>
            <span>{session?.status === 'code_active' ? 'Code ready' : 'Private tracking'}</span>
            <strong>
              {session?.status === 'rate_limited'
                ? 'Too many requests'
                : session?.status === 'code_active'
                  ? 'Enter your code'
                  : 'Secure by email'}
            </strong>
          </div>
          <p>
            We only show order updates after the email code is confirmed. Prescription details stay
            private.
          </p>
        </aside>
      </section>

      <section className="track-layout">
        <article className="track-card">
          <div className="track-card__head">
            <div>
              <p className="track-section-kicker">Step 1</p>
              <h2>Find your order</h2>
            </div>
          </div>

          <form className="track-form" onSubmit={handleSessionSubmit}>
            <label className="track-field">
              <span>Order number</span>
              <input
                type="text"
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="MS-20384"
                required
              />
            </label>

            <label className="track-field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <button type="submit" className="track-button" disabled={loadingSession}>
              {loadingSession ? 'Checking order...' : 'Track order'}
            </button>
          </form>

          {error ? <p className="track-message track-message--error">{error}</p> : null}
          {message ? <p className="track-message track-message--success">{message}</p> : null}

          {session ? (
            <div className="track-session">
              <div className="track-session__row">
                <span>Code status</span>
                <strong>{session.status === 'code_active' ? 'Active' : session.status === 'rate_limited' ? 'Limited' : 'Ready'}</strong>
              </div>
              <div className="track-session__row">
                <span>Code lasts</span>
                <strong>10 minutes</strong>
              </div>
              <div className="track-session__row">
                <span>Requests left</span>
                <strong>{session.remainingSends ?? 5}</strong>
              </div>
              <div className="track-session__row">
                <span>Window resets</span>
                <strong>{session.windowResetsAt ? formatDate(session.windowResetsAt) : 'Soon'}</strong>
              </div>
            </div>
          ) : null}

          {showCodeStage ? (
            <form className="track-code-form" onSubmit={handleVerifyCode}>
              <label className="track-field">
                <span>Latest code from your email</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  required
                />
              </label>

              <div className="track-actions">
                <button type="submit" className="track-button" disabled={verifyingCode}>
                  {verifyingCode ? 'Verifying...' : 'Verify code'}
                </button>

                <button
                  type="button"
                  className="track-button track-button--ghost"
                  onClick={handleSendCode}
                  disabled={sendingCode || !canSendCode}
                >
                  {sendingCode ? 'Sending...' : 'Send code again'}
                </button>
              </div>

              <p className="track-note">
                {session?.codeExpiresAt
                  ? `The code expires at ${formatDate(session.codeExpiresAt)}.`
                  : 'Each code stays active for 10 minutes.'}
              </p>

              {!canSendCode ? (
                <p className="track-note track-note--warn">
                  You have reached the limit of 5 tracking code sends in 30 minutes for this
                  order. Please wait before requesting another one.
                </p>
              ) : (
                <p className="track-note">
                  If you request another code before this one expires, we will send the same code
                  again.
                </p>
              )}
            </form>
          ) : session?.status === 'ready_to_send' ? (
            <div className="track-send-prompt">
              <p>
                We found the order. Send a tracking code to your email to continue and confirm the
                latest status.
              </p>
              <button
                type="button"
                className="track-button"
                onClick={handleSendCode}
                disabled={sendingCode || !canSendCode}
              >
                {sendingCode ? 'Sending...' : 'Send track code'}
              </button>
              <p className="track-note">
                The code lasts 10 minutes and you can request up to 5 codes every 30 minutes.
              </p>
            </div>
          ) : null}
        </article>

        <aside className="track-card track-card--soft">
          <div className="track-card__head">
            <div>
              <p className="track-section-kicker">What you will see</p>
              <h2>Only the order details you need</h2>
            </div>
          </div>

          <ul className="track-list">
            <li>Current order status</li>
            <li>Payment status</li>
            <li>Ordered items</li>
            <li>Delivery progress</li>
          </ul>

          <div className="track-summary">
            <p>
              We do not show prescription images on this page. The tracking code keeps the details
              private until you confirm access through your email.
            </p>
          </div>

          {trackingResult ? (
            <section className="track-result">
              <div className="track-result__header">
                <div>
                  <p className="track-section-kicker">Verified</p>
                  <h2>{trackingResult.order?.order_number}</h2>
                </div>
                <span className={`track-status track-status--${getStatusTone(trackingResult.order?.status)}`}>
                  {trackingResult.order?.status}
                </span>
              </div>

              <div className="track-result__meta">
                <div>
                  <span>Payment status</span>
                  <strong>{trackingResult.order?.payment_status}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{formatAmount(trackingResult.order?.total_amount)}</strong>
                </div>
                <div>
                  <span>Items</span>
                  <strong>{trackingResult.items?.length || 0}</strong>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{formatDate(trackingResult.order?.updated_at)}</strong>
                </div>
              </div>

              <div className="track-timeline">
                {[
                  'Order placed',
                  'Payment confirmed',
                  'Pharmacy review',
                  'On the move',
                  'Delivered',
                ].map((stepLabel, index) => (
                  <div
                    key={stepLabel}
                    className={`track-timeline__step ${
                      timelineStep > index ? 'is-done' : timelineStep === index ? 'is-current' : ''
                    }`}
                  >
                    <span className="track-timeline__dot" />
                    <strong>{stepLabel}</strong>
                  </div>
                ))}
              </div>

              <div className="track-details">
                <div className="track-details__card">
                  <span>Customer</span>
                  <strong>{trackingResult.order?.customer_name || 'Customer'}</strong>
                </div>
                <div className="track-details__card">
                  <span>Placed on</span>
                  <strong>{formatDate(trackingResult.order?.created_at)}</strong>
                </div>
                <div className="track-details__card track-details__card--wide">
                  <span>Delivery address</span>
                  <strong>{trackingResult.order?.delivery_address || 'Not provided'}</strong>
                </div>
                <div className="track-details__card">
                  <span>Prescription</span>
                  <strong>
                    {trackingResult.order?.requires_prescription
                      ? trackingResult.order?.prescription_status || 'Required'
                      : 'Not needed'}
                  </strong>
                </div>
              </div>

              {trackingResult.order?.rejection_reason ? (
                <div className="track-rejection">
                  <span>Review note</span>
                  <p>{trackingResult.order.rejection_reason}</p>
                </div>
              ) : null}

              <div className="track-items">
                {(trackingResult.items || []).map((item) => (
                  <div key={item.id} className="track-item">
                    <div>
                      <strong>{item.name}</strong>
                      <span>Qty {item.quantity}</span>
                    </div>
                    <strong>{formatAmount(Number(item.unit_price || 0) * Number(item.quantity || 0))}</strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </div>
  )
}

export default TrackOrderPage
