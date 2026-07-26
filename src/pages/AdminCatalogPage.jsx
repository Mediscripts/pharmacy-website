import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import './AdminCatalogPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const emptyCategoryForm = {
  name: '',
  description: '',
}

function normalizeProduct(product) {
  return {
    ...product,
    categoryName: product.categories?.name || 'Uncategorized',
    images: Array.isArray(product.images) ? product.images : [],
  }
}

function AdminCatalogPage() {
  const navigate = useNavigate()
  const { isAdmin, loading, accessToken } = useAuth()
  const [activeTab, setActiveTab] = useState('products')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)
  const [savingCategory, setSavingCategory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const normalizedProducts = useMemo(
    () => products.map(normalizeProduct),
    [products],
  )

  const visibleProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return normalizedProducts.filter((product) => {
      const matchesCategory =
        categoryFilter === 'All' || product.categoryName === categoryFilter
      const haystack = `${product.name} ${product.description} ${product.categoryName}`.toLowerCase()
      const matchesQuery = normalizedQuery === '' || haystack.includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [categoryFilter, normalizedProducts, searchQuery])

  const categoryOptions = useMemo(
    () => ['All', ...categories.map((category) => category.name)],
    [categories],
  )

  const catalogStats = useMemo(() => {
    const activeCategories = categories.filter((category) => category.is_active !== false).length
    const prescriptionItems = normalizedProducts.filter((product) => product.prescription_required).length
    const lowStockItems = normalizedProducts.filter((product) => {
      const stock = Number(product.stock_quantity || 0)
      return stock > 0 && stock <= 10
    }).length
    const outOfStockItems = normalizedProducts.filter((product) => Number(product.stock_quantity || 0) === 0).length

    return [
      { label: 'Medicines', value: normalizedProducts.length },
      { label: 'Active categories', value: activeCategories },
      { label: 'Prescription items', value: prescriptionItems },
      { label: 'Stock alerts', value: lowStockItems + outOfStockItems },
    ]
  }, [categories, normalizedProducts])

  useEffect(() => {
    if (loading || !isAdmin || !accessToken) {
      return undefined
    }

    let isMounted = true

    const loadCatalog = async () => {
      setPageLoading(true)
      setPageError('')

      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/admin/categories`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${apiBaseUrl}/api/admin/products`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ])

        const categoriesPayload = await categoriesResponse.json()
        const productsPayload = await productsResponse.json()

        if (!categoriesResponse.ok) {
          throw new Error(categoriesPayload.message || 'Unable to load categories.')
        }

        if (!productsResponse.ok) {
          throw new Error(productsPayload.message || 'Unable to load products.')
        }

        if (isMounted) {
          setCategories(categoriesPayload.categories || [])
          setProducts(productsPayload.products || [])
        }
      } catch (error) {
        if (isMounted) {
          setPageError(error.message)
        }
      } finally {
        if (isMounted) {
          setPageLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      isMounted = false
    }
  }, [accessToken, isAdmin, loading])

  const handleCategorySubmit = async (event) => {
    event.preventDefault()
    setSavingCategory(true)
    setActionMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(categoryForm),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to create category.')
      }

      setCategories((current) => [payload.category, ...current])
      setCategoryForm(emptyCategoryForm)
      setActionMessage('Category created successfully.')
    } catch (error) {
      setActionMessage(error.message)
    } finally {
      setSavingCategory(false)
    }
  }

  const archiveCategory = async (id) => {
    const response = await fetch(`${apiBaseUrl}/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.message || 'Unable to archive category.')
    }

    setCategories((current) =>
      current.map((category) =>
        category.id === id ? { ...category, is_active: false } : category,
      ),
    )
  }

  if (loading) {
    return (
      <main className="admin-shell">
        <section className="admin-state-card">
          <p className="admin-kicker">Admin access</p>
          <h1>Loading access...</h1>
          <p>Please wait while we verify your session.</p>
        </section>
      </main>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="admin-hero__copy">
          <p className="admin-kicker">Catalog workspace</p>
          <h1>Keep the medicine list easy to browse.</h1>
          <p>
            Update product details, move medicines between categories, and keep the shop tidy for
            the team and for customers.
          </p>
          <div className="admin-hero__actions">
            <Link className="admin-button admin-button--ghost" to="/admin">
              Back to dashboard
            </Link>
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => navigate('/admin/catalog/new')}
            >
              Add medicine
            </button>
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => setActiveTab('categories')}
            >
              Open categories
            </button>
          </div>
        </div>

        <div className="catalog-hero__panel">
          <p className="catalog-hero__panel-label">At a glance</p>
          <div className="catalog-stats">
            {catalogStats.map((stat) => (
              <article key={stat.label} className="catalog-stat">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="admin-toolbar">
        <label className="admin-search">
          <span>Search</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search products"
          />
        </label>

        <div className="admin-chips" role="list" aria-label="Category filters">
          {categoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              className={`admin-chip${categoryFilter === category ? ' is-active' : ''}`}
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {pageLoading ? <p className="admin-helper">Loading catalog data...</p> : null}
      {pageError ? <p className="admin-error">{pageError}</p> : null}
      {actionMessage ? <p className="admin-success">{actionMessage}</p> : null}

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab${activeTab === 'products' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          type="button"
          className={`admin-tab${activeTab === 'categories' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
      </div>

      {activeTab === 'products' ? (
        <section className="catalog-view">
          <div className="catalog-view__header">
            <div>
              <p className="catalog-section-kicker">Products</p>
              <h2>Browse the current lineup</h2>
            </div>
            <p className="catalog-view__note">
              Click any item to open its page, update details, or make changes to the images and
              stock.
            </p>
          </div>

          <div className="admin-grid admin-grid--list">
            {visibleProducts.map((product) => (
              <Link key={product.id} to={`/admin/catalog/${product.id}`} className="product-tile product-tile--link">
                <div className="product-tile__image">
                  <img
                    src={product.images[0] || '/product-placeholder.svg'}
                    alt={product.name}
                  />
                </div>
                <div className="product-tile__body">
                  <div className="product-tile__topline">
                    <span>{product.categoryName}</span>
                    <strong>NGN {Number(product.price || 0).toLocaleString()}</strong>
                  </div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-tile__meta">
                    <span>{product.stock_quantity} in stock</span>
                    <span>{product.prescription_required ? 'Prescription' : 'OTC'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {visibleProducts.length === 0 ? (
            <div className="admin-empty">
              <h2>No products found</h2>
              <p>Try a different search or create a new product.</p>
              <button type="button" className="admin-button" onClick={() => navigate('/admin/catalog/new')}>
                Add product
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="admin-category-layout">
          <div className="catalog-view__header">
            <div>
              <p className="catalog-section-kicker">Categories</p>
              <h2>Shape the shelves behind the scenes</h2>
            </div>
            <p className="catalog-view__note">
              Give the team a clean structure so products stay grouped and easy to manage.
            </p>
          </div>

          <form className="drawer-card" onSubmit={handleCategorySubmit}>
            <div className="drawer-card__header">
              <div>
                <p className="admin-kicker">New category</p>
                <h2>Create category</h2>
              </div>
            </div>
            <div className="drawer-grid">
              <label>
                <span>Name</span>
                <input
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                <span>Description</span>
                <input
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="drawer-actions">
              <button type="submit" className="admin-button" disabled={savingCategory}>
                {savingCategory ? 'Saving...' : 'Create category'}
              </button>
            </div>
          </form>

          {categories.length > 0 ? (
            <div>
              <h2 className="catalog-section-title">Categories ({categories.length})</h2>
              <div className="category-grid">
                {categories.map((category) => (
                  <article className="category-card" key={category.id}>
                    <div className="category-card__top">
                      <div className="category-card__meta">
                        <h3>{category.name}</h3>
                        <p>{category.description || 'No description yet.'}</p>
                      </div>
                      <span className={category.is_active ? 'status-badge' : 'status-badge status-badge--muted'}>
                        {category.is_active ? 'Active' : 'Archived'}
                      </span>
                    </div>
                    <div className="drawer-actions">
                      <button
                        type="button"
                        className="admin-button admin-button--ghost"
                        onClick={async () => {
                          try {
                            await archiveCategory(category.id)
                            setActionMessage('Category archived.')
                          } catch (error) {
                            setActionMessage(error.message)
                          }
                        }}
                        disabled={!category.is_active}
                      >
                        Archive
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}
    </main>
  )
}

export default AdminCatalogPage
