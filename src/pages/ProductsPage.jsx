import { useEffect, useMemo, useState } from 'react'
import SectionHeading from '../components/ui/SectionHeading'
import ProductCard from '../components/home/ProductCard'
import { categories as fallbackCategories } from '../data/siteContent'
import './ProductsPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="catalog-search__svg"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function ProductSkeletonCard() {
  return (
    <article className="product-skeleton">
      <div className="product-skeleton__image" />
      <div className="product-skeleton__content">
        <div className="product-skeleton__line product-skeleton__line--title" />
        <div className="product-skeleton__line product-skeleton__line--chip" />
        <div className="product-skeleton__line product-skeleton__line--body" />
        <div className="product-skeleton__line product-skeleton__line--body product-skeleton__line--short" />
        <div className="product-skeleton__footer">
          <div className="product-skeleton__line product-skeleton__line--price" />
          <div className="product-skeleton__button" />
        </div>
      </div>
    </article>
  )
}

function ProductsPage() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [products, setProducts] = useState([])
  const [availableCategories, setAvailableCategories] = useState(['All', ...fallbackCategories])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadCatalog = async () => {
      setLoading(true)
      setError('')

      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/catalog/products`),
          fetch(`${apiBaseUrl}/api/catalog/categories`),
        ])

        const productsPayload = await productsResponse.json()
        const categoriesPayload = await categoriesResponse.json()

        if (!productsResponse.ok) {
          throw new Error(productsPayload.message || 'Unable to load products.')
        }

        if (isMounted && Array.isArray(productsPayload.products)) {
          setProducts(
            productsPayload.products.map((product) => ({
              id: product.id,
              slug: product.slug,
              category: product.category,
              name: product.name,
              description: product.description,
              price: Number(product.price || 0),
              note: product.prescriptionRequired ? 'Prescription required' : 'Available',
              image:
                Array.isArray(product.images) && product.images.length > 0
                  ? product.images[0]
                  : '/product-placeholder.svg',
              inStock: Number(product.stockQuantity || 0) > 0,
              prescriptionRequired: Boolean(product.prescriptionRequired),
            })),
          )
        }

        if (
          isMounted &&
          categoriesResponse.ok &&
          Array.isArray(categoriesPayload.categories) &&
          categoriesPayload.categories.length > 0
        ) {
          setAvailableCategories([
            'All',
            ...categoriesPayload.categories.map((category) => category.name),
          ])
        }
      } catch {
        if (isMounted) {
          setError('Unable to load live catalog data right now.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory
      const haystack = `${product.name} ${product.description} ${product.category}`.toLowerCase()
      const matchesQuery = normalizedQuery === '' || haystack.includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [query, selectedCategory, products])

  return (
    <div className="page">
      <section className="catalog-hero">
        <SectionHeading
          eyebrow="Catalog"
          title="Browse medicines with confidence"
          description="Search quickly, filter by category, and find the medicines that fit your needs without friction."
        />
      </section>

      <section className="catalog-toolbar" aria-label="Product filters">
        <label className="catalog-search">
          <span className="catalog-search__icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search medicines"
            aria-label="Search medicines"
          />
        </label>

        <div className="catalog-chips" role="list" aria-label="Category filters">
          <button
            key="All"
            type="button"
            className={`catalog-chip${selectedCategory === 'All' ? ' is-active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All
          </button>
          {availableCategories
            .filter((category) => category !== 'All')
            .map((category) => (
            <button
              key={category}
              type="button"
              className={`catalog-chip${selectedCategory === category ? ' is-active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="catalog-results" aria-live="polite">
        {loading ? <p className="catalog-results__count">Loading catalog...</p> : null}
        {!loading && error ? <p className="catalog-results__count">{error}</p> : null}
        {!loading ? (
          <p className="catalog-results__count">
            Showing {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'medicine' : 'medicines'}
          </p>
        ) : null}

        {loading ? (
          <div className="catalog-grid" aria-label="Loading medicines">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductSkeletonCard key={`skeleton-${index}`} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="catalog-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <h3>No products match your search</h3>
            <p>Try a different keyword or choose a different category.</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default ProductsPage
