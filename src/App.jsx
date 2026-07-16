import { BrowserRouter, Route, Routes } from 'react-router-dom'
import SiteLayout from './components/layout/SiteLayout'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminCatalogPage from './pages/AdminCatalogPage'
import AdminProductPage from './pages/AdminProductPage'
import AdminInventoryPage from './pages/AdminInventoryPage'
import AdminLoginPage from './pages/AdminLoginPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import TrackOrderPage from './pages/TrackOrderPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<AdminDashboardPage />} />
        <Route path="admin/catalog" element={<AdminCatalogPage />} />
        <Route path="admin/catalog/:productId" element={<AdminProductPage />} />
        <Route path="admin/inventory" element={<AdminInventoryPage />} />

        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:productSlug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="checkout/success/:orderNumber" element={<OrderConfirmationPage />} />
          <Route path="track-order" element={<TrackOrderPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
