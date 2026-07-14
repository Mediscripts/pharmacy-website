import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'

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
          setPageError(error.message)
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
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main style={{ maxWidth: '960px', margin: '4rem auto', padding: '2rem' }}>
        Loading admin access...
      </main>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <main
      style={{
        maxWidth: '1120px',
        margin: '4rem auto',
        padding: '2rem',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        background: '#fff',
      }}
    >
      <header style={{ marginBottom: '2rem' }}>
        <p style={{ margin: 0, color: '#0f766e', fontWeight: 600 }}>Admin tools</p>
        <h1 style={{ margin: '0.25rem 0 0' }}>Inventory management</h1>
        <p style={{ color: '#475569', marginBottom: 0 }}>
          Adjust stock levels, record movement reasons, and keep a traceable inventory history.
        </p>
      </header>

      {pageLoading ? <p>Loading inventory data...</p> : null}
      {pageError ? <p style={{ color: '#b91c1c' }}>{pageError}</p> : null}
      {message ? <p style={{ color: '#0f766e' }}>{message}</p> : null}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 360px) 1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem',
            background: '#f8fafc',
            display: 'grid',
            gap: '0.9rem',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Adjust stock</h2>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span>Product</span>
            <select
              value={form.productId}
              onChange={(event) =>
                setForm((current) => ({ ...current, productId: event.target.value }))
              }
              required
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span>Delta</span>
            <input
              type="number"
              step="1"
              value={form.delta}
              onChange={(event) => setForm((current) => ({ ...current, delta: event.target.value }))}
              placeholder="Use negative values to reduce stock"
              required
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span>Reason</span>
            <input
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              required
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span>Reference type</span>
            <input
              value={form.referenceType}
              onChange={(event) =>
                setForm((current) => ({ ...current, referenceType: event.target.value }))
              }
              placeholder="Order, shipment, adjustment"
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span>Reference ID</span>
            <input
              value={form.referenceId}
              onChange={(event) =>
                setForm((current) => ({ ...current, referenceId: event.target.value }))
              }
              placeholder="Optional record ID"
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.85rem',
              border: 0,
              borderRadius: '999px',
              background: saving ? '#5e9f99' : '#0f766e',
              color: '#fff',
              cursor: saving ? 'wait' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Update stock'}
          </button>
        </form>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <article
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1rem',
              background: '#fff',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Current stock</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '0.85rem',
                    background: '#f8fafc',
                  }}
                >
                  <p style={{ margin: 0, color: '#64748b' }}>{product.name}</p>
                  <strong>{product.stock_quantity} units</strong>
                </div>
              ))}
            </div>
          </article>

          <article
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1rem',
              background: '#fff',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Recent movements</h2>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {movements.map((movement) => {
                const product = productLookup.get(movement.product_id)

                return (
                  <div
                    key={movement.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '0.85rem',
                      background: '#f8fafc',
                    }}
                  >
                    <strong>{product?.name || 'Unknown product'}</strong>
                    <p style={{ margin: '0.25rem 0 0', color: '#475569' }}>
                      {movement.delta > 0 ? '+' : ''}
                      {movement.delta} units
                    </p>
                    <p style={{ margin: '0.25rem 0 0', color: '#475569' }}>{movement.reason}</p>
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
