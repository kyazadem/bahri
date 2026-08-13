import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { RestaurantProvider } from '@/hooks/useRestaurant'
import { ToastProvider } from '@/components/ui/Toast'
import { Layout } from '@/components/Layout'
import { MenuPage } from '@/pages/MenuPage'
import { ItemDetailPage } from '@/pages/ItemDetailPage'
import { CartPage } from '@/pages/CartPage'
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage'
import { OrderHistoryPage } from '@/pages/OrderHistoryPage'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { DinerLoginPage } from '@/pages/DinerLoginPage'
import { StaffLoginPage } from '@/pages/StaffLoginPage'
import { KitchenDashboard } from '@/pages/KitchenDashboard'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/staff-login" element={<StaffLoginPage />} />
            <Route path="/kitchen" element={<KitchenDashboard />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            <Route element={<RestaurantProvider><Layout /></RestaurantProvider>}>
              <Route path="/" element={<MenuPage />} />
              <Route path="/item/:itemId" element={<ItemDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/login" element={<DinerLoginPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App

