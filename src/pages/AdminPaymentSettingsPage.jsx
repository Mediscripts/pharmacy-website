import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import './AdminDashboardPage.css'
import './AdminPaymentSettingsPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const defaultSettings = {
  bank_name: '',
  account_name: '',
  account_number: '',
  instructions: '',
  notification_email: 'mediscriptsrx2@gmail.com',
}

function AdminPaymentSettingsPage() {
  const { isAdmin, loading, accessToken } = useAuth()
  const [settings, setSettings] = useState(defaultSettings)
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading || !isAdmin || !accessToken) {
      return undefined
    }

    let isMounted = true

    const loadSettings = async () => {
      setPageLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/payment-settings`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load payment settings.')
        }

        if (isMounted) {
          setSettings(payload.settings || defaultSettings)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setPageLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [accessToken, isAdmin, loading])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/payment-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(settings),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to save payment settings.')
      }

      setSettings(payload.settings || settings)
      setMessage('Transfer details updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

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
          <h1>Transfer payment details</h1>
          <p>
            Update the account details customers will see when they choose manual transfer at
            checkout.
          </p>
        </div>

        <div className="admin-hero__actions">
          <Link className="admin-button admin-button--ghost" to="/admin/payments">
            Back to payments
          </Link>
          <Link className="admin-button admin-button--ghost" to="/admin">
            Back to dashboard
          </Link>
        </div>
      </section>

      {pageLoading ? <p className="admin-helper">Loading transfer settings...</p> : null}
      {message ? <p className="admin-helper">{message}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      <section className="settings-layout">
        <article className="settings-card">
          <div className="settings-card__head">
            <h2>Bank details</h2>
            <p>These details appear on the customer transfer page.</p>
          </div>

          <form className="settings-form" onSubmit={handleSubmit}>
            <label>
              <span>Bank name</span>
              <input
                value={settings.bank_name}
                onChange={(event) => setSettings((current) => ({ ...current, bank_name: event.target.value }))}
                placeholder="Bank name"
              />
            </label>

            <label>
              <span>Account name</span>
              <input
                value={settings.account_name}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, account_name: event.target.value }))
                }
                placeholder="Account name"
              />
            </label>

            <label>
              <span>Account number</span>
              <input
                value={settings.account_number}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, account_number: event.target.value }))
                }
                placeholder="Account number"
              />
            </label>

            <label>
              <span>Transfer instructions</span>
              <textarea
                rows={4}
                value={settings.instructions}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, instructions: event.target.value }))
                }
                placeholder="Tell customers what to include as payment reference."
              />
            </label>

            <label>
              <span>Admin notification email</span>
              <input
                type="email"
                value={settings.notification_email}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, notification_email: event.target.value }))
                }
                placeholder="mediscriptsrx2@gmail.com"
              />
            </label>

            <button type="submit" className="admin-button" disabled={saving || pageLoading}>
              {saving ? 'Saving...' : 'Save transfer details'}
            </button>
          </form>
        </article>

        <aside className="settings-card settings-card--soft">
          <div className="settings-card__head">
            <h2>Customer preview</h2>
            <p>This is how the transfer section reads for shoppers.</p>
          </div>

          <div className="settings-preview">
            <div>
              <span>Bank name</span>
              <strong>{settings.bank_name || 'Bank name pending'}</strong>
            </div>
            <div>
              <span>Account name</span>
              <strong>{settings.account_name || 'Account name pending'}</strong>
            </div>
            <div>
              <span>Account number</span>
              <strong>{settings.account_number || 'Account number pending'}</strong>
            </div>
            <div className="settings-preview__wide">
              <span>Instructions</span>
              <strong>
                {settings.instructions ||
                  'Use the order number as the transfer reference when paying.'}
              </strong>
            </div>
            <div className="settings-preview__wide">
              <span>Admin email</span>
              <strong>{settings.notification_email || 'mediscriptsrx2@gmail.com'}</strong>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default AdminPaymentSettingsPage
