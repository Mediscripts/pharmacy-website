import useCart from '../../context/useCart'
import { Link } from 'react-router-dom'
import './ProductCard.css'

function ProductCard({
  id,
  category,
  name,
  description,
  price,
  image,
  inStock,
  prescriptionRequired,
  slug,
  images,
}) {
  const { addToCart } = useCart()
  const productPath = `/products/${slug || id}`
  const imageSource =
    image || (Array.isArray(images) && images.length > 0 ? images[0] : '/product-placeholder.svg')

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
      image,
      inStock,
      prescriptionRequired,
    })
  }

  const isOutOfStock = inStock === false
  const isPrescriptionItem = Boolean(prescriptionRequired)

  return (
    <article className="product-card">
      <Link
        className="product-card__image-link"
        to={productPath}
        aria-label={`View details for ${name}`}
      >
        <img className="product-card__image" src={imageSource} alt={name} />
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
        ) : isPrescriptionItem ? (
          <div className="product-card__action-copy">
            <span className="product-card__action-label">Prescription required</span>
            <Link className="product-card__visit-link" to="/contact">
              Visit our store
            </Link>
          </div>
        ) : (
          <button type="button" className="product-card__button" onClick={handleAdd}>
            Add to cart
          </button>
        )}
      </div>
      </div>
    </article>
  )
}

export default ProductCard
