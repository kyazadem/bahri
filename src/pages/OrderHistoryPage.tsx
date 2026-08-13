import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { BottomNav } from '@/components/BottomNav'
import { Clock, ChevronRight, LogIn } from 'lucide-react'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'
import type { Order } from '@/types'

export function OrderHistoryPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    async function loadOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            *,
            menu_item:menu_items(name, image_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data as Order[])
      }
      setIsLoading(false)
    }

    loadOrders()
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white px-4 py-4 border-b">
          <h1 className="font-semibold text-lg">Your Orders</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="font-semibold text-gray-800 mb-2">Sign in to see your orders</h2>
            <p className="text-gray-500 text-sm mb-6">Create an account to save your order history and favorites.</p>
            <Link to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors">
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b sticky top-[60px] z-30">
        <h1 className="font-semibold text-lg">Your Orders</h1>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1,2,3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders yet</p>
            <Link to="/" className="text-brand-600 font-medium mt-2 inline-block">Browse Menu →</Link>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400">{formatTimeAgo(order.created_at)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                  order.status === 'served' ? 'bg-green-50 text-green-700' :
                  order.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {order.status}
                </span>
              </div>
              
              <div className="space-y-2">
                {order.order_items?.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    {item.menu_item?.image_url ? (
                      <img src={item.menu_item.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs">🍽️</div>
                    )}
                    <span className="text-sm text-gray-600 flex-1">{item.menu_item?.name}</span>
                    <span className="text-sm text-gray-500">x{item.quantity}</span>
                  </div>
                ))}
                {order.order_items && order.order_items.length > 3 && (
                  <p className="text-xs text-gray-400">+{order.order_items.length - 3} more items</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="font-semibold text-brand-600">{formatCurrency(order.total_amount)}</span>
                <Link to={`/order-confirmation/${order.id}`} className="text-sm text-brand-600 flex items-center gap-1">
                  Details <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
