import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import './TransferPaymentPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Unable to read the receipt file.'))
    reader.readAsDataURL(file)
  })
}

function TransferPaymentPage() {
  const { orderNumber } = useParams()
  const [settings, setSettings] = useState(null)
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptDataUrl, setReceiptDataUrl] = useState('')
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadSettings = async () => {
      setLoadingSettings(true)

      try {
        const response = await fetch(`${apiBaseUrl}/api/orders/transfer/settings`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load transfer details.')
        }

        if (isMounted) {
          setSettings(payload.settings || null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setLoadingSettings(false)
        }
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [])

  const handleReceiptChange = async (event) => {
    const file = event.target.files?.[0] || null
    setReceiptFile(file)

    if (!file) {
      setReceiptDataUrl('')
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setReceiptDataUrl(dataUrl)
    } catch (err) {
      setError(err.message)
      setReceiptFile(null)
      setReceiptDataUrl('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/orders/transfer/receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber,
          email,
          note,
          receiptDataUrl,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to submit your receipt.')
      }

      setSubmitted(true)
      setMessage(payload.message || 'We received your receipt and are reviewing it now.')
      setNote('')
      setReceiptFile(null)
      setReceiptDataUrl('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const bankName = settings?.bank_name || 'Bank details will appear here'
  const accountName = settings?.account_name || 'Account name pending'
  const accountNumber = settings?.account_number || 'Account number pending'
  const instructions =
    settings?.instructions ||
    'Use your order number as the transfer reference so we can match your payment quickly.'

  return (
    <main className="transfer-shell">
      <section className="transfer-hero">
        <div className="transfer-hero__copy">
          <p className="transfer-kicker">Manual payment</p>
          <h1>Complete your transfer and upload the receipt.</h1>
          <p>
            Use the account details below, include your order number in the transfer note, then
            send us the receipt so we can review it.
          </p>
        </div>

        <div className="transfer-hero__badge">
          <span>Order reference</span>
          <strong>{orderNumber || 'Pending'}</strong>
        </div>
      </section>

      {loadingSettings ? <p className="transfer-note">Loading transfer details...</p> : null}
      {error ? <p className="transfer-error">{error}</p> : null}
      {message ? <p className="transfer-success">{message}</p> : null}

      <section className="transfer-layout">
        <article className="transfer-card">
          <div className="transfer-card__head">
            <div>
              <p className="transfer-section-kicker">Step 1</p>
              <h2>Send the payment</h2>
            </div>
          </div>

          <div className="transfer-bank-grid">
            <div>
              <span>Bank name</span>
              <strong>{bankName}</strong>
            </div>
            <div>
              <span>Account name</span>
              <strong>{accountName}</strong>
            </div>
            <div>
              <span>Account number</span>
              <strong>{accountNumber}</strong>
            </div>
            <div className="transfer-bank-grid__wide">
              <span>Transfer note</span>
              <strong>{instructions}</strong>
            </div>
          </div>

          <div className="transfer-tip">
            <p>
              Please include <strong>{orderNumber}</strong> in the payment description so we can
              match your transfer quickly.
            </p>
          </div>
        </article>

        <article className="transfer-card">
          <div className="transfer-card__head">
            <div>
              <p className="transfer-section-kicker">Step 2</p>
              <h2>Upload your receipt</h2>
            </div>
          </div>

          <form className="transfer-form" onSubmit={handleSubmit}>
            <label className="transfer-field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="transfer-field">
              <span>Receipt image or PDF</span>
              <input type="file" accept="image/*,application/pdf" onChange={handleReceiptChange} required />
            </label>

            <label className="transfer-field">
              <span>Note for us</span>
              <textarea
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note, if needed."
              />
            </label>

            <div className="transfer-preview">
              <span>Selected file</span>
              <strong>{receiptFile?.name || 'No file selected yet'}</strong>
            </div>

            <div className="transfer-actions">
              <button type="submit" className="transfer-button" disabled={submitting || !receiptDataUrl}>
                {submitting ? 'Sending receipt...' : 'Submit receipt'}
              </button>
              <Link className="transfer-link" to="/track-order">
                Track order later
              </Link>
            </div>
          </form>

          {submitted ? (
            <div className="transfer-complete">
              <p>We received your receipt and our team is reviewing it now.</p>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  )
}

export default TransferPaymentPage
