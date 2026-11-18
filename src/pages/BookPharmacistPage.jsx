import { useState } from 'react'
import './BookPharmacistPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function lagosDateTimeInputValue(date) {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}

function lagosInputToIso(value) {
  return new Date(`${value}:00+01:00`).toISOString()
}

function BookPharmacistPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', requestedAt: '', companyWebsite: '' })
  const [minimumTime] = useState(() => lagosDateTimeInputValue(new Date()))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const submitRequest = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch(`${apiBaseUrl}/api/pharmacist-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          requestedAt: lagosInputToIso(form.requestedAt),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || 'We could not submit your request.')
      setResult(payload)
      setForm({ name: '', email: '', phone: '', requestedAt: '', companyWebsite: '' })
    } catch (submitError) {
      setError(submitError.message || 'We could not submit your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="book-pharmacist-page">
    <section className="book-pharmacist-hero">
      <p className="book-pharmacist-kicker">Pharmacy support</p>
      <h1>Book a call with our pharmacist</h1>
      <p>Request a convenient time for a general pharmacy education call. The pharmacy team will email you to confirm the time or suggest another one.</p>
    </section>

    <section className="book-pharmacist-layout">
      <form className="book-pharmacist-form" onSubmit={submitRequest}>
        <h2>Request a time</h2>
        <p className="book-pharmacist-form__note">All times are shown in West Africa Time (WAT).</p>
        <label><span>Your name</span><input autoComplete="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={120} placeholder="Name (optional)" /></label>
        <label><span>Email address</span><input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} maxLength={254} required placeholder="you@example.com" /></label>
        <label><span>Phone number <small>(optional)</small></span><input type="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} maxLength={40} placeholder="For the call, if you prefer" /></label>
        <label><span>Preferred date and time</span><input type="datetime-local" value={form.requestedAt} min={minimumTime} onChange={(event) => setForm((current) => ({ ...current, requestedAt: event.target.value }))} required /></label>
        <label className="book-pharmacist-form__honeypot" aria-hidden="true" tabIndex="-1"><span>Company website</span><input autoComplete="off" tabIndex="-1" value={form.companyWebsite} onChange={(event) => setForm((current) => ({ ...current, companyWebsite: event.target.value }))} /></label>
        {error ? <p className="book-pharmacist-message book-pharmacist-message--error" role="alert">{error}</p> : null}
        {result ? <p className="book-pharmacist-message" role="status">{result.staffEmailSent && result.customerEmailSent ? 'Your request has been received. We’ll email you to confirm the time or suggest another one.' : 'Your request has been saved, but an email could not be delivered. Please contact the pharmacy to make sure we received it.'}</p> : null}
        <button className="book-pharmacist-submit" type="submit" disabled={submitting}>{submitting ? 'Sending request…' : 'Request a call'}</button>
        <p className="book-pharmacist-form__disclaimer">This service is for general pharmacy education. It is not for emergencies, diagnosis, or personal treatment advice. Please do not include medical details in this booking form.</p>
      </form>

      <aside className="book-pharmacist-info">
        <span className="book-pharmacist-info__icon" aria-hidden="true">✳</span>
        <h2>What happens next?</h2>
        <ol><li>Choose a time that works for you.</li><li>We’ll email you when the request is received.</li><li>The pharmacist team will confirm your time or offer another one by email.</li></ol>
        <p>For urgent concerns, contact a healthcare professional directly.</p>
      </aside>
    </section>
  </main>
}

export default BookPharmacistPage
