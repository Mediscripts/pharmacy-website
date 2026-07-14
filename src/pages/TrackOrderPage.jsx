import SectionHeading from '../components/ui/SectionHeading'
import './TrackOrderPage.css'

function TrackOrderPage() {
  return (
    <div className="page">
      <section className="track-hero">
        <SectionHeading
          eyebrow="Tracking"
          title="Track your order with ease"
          description="Enter your order number and email, verify with a one-time code, and stay updated on your delivery in seconds."
        />
      </section>

      <section className="track-layout">
        <form className="track-form">
          <label>
            Order Number
            <input type="text" placeholder="MS-20384" />
          </label>
          <label>
            Email Address
            <input type="email" placeholder="you@example.com" />
          </label>
          <button type="button">Send OTP</button>
        </form>

        <aside className="track-panel">
          <h2>What you will see</h2>
          <ul>
            <li>Order status</li>
            <li>Payment status</li>
            <li>Ordered items</li>
            <li>Delivery status</li>
          </ul>
          <p>Your prescription details stay private, and only your order updates are shared here.</p>
        </aside>
      </section>
    </div>
  )
}

export default TrackOrderPage
