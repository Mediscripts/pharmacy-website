function CreditedImage({ src, alt = '', credit = '', sourceUrl = '', className = '', loading = 'lazy' }) {
  if (!src) return null
  const safeSource = String(sourceUrl || '').startsWith('https://') ? sourceUrl : ''
  return <figure className={`credited-image${className ? ` ${className}` : ''}`}>
    <img src={src} alt={alt} loading={loading} />
    {credit || safeSource ? <figcaption>Image credit: {credit || 'Source'}{safeSource ? <> · <a href={safeSource} target="_blank" rel="noreferrer">View source</a></> : null}</figcaption> : null}
  </figure>
}

export default CreditedImage
