import { Link } from 'react-router-dom'
import useCart from '../context/useCart'
import './CartPage.css'

function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="page cart-page cart-page--empty">
        <div className="cart-page__empty">
          <h1>Your cart is empty</h1>
          <p>Pick a few essentials and come back here when you are ready to checkout.</p>
          <Link className="cart-page__link" to="/products">
            Continue shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page cart-page">
      <div className="cart-page__header">
        <div>
          <p className="section-eyebrow">Cart</p>
          <h1>Your selected medicines</h1>
        </div>
        <button type="button" className="cart-page__clear" onClick={clearCart}>
          Clear cart
        </button>
      </div>

      <div className="cart-page__content">
        <div className="cart-page__items">
          {items.map((item) => (
            <article key={item.id} className="cart-page__item">
              <div className="cart-page__item-main">
                <img src={item.image || '/product-placeholder.svg'} alt={item.name} />
                <div>
                  <h2>{item.name}</h2>
                  <p>{item.category}</p>
                </div>
              </div>

              <div className="cart-page__controls">
                <div className="cart-page__quantity">
                  <button type="button" onClick={() => updateQuantity(item.id, -1)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.id, 1)}>
                    +
                  </button>
                </div>

                <strong>₦{(item.price * item.quantity).toLocaleString()}</strong>
                <button
                  type="button"
                  className="cart-page__remove"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-page__summary">
          <h2>Order summary</h2>
          <div className="cart-page__summary-row">
            <span>Subtotal</span>
            <strong>₦{subtotal.toLocaleString()}</strong>
          </div>
          <p>Delivery and prescription review will be handled during checkout.</p>
          <Link className="cart-page__checkout" to="/checkout">
            Proceed to checkout
          </Link>
          <Link className="cart-page__link" to="/products">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  )
}

export default CartPage
