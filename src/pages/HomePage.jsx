import { Link, useNavigate } from 'react-router-dom'
import { useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SectionHeading from '../components/ui/SectionHeading'
import FeatureCard from '../components/home/FeatureCard'
import ProductCard from '../components/home/ProductCard'
import { categories, homeFeatures } from '../data/siteContent'
import './HomePage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
const lagosMapUrl =
  'https://www.google.com/maps/dir/?api=1&destination=6.4328473,3.4883968'
const searchResultsLimit = 8

function fetchJson(url) {
  return fetch(url).then(async (response) => {
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.message || 'Unable to load products right now.')
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
      className="home-search__svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

const workflowSteps = [
  {
    title: 'Browse products',
    description:
      'Search by category, compare options, and choose the items that fit your needs.',
    icon: 'search',
  },
  {
    title: 'Prescription review',
    description:
      'Prescription-only products are checked carefully before approval or payment.',
    icon: 'prescription',
  },
  {
    title: 'Secure payment',
    description:
      'Pay for regular products with confidence. Approved prescription orders receive a payment link after review.',
    icon: 'payment',
  },
  {
    title: 'Secure tracking with OTP',
    description:
      'Follow your order status with email verification and private tracking built in.',
    icon: 'delivery',
  },
]

function FlowIcon({ name }) {
  const iconProps = {
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
    className: 'flow-icon',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  switch (name) {
    case 'search':
      return (
        <svg {...iconProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      )
    case 'prescription':
      return (
        <svg {...iconProps}>
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6" />
          <path d="M12 10v6" />
        </svg>
      )
    case 'payment':
      return (
        <svg {...iconProps}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
          <path d="M3.5 10h17" />
          <path d="M8 15h4" />
        </svg>
      )
    case 'delivery':
      return (
        <svg {...iconProps}>
          <path d="M3.5 7.5h11v9h-11z" />
          <path d="M14.5 10h3l3 3v3.5h-6z" />
          <circle cx="7" cy="18" r="1.6" />
          <circle cx="17" cy="18" r="1.6" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...iconProps}>
          <path d="M12 3.5 19 6v5.4c0 4.5-3 8.3-7 9.1-4-.8-7-4.6-7-9.1V6z" />
          <path d="m8.5 12 2.3 2.3 4.9-4.9" />
        </svg>
      )
    case 'location':
      return (
        <svg {...iconProps}>
          <path d="M12 21s6-4.8 6-11a6 6 0 0 0-12 0c0 6.2 6 11 6 11z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      )
    default:
      return null
  }
}

function ProductSkeletonCard() {
  return (
    <article className="home-product-skeleton">
      <div className="home-product-skeleton__image" />
      <div className="home-product-skeleton__content">
        <div className="home-product-skeleton__line home-product-skeleton__line--title" />
        <div className="home-product-skeleton__line home-product-skeleton__line--chip" />
        <div className="home-product-skeleton__line home-product-skeleton__line--body" />
        <div className="home-product-skeleton__line home-product-skeleton__line--body home-product-skeleton__line--short" />
        <div className="home-product-skeleton__footer">
          <div className="home-product-skeleton__line home-product-skeleton__line--price" />
          <div className="home-product-skeleton__button" />
        </div>
      </div>
    </article>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm.trim())

  const sectionsQuery = useQuery({
    queryKey: ['home-highlights'],
    queryFn: () => fetchJson(`${apiBaseUrl}/api/catalog/homepage-sections`),
    staleTime: 5 * 60 * 1000,
  })

  const searchResultsQuery = useQuery({
    queryKey: ['home-search-results', deferredSearchTerm],
    queryFn: () =>
      fetchJson(
        `${apiBaseUrl}/api/catalog/products?limit=${searchResultsLimit}&page=1&q=${encodeURIComponent(
          deferredSearchTerm,
        )}`,
      ),
    enabled: deferredSearchTerm.length > 0,
    staleTime: 30 * 1000,
  })

  const featuredProducts = Array.isArray(sectionsQuery.data?.featuredProducts)
    ? sectionsQuery.data.featuredProducts
    : []

  const searchResults = Array.isArray(searchResultsQuery.data?.products)
    ? searchResultsQuery.data.products
    : []

  const showSearchResults = deferredSearchTerm.length > 0

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const value = searchTerm.trim()

    navigate(value ? `/products?q=${encodeURIComponent(value)}` : '/products')
  }

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero__copy">
          <p className="hero__kicker">Shop products first, everything else follows</p>
          <h1>Mediscripts Pharmacy</h1>
          <p className="hero__text">
            Browse the products people come for, check what is in stock, upload a prescription
            when needed, and move straight into checkout without extra friction.
          </p>

          <div className="hero__actions">
            <Link className="button button--primary" to="/products">
              Shop products
            </Link>
            <Link className="button button--secondary" to="/track-order">
              Track an order
            </Link>
          </div>

          <div className="hero__stats" aria-label="Quick facts">
            <div>
              <strong>Fast browsing</strong>
              <span>Find what you need quickly without scrolling through noise</span>
            </div>
            <div>
              <strong>Prescription support</strong>
              <span>Prescription-only products stay clearly marked and easy to spot</span>
            </div>
            <div>
              <strong>Private tracking</strong>
              <span>Follow every order with secure, customer-friendly updates</span>
            </div>
          </div>
        </div>

        <aside className="hero__panel" aria-label="Platform illustration">
          <div className="hero__art">
            <div className="hero__art-glow hero__art-glow--one" aria-hidden="true" />
            <div className="hero__art-glow hero__art-glow--two" aria-hidden="true" />

            <div className="hero__art-shell">
              <div className="hero__art-shellbar">
                <span />
                <span />
                <span />
                <strong>Your order journey</strong>
              </div>

                <div className="hero__art-shellbody">
                <div className="hero__art-chip hero__art-chip--top">
                  Browse products
                </div>

                <div className="hero__art-core">
                  <div className="hero__art-coreicon">
                    <FlowIcon name="shield" />
                  </div>
                  <strong>Simple, secure ordering</strong>
                  <span>Get the products you need with a smooth experience from start to finish.</span>
                </div>

                <div className="hero__art-flow">
                  <span>
                    <FlowIcon name="prescription" />
                    Prescription review
                  </span>
                  <span>
                    <FlowIcon name="payment" />
                    Secure payment
                  </span>
                </div>

                <div className="hero__art-chip hero__art-chip--bottom">
                  Secure tracking with OTP
                </div>
              </div>
            </div>
          </div>

          <div className="hero__panel-grid">
            <div className="hero__panel-card">
              <span className="hero__stat">01</span>
              <p>Find the products you need in seconds</p>
            </div>
            <div className="hero__panel-card">
              <span className="hero__stat">02</span>
              <p>Upload prescriptions with confidence when required</p>
            </div>
            <div className="hero__panel-card hero__panel-card--accent">
              <span className="hero__stat">03</span>
              <p>Pay securely and track your delivery every step of the way</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="section section--search">
        <SectionHeading
          eyebrow="Search"
          title="Find a product fast"
          description="Type what you need and start shopping."
          align="center"
        />

        <form className="home-search" onSubmit={handleSearchSubmit}>
          <label className="home-search__field">
            <span className="home-search__icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
            />
          </label>

          <button type="submit" className="home-search__button">
            Search
          </button>
        </form>
      </section>

      {showSearchResults ? (
        <section className="section section--results">
          <SectionHeading
            eyebrow="Search results"
            title={`Results for "${deferredSearchTerm}"`}
            description="Here’s what we found."
            align="center"
          />

          <div className="home-products__toolbar">
            <p className="home-products__hint">
              Showing products that match your search.
            </p>
            <Link className="home-products__link" to={`/products?q=${encodeURIComponent(deferredSearchTerm)}`}>
              Open full results
            </Link>
          </div>

          {searchResultsQuery.isLoading ? (
            <div className="home-products-grid" aria-label="Loading search results">
              {Array.from({ length: searchResultsLimit }).map((_, index) => (
                <ProductSkeletonCard key={`home-search-skeleton-${index}`} />
              ))}
            </div>
          ) : null}

          {searchResultsQuery.isError ? (
            <div className="home-products__notice">
              <h3>We could not search right now.</h3>
              <p>Please try again or open the full catalog.</p>
            </div>
          ) : null}

          {!searchResultsQuery.isLoading && !searchResultsQuery.isError && searchResults.length > 0 ? (
            <div className="home-products-grid">
              {searchResults.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  category={product.category}
                  name={product.name}
                  description={product.description}
                  price={Number(product.price) || 0}
                  image={
                    Array.isArray(product.images) && product.images.length > 0
                      ? product.images[0]
                      : '/product-placeholder.svg'
                  }
                  images={product.images}
                  inStock={(product.stockQuantity || 0) > 0}
                  prescriptionRequired={product.prescriptionRequired}
                />
              ))}
            </div>
          ) : null}

          {!searchResultsQuery.isLoading &&
          !searchResultsQuery.isError &&
          searchResults.length === 0 ? (
            <div className="home-products__notice">
              <h3>No products matched your search</h3>
              <p>Try a different word or open the full catalog to browse everything.</p>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          {featuredProducts.length > 0 || sectionsQuery.isLoading || sectionsQuery.isError ? (
            <section className="section section--featured-products">
              <SectionHeading
                eyebrow="Popular products"
                title="A few products customers reach for often"
                description="Browse a few favorites, or open the full catalog to see more."
                align="center"
              />

              {sectionsQuery.isError ? (
                <div className="home-products__notice">
                  <h3>Something went wrong.</h3>
                  <p>Please try again.</p>
                </div>
              ) : null}

              {sectionsQuery.isLoading ? (
                <div className="home-products-grid" aria-label="Loading products">
                  {Array.from({ length: searchResultsLimit }).map((_, index) => (
                    <ProductSkeletonCard key={`home-featured-skeleton-${index}`} />
                  ))}
                </div>
              ) : null}

              {!sectionsQuery.isLoading && !sectionsQuery.isError && featuredProducts.length > 0 ? (
                <div className="home-products-grid">
                  {featuredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      slug={product.slug}
                      category={product.category}
                      name={product.name}
                      description={product.description}
                      price={Number(product.price) || 0}
                      image={
                        Array.isArray(product.images) && product.images.length > 0
                          ? product.images[0]
                          : '/product-placeholder.svg'
                      }
                      images={product.images}
                      inStock={(product.stockQuantity || 0) > 0}
                      prescriptionRequired={product.prescriptionRequired}
                    />
                  ))}
                </div>
              ) : null}

              {!sectionsQuery.isLoading && !sectionsQuery.isError && featuredProducts.length > 0 ? (
                <div className="home-featured__actions">
                  <div className="home-featured__cta">
                    <div>
                      <strong>Want to see more?</strong>
                      <p>Browse the full catalog and find the right product for you.</p>
                    </div>

                    <Link className="button button--primary home-featured__cta-link" to="/products">
                      See more products
                    </Link>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}

      {!showSearchResults && sectionsQuery.data?.promotionProducts?.length > 0 ? (
        <section className="section section--promotion-products">
          <SectionHeading
            eyebrow="Promotion"
            title="Extra picks worth a look"
            description="These are the items the team wants customers to see right now."
            align="center"
          />

          <div className="home-products-grid">
            {sectionsQuery.data.promotionProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                category={product.category}
                name={product.name}
                description={product.description}
                price={Number(product.price) || 0}
                image={
                  Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0]
                    : '/product-placeholder.svg'
                }
                images={product.images}
                inStock={(product.stockQuantity || 0) > 0}
                prescriptionRequired={product.prescriptionRequired}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section">
        <SectionHeading
          eyebrow="Why customers choose us"
          title="Medicine shopping made simple"
          description="Find exactly what you need, order with confidence, and enjoy a pharmacy experience built around your convenience."
          align="center"
        />

        <div className="home-grid home-grid--features">
          {homeFeatures.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              index={`0${index + 1}`}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      <section className="section section--workflow">
        <SectionHeading
          eyebrow="How it works"
          title="From search to delivery"
          description="A smooth, reassuring buying journey that helps you get your essentials quickly and safely."
          align="center"
        />

        <div className="workflow">
          <div className="workflow__illustration" aria-hidden="true">
            <div className="workflow__track" />
            {workflowSteps.map((step, index) => (
              <div className={`workflow__node workflow__node--${index + 1}`} key={step.title}>
                <span className="workflow__index">{`0${index + 1}`}</span>
                <div className="workflow__nodeicon">
                  <FlowIcon name={step.icon} />
                </div>
                <strong>{step.title}</strong>
              </div>
            ))}
            <div className="workflow__seal">
              <FlowIcon name="shield" />
              <strong>Trusted pharmacy experience</strong>
              <span>Designed for safe fulfillment and secure customer privacy.</span>
            </div>
          </div>

          <div className="workflow__cards">
            {workflowSteps.map((step, index) => (
              <article className="workflow-card" key={step.title}>
                <div className="workflow-card__top">
                  <span className="workflow-card__index">{`0${index + 1}`}</span>
                  <span className="workflow-card__icon">
                    <FlowIcon name={step.icon} />
                  </span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="Why people shop with us"
          title="A pharmacy experience that feels easy"
          description="Clear steps, secure payment, and private tracking keep the process simple from start to finish."
          align="center"
        />

        <div className="trust-grid">
          <article className="trust-card">
            <span className="trust-card__icon">
              <FlowIcon name="prescription" />
            </span>
            <h3>Prescription review</h3>
            <p>
              Prescription-only products are reviewed carefully so you can shop with
              confidence and peace of mind.
            </p>
          </article>

          <article className="trust-card">
            <span className="trust-card__icon">
              <FlowIcon name="payment" />
            </span>
            <h3>Secure payment</h3>
            <p>
              Pay securely and receive clear confirmation the moment your order is placed.
            </p>
          </article>

          <article className="trust-card">
            <span className="trust-card__icon">
              <FlowIcon name="delivery" />
            </span>
            <h3>Secure tracking with OTP</h3>
            <p>
              Stay updated with secure, private tracking that keeps you informed from checkout to delivery.
            </p>
          </article>
        </div>
      </section>

      <section className="section location-section">
        <SectionHeading
          eyebrow="Our location"
          title="Find us in Lagos"
          description="Tap the card to open directions to our location on Google Maps."
          align="center"
        />

        <a className="location-card" href={lagosMapUrl} target="_blank" rel="noreferrer">
          <div className="location-card__map" aria-hidden="true">
            <div className="location-card__grid" />
            <div className="location-card__road location-card__road--one" />
            <div className="location-card__road location-card__road--two" />
            <div className="location-card__road location-card__road--three" />
            <div className="location-card__marker">
              <span className="location-card__marker-ring" />
              <span className="location-card__marker-pin">
                <FlowIcon name="location" />
              </span>
            </div>
          </div>

          <div className="location-card__content">
            <p className="location-card__eyebrow">Want to locate us?</p>
            <h3>Visit Mediscripts Pharmacy</h3>
            <p>
              We are at <strong>Meadow Hall Way, Lekki Peninsula II, Lagos</strong>.
            </p>
            <span className="location-card__cta">Get Directions</span>
          </div>
        </a>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="Categories"
          title="Browse by category"
          description="Everything is grouped clearly so you can find the right products faster."
          align="center"
        />

        <div className="category-grid">
          {categories.map((category) => (
            <article className="category-card" key={category}>
              <span>{category}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section home-cta">
        <div>
          <p className="home-cta__eyebrow">Ready when you are</p>
          <h2>Start your order today and enjoy a pharmacy experience that feels calm, clear, and dependable.</h2>
        </div>

        <div className="home-cta__actions">
          <Link className="button button--primary" to="/products">
            Review the store
          </Link>
          <Link className="button button--secondary" to="/contact">
            Talk to us
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
