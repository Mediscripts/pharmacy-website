import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useCart from '../../context/useCart'
import './ProductCard.css'

function ProductCard({
  id,
  category,
  name,
  description,
  price,
  note,
  image,
  inStock,
  prescriptionRequired,
  slug,
}) {
  const { addToCart } = useCart()
  const [feedback, setFeedback] = useState('')
  const productPath = `/products/${slug || id}`

  const handleAdd = () => {
    if (inStock === false) {
      return
    }

    addToCart({
      id,
      category,
      name,
      description,
      price,
      note,
      image,
      inStock,
      prescriptionRequired,
    })
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
      <Link
        className="product-card__image-link"
        to={productPath}
        aria-label={`View details for ${name}`}
      >
        <img className="product-card__image" src={image || '/product-placeholder.svg'} alt={name} />
      </Link>

      <div className="product-card__content">
        <div className="product-card__header">
          <Link className="product-card__title-link" to={productPath}>
            <div className="product-card__title-group">
              <h3>{name}</h3>
              <span className="product-card__category">{category}</span>
            </div>
          </Link>

          {prescriptionRequired ? (
            <span
              className="product-card__prescription"
              title="Prescription required for this medicine"
              aria-label="Prescription required for this medicine"
            >
              Prescription required
            </span>
          ) : null}
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
