import { Link, useLocation } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import { useRestaurant } from '@/hooks/useRestaurant'
import { Home, ShoppingBag, Heart, Clock } from 'lucide-react'

export function BottomNav() {
  const location = useLocation()
  const { restaurantId, tableNumber } = useRestaurant()
  const { totalItems } = useCart(restaurantId, tableNumber)

  const navItems = [
    { to: '/', icon: Home, label: 'Menu' },
    { to: '/cart', icon: ShoppingBag, label: 'Cart', badge: totalItems },
    { to: '/favorites', icon: Heart, label: 'Saved' },
    { to: '/orders', icon: Clock, label: 'Orders' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const isActive = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
                isActive ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge ? (
                  <span className="absolute -top-2 -right-2 bg-brand-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
