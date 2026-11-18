import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MarkdownContent from '../components/health/MarkdownContent'
import CreditedImage from '../components/health/CreditedImage'
import './HealthHubPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function HealthArticlePage() {
  const { articleSlug } = useParams()
  const [article, setArticle] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${apiBaseUrl}/api/health-hub/articles/${encodeURIComponent(articleSlug)}`)
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.message || 'Article not found.')
        if (active) { setArticle(payload.article); setRelated(payload.related || []) }
      } catch (loadError) { if (active) setError(loadError.message || 'Unable to load this article.') }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [articleSlug])

  useEffect(() => {
    if (article) {
      document.title = `${article.seo_title || article.title} | Mediscripts Pharmacy`
      let description = document.querySelector('meta[name="description"]')
      if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.appendChild(description) }
      description.content = article.seo_description || article.summary || ''
      const canonicalUrl = `${window.location.origin}/health-hub/${article.slug}`
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
      canonical.href = canonicalUrl
      const setMeta = (property, value) => {
        let meta = document.querySelector(`meta[property="${property}"]`)
        if (!meta) { meta = document.createElement('meta'); meta.setAttribute('property', property); document.head.appendChild(meta) }
        meta.content = value
      }
      setMeta('og:type', 'article')
      setMeta('og:title', article.seo_title || article.title)
      setMeta('og:description', article.seo_description || article.summary || '')
      setMeta('og:url', canonicalUrl)
      if (article.cover_image_url) setMeta('og:image', article.cover_image_url)
      let structuredData = document.querySelector('#health-article-structured-data')
      if (!structuredData) { structuredData = document.createElement('script'); structuredData.id = 'health-article-structured-data'; structuredData.type = 'application/ld+json'; document.head.appendChild(structuredData) }
      structuredData.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.seo_description || article.summary || '',
        image: article.cover_image_url ? [article.cover_image_url] : undefined,
        datePublished: article.published_at,
        dateModified: article.reviewed_at || article.published_at,
        author: { '@type': 'Person', name: article.author_name || 'Mediscripts Health Team' },
        editor: { '@type': 'Person', name: article.reviewer_name },
        mainEntityOfPage: canonicalUrl,
      })
    }
  }, [article])

  if (loading) return <main className="health-article-state">Loading article…</main>
  if (error || !article) return <main className="health-article-state"><h1>We couldn’t find that article</h1><p>{error}</p><Link to="/health-hub">Browse the Health Hub</Link></main>

  return <main className="health-article-page">
    <div className="health-article-page__breadcrumbs"><Link to="/health-hub">Health Hub</Link><span>/</span><Link to={`/health-hub/category/${article.category_slug}`}>{article.category}</Link></div>
    <article>
      {article.cover_image_url ? <CreditedImage className="health-article-page__cover" src={article.cover_image_url} alt="" credit={article.cover_image_credit} sourceUrl={article.cover_image_source_url} loading="eager" /> : null}
      <header className="health-article-page__header"><p className="health-kicker">{article.category}</p><h1>{article.title}</h1><p className="health-article-page__summary">{article.summary}</p><div className="health-article-page__byline"><span>By {article.author_name || 'Mediscripts Health Team'}</span><span>{new Date(article.published_at).toLocaleDateString()}</span></div></header>
      <div className="health-article-page__body"><MarkdownContent content={article.body} /><div className="health-article-page__review"><strong>Reviewed by {article.reviewer_name}</strong><span>Last reviewed {new Date(article.reviewed_at).toLocaleDateString()}</span><p>This article provides general health education and is not a diagnosis or personal treatment plan. Speak with a qualified healthcare professional about your own health.</p></div></div>
    </article>
    {related.length ? <section className="health-related"><div className="health-hub__section-head"><div><p className="health-kicker">Keep learning</p><h2>Related articles</h2></div><Link to={`/health-hub/category/${article.category_slug}`}>More in {article.category} →</Link></div><div className="health-card-grid">{related.map((item) => <article className="health-card health-card--related" key={item.id}><div className="health-card__image">{item.cover_image_url ? <CreditedImage src={item.cover_image_url} alt="" credit={item.cover_image_credit} sourceUrl={item.cover_image_source_url} /> : <span>Mediscripts Health Hub</span>}</div><div className="health-card__body"><h3><Link to={`/health-hub/${item.slug}`}>{item.title}</Link></h3><p>{item.summary}</p></div></article>)}</div></section> : null}
  </main>
}

export default HealthArticlePage
