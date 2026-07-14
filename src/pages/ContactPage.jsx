import SectionHeading from '../components/ui/SectionHeading'
import { supportContacts } from '../data/siteContent'
import './ContactPage.css'

function ContactPage() {
  return (
    <div className="page">
      <section className="contact-hero">
        <SectionHeading
          eyebrow="Contact"
          title="Talk to the pharmacy team"
          description="Need help with an order, a prescription, or delivery? Our team is here to support you every step of the way."
        />
      </section>

      <section className="contact-grid">
        {supportContacts.map((item) => (
          <article className="contact-card" key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>
    </div>
  )
}

export default ContactPage
