import { useEffect, useState } from 'react'
import useCart from '../../context/useCart'
import './ProductCard.css'

function ProductCard({ id, category, name, description, price, note, image, inStock }) {
  const { addToCart } = useCart()
  const [feedback, setFeedback] = useState('')

  const handleAdd = () => {
    if (inStock === false) {
      return
    }

    addToCart({ id, category, name, description, price, note, image, inStock })
    setFeedback('Added to cart')
  }

  useEffect(() => {
    if (!feedback) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setFeedback(''), 1200)
    return () => window.clearTimeout(timeoutId)
  }, [feedback])

  const isOutOfStock = inStock === false

  return (
    <article className="product-card">
      <img className="product-card__image" src={image || '/product-placeholder.svg'} alt={name} />

      <div className="product-card__content">
        <div className="product-card__header">
          <h3>{name}</h3>
          <span className="product-card__category">{category}</span>
        </div>

        <p>{description}</p>

        <div className="product-card__footer">
          <strong>NGN {price.toLocaleString()}</strong>
          {isOutOfStock ? (
            <span className="product-card__stock product-card__stock--out">Out of stock</span>
          ) : (
            <button type="button" className="product-card__button" onClick={handleAdd}>
              {feedback || 'Add to cart'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default ProductCard
