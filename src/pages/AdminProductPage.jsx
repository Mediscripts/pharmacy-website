import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { uploadProductImages } from '../lib/productImageUpload'
import './AdminProductPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const emptyDraft = {
  name: '',
  description: '',
  price: '',
  stockQuantity: '0',
  categoryId: '',
  prescriptionRequired: false,
  isActive: true,
  images: [],
}

function normalizeProduct(product) {
  return {
    ...product,
    categoryId: product.category_id || '',
    categoryName: product.categories?.name || 'Uncategorized',
    images: Array.isArray(product.images) ? product.images : [],
  }
}

function AdminProductPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { isAdmin, loading, accessToken } = useAuth()
  const [categories, setCategories] = useState([])
  const [product, setProduct] = useState(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [files, setFiles] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const isNew = productId === 'new'

  const categoryLookup = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  useEffect(() => {
    if (loading || !isAdmin || !accessToken) {
      return undefined
    }

    let isMounted = true

    const loadProductPage = async () => {
      setPageLoading(true)
      setPageError('')

      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/admin/categories`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${apiBaseUrl}/api/admin/products${isNew ? '' : `/${productId}`}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ])

        const categoriesPayload = await categoriesResponse.json()
        const productsPayload = await productsResponse.json()

        if (!categoriesResponse.ok) {
          throw new Error(categoriesPayload.message || 'Unable to load categories.')
        }

        if (!productsResponse.ok) {
          throw new Error(productsPayload.message || 'Unable to load product.')
        }

        if (!isMounted) {
          return
        }

        setCategories(categoriesPayload.categories || [])

        const loadedProduct = isNew ? null : normalizeProduct(productsPayload.product)
        setProduct(loadedProduct)
        setDraft(
          loadedProduct
            ? {
                name: loadedProduct.name || '',
                description: loadedProduct.description || '',
                price: String(loadedProduct.price ?? ''),
                stockQuantity: String(loadedProduct.stock_quantity ?? 0),
                categoryId: loadedProduct.category_id || '',
                prescriptionRequired: Boolean(loadedProduct.prescription_required),
                isActive: Boolean(loadedProduct.is_active),
                images: loadedProduct.images,
              }
            : emptyDraft,
        )
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

    loadProductPage()

    return () => {
      isMounted = false
    }
  }, [accessToken, isAdmin, isNew, loading, productId])

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const uploadedImages = await uploadProductImages(files)
      const response = await fetch(
        isNew ? `${apiBaseUrl}/api/admin/products` : `${apiBaseUrl}/api/admin/products/${productId}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...draft,
            categoryId: draft.categoryId || null,
            images: [...draft.images, ...uploadedImages],
          }),
        },
      )

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to save product.')
      }

      const savedProduct = normalizeProduct(payload.product)
      setProduct(savedProduct)
      setDraft({
        name: savedProduct.name || '',
        description: savedProduct.description || '',
        price: String(savedProduct.price ?? ''),
        stockQuantity: String(savedProduct.stock_quantity ?? 0),
        categoryId: savedProduct.category_id || '',
        prescriptionRequired: Boolean(savedProduct.prescription_required),
        isActive: Boolean(savedProduct.is_active),
        images: savedProduct.images,
      })
      setFiles([])
      setMessage('Product saved successfully.')

      if (isNew) {
        navigate(`/admin/catalog/${savedProduct.id}`, { replace: true })
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const archiveProduct = async () => {
    if (!product?.id) {
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/products/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to archive product.')
      }

      setDraft((current) => ({ ...current, isActive: false }))
      setProduct((current) => (current ? { ...current, is_active: false } : current))
      setMessage('Product archived.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  if (loading) {
    return (
      <main className="product-shell">
        <section className="product-state">
          <p className="product-kicker">Admin access</p>
          <h1>Loading access...</h1>
        </section>
      </main>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <main className="product-shell">
      <div className="product-topbar">
        <Link className="product-backlink" to="/admin/catalog">
          Back to catalog
        </Link>
        <div className="product-topbar__actions">
          <button type="button" className="product-action product-action--ghost" onClick={() => navigate('/admin/catalog/new')}>
            New product
          </button>
          {product && !isNew ? (
            <button
              type="button"
              className="product-action product-action--ghost"
              onClick={archiveProduct}
              disabled={!draft.isActive}
            >
              Archive
            </button>
          ) : null}
        </div>
      </div>

      <section className="product-hero">
        <div>
          <p className="product-kicker">{isNew ? 'Create product' : 'Edit product'}</p>
          <h1>{isNew ? 'Add a new medicine' : product?.name || 'Product details'}</h1>
        </div>

        <div className="product-stat">
          <span>Category</span>
          <strong>{draft.categoryId ? categoryLookup.get(draft.categoryId) || 'Uncategorized' : 'None selected'}</strong>
        </div>
      </section>

      {pageLoading ? <p className="product-note">Loading product data...</p> : null}
      {pageError ? <p className="product-error">{pageError}</p> : null}
      {message ? <p className="product-success">{message}</p> : null}

      {!pageLoading ? (
        <section className="product-layout">
          <article className="product-preview">
            <div className="product-preview__image">
              <img src={draft.images[0] || '/product-placeholder.svg'} alt={draft.name || 'Product'} />
            </div>

            <div className="product-preview__meta">
              <p>{draft.description || 'Product description will appear here.'}</p>
              <div className="product-preview__chips">
                <span>{draft.prescriptionRequired ? 'Prescription required' : 'OTC'}</span>
                <span>{draft.isActive ? 'Active' : 'Archived'}</span>
                <span>Stock: {draft.stockQuantity || 0}</span>
              </div>

              <div className="product-preview__gallery">
                {draft.images.map((imageUrl) => (
                  <button
                    key={imageUrl}
                    type="button"
                    className="product-preview__thumb"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        images: current.images.filter((currentImage) => currentImage !== imageUrl),
                      }))
                    }
                  >
                    <img src={imageUrl} alt="" />
                  </button>
                ))}
              </div>
            </div>
          </article>

          <form className="product-editor" onSubmit={handleSave}>
            <div className="product-editor__grid">
              <label>
                <span>Name</span>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Category</span>
                <select
                  value={draft.categoryId}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, categoryId: event.target.value }))
                  }
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.price}
                  onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Stock</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={draft.stockQuantity}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, stockQuantity: event.target.value }))
                  }
                  required
                />
              </label>
            </div>

            <label className="product-editor__textarea">
              <span>Description</span>
              <textarea
                rows={7}
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                required
              />
            </label>

            <div className="product-editor__switches">
              <label>
                <input
                  type="checkbox"
                  checked={draft.prescriptionRequired}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      prescriptionRequired: event.target.checked,
                    }))
                  }
                />
                <span>Prescription required</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, isActive: event.target.checked }))
                  }
                />
                <span>Active</span>
              </label>
            </div>

            <label className="product-editor__upload">
              <span>Upload product images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setFiles(Array.from(event.target.files || []))}
              />
            </label>

            {files.length > 0 ? (
              <p className="product-note">
                {files.length} file{files.length > 1 ? 's' : ''} ready for compression.
              </p>
            ) : null}

            <div className="product-editor__actions">
              <button type="submit" className="product-action" disabled={saving}>
                {saving ? 'Saving...' : 'Save product'}
              </button>
              {!isNew ? (
                <button
                  type="button"
                  className="product-action product-action--ghost"
                  onClick={archiveProduct}
                  disabled={!draft.isActive}
                >
                  Archive product
                </button>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}
    </main>
  )
}

export default AdminProductPage
