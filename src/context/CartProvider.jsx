import { useEffect, useMemo, useState } from 'react'
import { CartContext } from './cartContext'

const CART_STORAGE_KEY = 'mediscript_cart_v1'

function loadCartFromStorage() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!storedCart) {
      return []
    }

    const parsedCart = JSON.parse(storedCart)
    return Array.isArray(parsedCart) ? parsedCart : []
  } catch {
    return []
  }
}

function CartProvider({ children }) {
  const [items, setItems] = useState(loadCartFromStorage)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (items.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addToCart = (product) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id)

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...currentItems, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId, delta) => {
    setItems((currentItems) => {
      const nextItems = currentItems
        .map((item) => {
          if (item.id !== productId) {
            return item
          }

          const nextQuantity = item.quantity + delta
          return nextQuantity > 0 ? { ...item, quantity: nextQuantity } : null
        })
        .filter(Boolean)

      return nextItems
    })
  }

  const removeFromCart = (productId) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId))
  }

  const clearCart = () => {
    setItems([])
  }

  const cartCount = items.reduce((total, item) => total + item.quantity, 0)
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)

  const value = useMemo(
    () => ({
      items,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      subtotal,
    }),
    [items, cartCount, subtotal],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider
