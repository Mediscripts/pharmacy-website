import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { getFriendlyErrorMessage } from '../lib/errorMessages'
import './AdminPharmacistBookingsPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function formatLagosTime(value) {
  if (!value) return '—'
  return `${new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value))} WAT`
}

function toLagosInput(value) {
  if (!value) return ''
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value)).map((part) => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

function toUtcIso(value) {
  return new Date(`${value}:00+01:00`).toISOString()
}

function AdminPharmacistBookingsPage() {
  const { isAdmin, loading, accessToken } = useAuth()
  const [bookings, setBookings] = useState([])
  const [scheduledTimes, setScheduledTimes] = useState({})
  const [adminNotes, setAdminNotes] = useState({})
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [savingId, setSavingId] = useState('')

  useEffect(() => {
    if (loading || !isAdmin || !accessToken) return undefined
    let active = true
    const load = async () => {
      setPageLoading(true)
      setPageError('')
      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/pharmacist-bookings`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.message || 'Unable to load pharmacist call requests.')
        if (active) {
          setBookings(payload.bookings || [])
          setScheduledTimes(Object.fromEntries((payload.bookings || []).map((booking) => [booking.id, toLagosInput(booking.scheduled_at || booking.requested_at)])))
        }
      } catch (error) {
        if (active) setPageError(getFriendlyErrorMessage(error, 'We could not load pharmacist call requests.'))
      } finally {
        if (active) setPageLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [accessToken, isAdmin, loading])

  const updateBooking = async (booking, status, selectedTime = '') => {
    setSavingId(booking.id)
    setActionMessage('')
    try {
      const scheduledAt = status === 'declined'
        ? null
        : toUtcIso(selectedTime || toLagosInput(booking.requested_at))
      const response = await fetch(`${apiBaseUrl}/api/admin/pharmacist-bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status, scheduledAt, adminNote: adminNotes[booking.id] || '' }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || 'Unable to update this request.')
      setBookings((current) => current.map((item) => item.id === booking.id ? payload.booking : item))
      setActionMessage(payload.emailSent
        ? 'Request updated and an email was sent to the customer.'
        : payload.message || 'Request updated, but the customer email was not sent.')
    } catch (error) {
      setActionMessage(getFriendlyErrorMessage(error, 'We could not update this request.'))
    } finally {
      setSavingId('')
    }
  }

  if (loading) return <main className="admin-shell"><p className="admin-helper">Checking admin access...</p></main>
  if (!isAdmin) return <Navigate to="/admin/login" replace />

  return <main className="admin-shell pharmacist-bookings-admin">
    <div className="pharmacist-bookings-admin__top"><div><p className="admin-kicker">Pharmacy support</p><h1>Pharmacist call requests</h1><p>Confirm the requested time or offer a different time. Customers are emailed after you update a request.</p></div><Link className="admin-button admin-button--ghost" to="/admin">Back to dashboard</Link></div>
    {pageLoading ? <p className="admin-helper">Loading call requests…</p> : null}
    {pageError ? <p className="admin-error">{pageError}</p> : null}
    {actionMessage ? <p className="admin-helper" role="status">{actionMessage}</p> : null}
    <section className="pharmacist-bookings-list">
      {bookings.map((booking) => <article className="pharmacist-booking-card" key={booking.id}>
        <header><div><p className="pharmacist-booking-card__kicker">Requested {formatLagosTime(booking.created_at)}</p><h2>{booking.customer_name || 'Customer'}</h2></div><span className={`pharmacist-booking-status pharmacist-booking-status--${booking.status}`}>{booking.status}</span></header>
        <div className="pharmacist-booking-card__details"><a href={`mailto:${booking.customer_email}`}>{booking.customer_email}</a>{booking.customer_phone ? <a href={`tel:${booking.customer_phone}`}>{booking.customer_phone}</a> : null}<p><strong>Requested time:</strong> {formatLagosTime(booking.requested_at)}</p>{booking.scheduled_at ? <p><strong>Current scheduled time:</strong> {formatLagosTime(booking.scheduled_at)}</p> : null}</div>
        <label className="pharmacist-booking-card__time"><span>Confirm or offer this time <small>(WAT)</small></span><input type="datetime-local" value={scheduledTimes[booking.id] || ''} min={toLagosInput(new Date().toISOString())} onChange={(event) => setScheduledTimes((current) => ({ ...current, [booking.id]: event.target.value }))} /></label>
        <label className="pharmacist-booking-card__note"><span>Message to customer <small>(optional)</small></span><textarea rows="2" maxLength="500" value={adminNotes[booking.id] || ''} onChange={(event) => setAdminNotes((current) => ({ ...current, [booking.id]: event.target.value }))} placeholder="Add a short note to the email" /></label>
        <div className="pharmacist-booking-card__actions"><button type="button" className="admin-button" disabled={savingId === booking.id || !scheduledTimes[booking.id]} onClick={() => updateBooking(booking, 'confirmed', scheduledTimes[booking.id])}>Confirm selected time</button><button type="button" className="admin-button admin-button--ghost" disabled={savingId === booking.id || !scheduledTimes[booking.id]} onClick={() => updateBooking(booking, 'rescheduled', scheduledTimes[booking.id])}>Offer another time</button><button type="button" className="pharmacist-booking-card__decline" disabled={savingId === booking.id} onClick={() => updateBooking(booking, 'declined')}>Decline request</button></div>
      </article>)}
      {!pageLoading && !pageError && bookings.length === 0 ? <div className="pharmacist-bookings-empty"><h2>No call requests yet</h2><p>New requests from the public booking form will appear here.</p></div> : null}
    </section>
  </main>
}

export default AdminPharmacistBookingsPage
