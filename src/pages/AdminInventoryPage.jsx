import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { getFriendlyErrorMessage } from '../lib/errorMessages'
import './AdminInventoryPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const emptyAdjustmentForm = {
  productId: '',
  delta: '',
  reason: '',
  referenceType: '',
  referenceId: '',
}

function AdminInventoryPage() {
  const { isAdmin, loading, accessToken } = useAuth()
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [form, setForm] = useState(emptyAdjustmentForm)
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const productLookup = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  const inventoryStats = useMemo(() => {
    const totalProducts = products.length
    const activeProducts = products.filter((product) => product.is_active !== false).length
    const lowStockProducts = products.filter((product) => {
      const stock = Number(product.stock_quantity || 0)
      return stock > 0 && stock <= 10
    }).length
    const outOfStockProducts = products.filter((product) => Number(product.stock_quantity || 0) === 0).length

    return [
      { label: 'Products tracked', value: totalProducts },
      { label: 'Active products', value: activeProducts },
      { label: 'Low stock', value: lowStockProducts },
      { label: 'Out of stock', value: outOfStockProducts },
      { label: 'Recent movements', value: movements.length },
    ]
  }, [movements.length, products])

  useEffect(() => {
    if (loading || !isAdmin || !accessToken) {
      return undefined
    }

    let isMounted = true

    const loadInventory = async () => {
      setPageLoading(true)
      setPageError('')

      try {
        const [productsResponse, movementsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/admin/products`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${apiBaseUrl}/api/admin/inventory/movements`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ])

        const productsPayload = await productsResponse.json()
        const movementsPayload = await movementsResponse.json()

        if (!productsResponse.ok) {
          throw new Error(productsPayload.message || 'Unable to load products.')
        }

        if (!movementsResponse.ok) {
          throw new Error(movementsPayload.message || 'Unable to load inventory movements.')
        }

        if (isMounted) {
          setProducts(productsPayload.products || [])
          setMovements(movementsPayload.movements || [])
        }
      } catch (error) {
        if (isMounted) {
          setPageError(getFriendlyErrorMessage(error, 'We could not load inventory right now.'))
        }
      } finally {
        if (isMounted) {
          setPageLoading(false)
        }
      }
    }

    loadInventory()

    return () => {
      isMounted = false
    }
  }, [accessToken, isAdmin, loading, refreshKey])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/inventory/adjustments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...form,
          delta: Number(form.delta),
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to update inventory.')
      }

      setMessage(payload.message || 'Inventory updated successfully.')
      setForm(emptyAdjustmentForm)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      setMessage(getFriendlyErrorMessage(error, 'We could not update inventory right now.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="inventory-shell">
        <section className="inventory-state-card">
          <p className="inventory-kicker">Back office</p>
          <h1>Loading inventory...</h1>
          <p>Give us a moment while we open the stock room.</p>
        </section>
      </main>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <main className="inventory-shell">
      <section className="inventory-hero">
        <div className="inventory-hero__copy">
          <p className="inventory-kicker">Stock room</p>
          <h1>Keep the shelf count honest.</h1>
          <p>
            Adjust stock, leave a clear reason, and keep a tidy record of every movement that
            matters.
          </p>

          <div className="inventory-hero__actions">
            <Link className="inventory-button inventory-button--ghost" to="/admin">
              Back to dashboard
            </Link>
            <button
              type="button"
              className="inventory-button inventory-button--ghost"
              onClick={() => setRefreshKey((current) => current + 1)}
            >
              Refresh stock
            </button>
          </div>
        </div>

        <div className="inventory-hero__panel">
          <p className="inventory-panel-label">At a glance</p>
          <div className="inventory-stats">
            {inventoryStats.map((stat) => (
              <article key={stat.label} className="inventory-stat">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      {pageLoading ? <p className="inventory-helper">Loading inventory data...</p> : null}
      {pageError ? <p className="inventory-error">{pageError}</p> : null}
      {message ? <p className="inventory-success">{message}</p> : null}

      <section className="inventory-layout">
        <form className="inventory-card inventory-form" onSubmit={handleSubmit}>
          <div className="inventory-card__header">
            <div>
              <p className="inventory-section-kicker">Adjust stock</p>
              <h2>Update a product</h2>
            </div>
          </div>

          <div className="inventory-form-grid">
            <label>
              <span>Product</span>
              <select
                value={form.productId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, productId: event.target.value }))
                }
                required
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Delta</span>
              <input
                type="number"
                step="1"
                value={form.delta}
                onChange={(event) => setForm((current) => ({ ...current, delta: event.target.value }))}
                placeholder="Use negative values to reduce stock"
                required
              />
            </label>

            <label className="inventory-form__wide">
              <span>Reason</span>
              <input
                value={form.reason}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reason: event.target.value }))
                }
                placeholder="For example: delivery received"
                required
              />
            </label>

            <label>
              <span>Reference type</span>
              <input
                value={form.referenceType}
                onChange={(event) =>
                  setForm((current) => ({ ...current, referenceType: event.target.value }))
                }
                placeholder="Order, shipment, adjustment"
              />
            </label>

            <label>
              <span>Reference ID</span>
              <input
                value={form.referenceId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, referenceId: event.target.value }))
                }
                placeholder="Optional record ID"
              />
            </label>
          </div>

          <div className="inventory-form__actions">
            <button type="submit" className="inventory-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save movement'}
            </button>
          </div>
        </form>

        <div className="inventory-stack">
          <article className="inventory-card">
            <div className="inventory-card__header">
              <div>
                <p className="inventory-section-kicker">Current stock</p>
                <h2>What is on hand</h2>
              </div>
            </div>

            <div className="inventory-stock-grid">
              {products.map((product) => (
                <div key={product.id} className="inventory-stock-card">
                  <p>{product.name}</p>
                  <strong>{product.stock_quantity} units</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="inventory-card">
            <div className="inventory-card__header">
              <div>
                <p className="inventory-section-kicker">Movement log</p>
                <h2>Recent changes</h2>
              </div>
            </div>

            <div className="inventory-log">
              {movements.map((movement) => {
                const product = productLookup.get(movement.product_id)

                return (
                  <div key={movement.id} className="inventory-log__row">
                    <div>
                      <strong>{product?.name || 'Unknown product'}</strong>
                      <p>{movement.reason}</p>
                    </div>
                    <div className="inventory-log__delta">
                      <strong>
                        {movement.delta > 0 ? '+' : ''}
                        {movement.delta}
                      </strong>
                      <span>units</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

export default AdminInventoryPage
