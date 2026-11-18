import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import CreditedImage from '../components/health/CreditedImage'
import './HealthHubPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function ArticleCard({ article }) {
  return <article className="health-card">
    <div className="health-card__image">
      {article.cover_image_url ? <CreditedImage src={article.cover_image_url} alt="" credit={article.cover_image_credit} sourceUrl={article.cover_image_source_url} /> : <span>Mediscripts Health Hub</span>}
    </div>
    <div className="health-card__body">
      <span className="health-card__category">{article.category}</span>
      <h2><Link to={`/health-hub/${article.slug}`}>{article.title}</Link></h2>
      <p>{article.summary}</p>
      <div className="health-card__footer"><span>{article.author_name || 'Mediscripts Health Team'}</span><span>{article.published_at ? new Date(article.published_at).toLocaleDateString() : ''}</span></div>
      <Link className="health-card__read" to={`/health-hub/${article.slug}`}>Read article <span aria-hidden="true">→</span></Link>
    </div>
  </article>
}

function HealthHubPage() {
  const { categorySlug = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [categories, setCategories] = useState([])
  const [articles, setArticles] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const searchQuery = searchParams.get('q') || ''

  useEffect(() => { setQuery(searchQuery) }, [searchQuery])
  useEffect(() => { setPage(1); setArticles([]) }, [categorySlug, searchQuery])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [categoryResponse, articleResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/health-hub/categories`),
          fetch(`${apiBaseUrl}/api/health-hub/articles?limit=24&page=${page}${categorySlug ? `&category=${encodeURIComponent(categorySlug)}` : ''}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`),
        ])
        const [categoryPayload, articlePayload] = await Promise.all([categoryResponse.json(), articleResponse.json()])
        if (!categoryResponse.ok) throw new Error(categoryPayload.message || 'Unable to load categories.')
        if (!articleResponse.ok) throw new Error(articlePayload.message || 'Unable to load articles.')
        if (active) {
          setCategories(categoryPayload.categories || [])
          setArticles((current) => page === 1 ? (articlePayload.articles || []) : [...current, ...(articlePayload.articles || [])])
          setHasMore(Boolean(articlePayload.hasMore))
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'The Health Hub could not be loaded right now.')
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [categorySlug, page, searchQuery])

  const activeCategory = categories.find((category) => category.slug === categorySlug)
  const title = activeCategory?.name || 'Health knowledge for everyday life'

  useEffect(() => {
    document.title = `${activeCategory?.name || 'Mediscripts Health Hub'} | Mediscripts Pharmacy`
    const descriptionText = activeCategory?.description || 'Read practical health education and medication safety articles from Mediscripts Pharmacy.'
    let description = document.querySelector('meta[name="description"]')
    if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.appendChild(description) }
    description.content = descriptionText
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = `${window.location.origin}${activeCategory ? `/health-hub/category/${activeCategory.slug}` : '/health-hub'}`
  }, [activeCategory])

  const submitSearch = (event) => {
    event.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (query.trim()) next.set('q', query.trim())
    else next.delete('q')
    setSearchParams(next)
  }

  return <main className="health-hub">
    <section className="health-hub__hero">
      <div className="health-hub__hero-copy"><p className="health-kicker">Mediscripts Health Hub</p><h1>{title}</h1><p>Clear, practical health education to help you make informed choices and know when to speak with a qualified health professional.</p><form className="health-search" onSubmit={submitSearch}><label htmlFor="health-search-input">Search health articles</label><div><input id="health-search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try medication safety or hydration" /><button type="submit">Search</button></div></form></div>
      <div className="health-hub__hero-note"><span aria-hidden="true">✳</span><p>Our articles share general health information. They do not replace a personal consultation with a qualified healthcare professional.</p></div>
    </section>

    <nav className="health-categories" aria-label="Health topics">
      <Link className={!categorySlug ? 'is-active' : ''} to={`/health-hub${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}>All topics</Link>
      {categories.map((category) => <Link className={category.slug === categorySlug ? 'is-active' : ''} key={category.id} to={`/health-hub/category/${category.slug}${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}>{category.name}</Link>)}
    </nav>

    <section className="health-hub__articles"><div className="health-hub__section-head"><div><p className="health-kicker">{searchQuery ? 'Search results' : activeCategory ? 'Explore this topic' : 'Latest reading'}</p><h2>{searchQuery ? `Results for “${searchQuery}”` : activeCategory?.name || 'Recently published'}</h2></div><span>{articles.length} article{articles.length === 1 ? '' : 's'}</span></div>
      {loading ? <p className="health-state">Loading health articles…</p> : null}
      {error ? <p className="health-state health-state--error">{error}</p> : null}
      {!loading && !error && articles.length ? <div className="health-card-grid">{articles.map((article) => <ArticleCard key={article.id} article={article} />)}</div> : null}
      {!loading && hasMore ? <button className="health-load-more" type="button" onClick={() => setPage((current) => current + 1)}>Load more articles</button> : null}
      {!loading && !error && !articles.length ? <div className="health-empty"><h3>No articles here yet</h3><p>Try another topic or check back soon for new health education.</p><Link to="/health-hub">Browse all topics</Link></div> : null}
    </section>
  </main>
}

export default HealthHubPage
