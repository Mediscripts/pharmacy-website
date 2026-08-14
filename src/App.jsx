import { BrowserRouter, Route, Routes } from 'react-router-dom'
import SiteLayout from './components/layout/SiteLayout'
import ScrollToTop from './components/layout/ScrollToTop'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminCatalogPage from './pages/AdminCatalogPage'
import AdminProductPage from './pages/AdminProductPage'
import AdminInventoryPage from './pages/AdminInventoryPage'
import AdminPaymentsPage from './pages/AdminPaymentsPage'
import AdminPaymentSettingsPage from './pages/AdminPaymentSettingsPage'
import AdminLogsPage from './pages/AdminLogsPage'
import AdminStorefrontPage from './pages/AdminStorefrontPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminOrderPage from './pages/AdminOrderPage'
import AdminLoginPage from './pages/AdminLoginPage'
import CheckoutPage from './pages/CheckoutPage'
import TransferPaymentPage from './pages/TransferPaymentPage'
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
      <ScrollToTop />
      <Routes>
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<AdminDashboardPage />} />
        <Route path="admin/catalog" element={<AdminCatalogPage />} />
        <Route path="admin/catalog/:productId" element={<AdminProductPage />} />
        <Route path="admin/inventory" element={<AdminInventoryPage />} />
        <Route path="admin/payments" element={<AdminPaymentsPage />} />
        <Route path="admin/payment-settings" element={<AdminPaymentSettingsPage />} />
        <Route path="admin/logs" element={<AdminLogsPage />} />
        <Route path="admin/storefront" element={<AdminStorefrontPage />} />
        <Route path="admin/orders" element={<AdminOrdersPage />} />
        <Route path="admin/orders/:orderId" element={<AdminOrderPage />} />

        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:productSlug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="checkout/transfer/:orderNumber" element={<TransferPaymentPage />} />
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
