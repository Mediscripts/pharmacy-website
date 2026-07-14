import './SectionHeading.css'

function SectionHeading({ eyebrow, title, description, align = 'left' }) {
  return (
    <div className={`section-heading${align === 'center' ? ' is-centered' : ''}`}>
      <p className="section-heading__eyebrow">{eyebrow}</p>
      <h2 className="section-heading__title">{title}</h2>
      {description ? <p className="section-heading__description">{description}</p> : null}
    </div>
  )
}

export default SectionHeading
