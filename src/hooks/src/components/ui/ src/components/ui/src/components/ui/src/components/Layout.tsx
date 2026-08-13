import { Outlet } from 'react-router-dom'
import { useRestaurant } from '@/hooks/useRestaurant'
import { Utensils } from 'lucide-react'

export function Layout() {
  const { isLoading, error, restaurant } = useRestaurant()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Oops!</h1>
          <p className="text-gray-500">{error}</p>
          <p className="text-sm text-gray-400 mt-4">
            Please scan the QR code on your table to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {restaurant?.logo_url ? (
            <img src={restaurant.logo_url} alt={restaurant.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-brand-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">{restaurant?.name || 'Bahri'}</h1>
            <p className="text-xs text-gray-500">Table {restaurant ? '●' : ''}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
