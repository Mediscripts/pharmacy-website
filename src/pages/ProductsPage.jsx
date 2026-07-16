import { useDeferredValue, useMemo, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import SectionHeading from '../components/ui/SectionHeading'
import ProductCard from '../components/home/ProductCard'
import { categories as fallbackCategoryNames } from '../data/siteContent'
import './ProductsPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
const pageSize = 24

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function fetchJson(url) {
  return fetch(url).then(async (response) => {
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.message || 'Unable to load catalog data.')
    }

    return payload
  })
}

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
  const [selectedCategory, setSelectedCategory] = useState('all')
  const deferredQuery = useDeferredValue(query.trim())

  const categoriesQuery = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: () => fetchJson(`${apiBaseUrl}/api/catalog/categories`),
    staleTime: 24 * 60 * 60 * 1000,
  })

  const categoryOptions = useMemo(() => {
    const liveCategories = Array.isArray(categoriesQuery.data?.categories)
      ? categoriesQuery.data.categories
      : []

    if (liveCategories.length > 0) {
      return [
        { id: 'all', name: 'All' },
        ...liveCategories.map((category) => ({
          id: category.id,
          name: category.name,
        })),
      ]
    }

    return [
      { id: 'all', name: 'All' },
      ...fallbackCategoryNames.map((name) => ({
        id: slugify(name),
        name,
      })),
    ]
  }, [categoriesQuery.data])

  const productsQuery = useInfiniteQuery({
    queryKey: ['catalog-products', deferredQuery, selectedCategory],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams()
      params.set('page', String(pageParam))
      params.set('limit', String(pageSize))

      if (deferredQuery) {
        params.set('q', deferredQuery)
      }

      if (selectedCategory !== 'all') {
        params.set('categoryId', selectedCategory)
      }

      return fetchJson(`${apiBaseUrl}/api/catalog/products?${params.toString()}`)
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.hasMore) {
        return undefined
      }

      return (lastPage.page || 1) + 1
    },
    staleTime: 30 * 1000,
  })

  const products = useMemo(
    () =>
      productsQuery.data?.pages.flatMap((page) =>
        page.products.map((product) => ({
          ...product,
          image:
            Array.isArray(product.images) && product.images.length > 0
              ? product.images[0]
              : '/product-placeholder.svg',
        })),
      ) || [],
    [productsQuery.data],
  )

  const isLoadingInitial = productsQuery.isLoading
  const isEmpty = !isLoadingInitial && !productsQuery.isError && products.length === 0

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
          {categoryOptions.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`catalog-chip${selectedCategory === category.id ? ' is-active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className="catalog-results" aria-live="polite">
        {isLoadingInitial ? <p className="catalog-results__count">Loading catalog...</p> : null}

        {productsQuery.isError ? (
          <p className="catalog-results__count">
            {productsQuery.error?.message || 'Unable to load products right now.'}
          </p>
        ) : null}

        {!isLoadingInitial && !productsQuery.isError ? (
          <p className="catalog-results__count">
            Showing {products.length} {products.length === 1 ? 'medicine' : 'medicines'}
          </p>
        ) : null}

        {isLoadingInitial ? (
          <div className="catalog-grid" aria-label="Loading medicines">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductSkeletonCard key={`skeleton-${index}`} />
            ))}
          </div>
        ) : null}

        {!isLoadingInitial && !productsQuery.isError && products.length > 0 ? (
          <div className="catalog-grid">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : null}

        {isEmpty ? (
          <div className="catalog-empty">
            <h3>No products match your search</h3>
            <p>Try a different keyword or choose a different category.</p>
          </div>
        ) : null}

        {productsQuery.hasNextPage ? (
          <div className="catalog-loadmore">
            <button
              type="button"
              className="catalog-loadmore__button"
              onClick={() => productsQuery.fetchNextPage()}
              disabled={productsQuery.isFetchingNextPage}
            >
              {productsQuery.isFetchingNextPage ? 'Loading more...' : 'Load more products'}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default ProductsPage
