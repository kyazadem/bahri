import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { 
  TrendingUp, DollarSign, Clock, Package, ChefHat, CheckCircle 
} from 'lucide-react'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'
import type { Order } from '@/types'

export function OwnerDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!profile?.restaurant_id) return

    async function loadData() {
      const restaurantId = profile!.restaurant_id!
      const today = new Date().toISOString().split('T')[0]

      const { data: todayData } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', today)

      if (todayData) {
        const valid = todayData.filter((o: any) => o.status !== 'cancelled')
        const total = valid.reduce((s: number, o: any) => s + o.total_amount, 0)
        setStats({
          todayOrders: valid.length,
          todayRevenue: total,
          avgOrderValue: valid.length > 0 ? total / valid.length : 0,
          pendingOrders: todayData.filter((o: any) => o.status === 'pending').length,
        })
      }

      const { data: recent } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            *,
            menu_item:menu_items(name)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (recent) setRecentOrders(recent as Order[])
      setIsLoading(false)
    }

    loadData()
  }, [profile])

  const statCards = [
    { label: "Today's Orders", value: stats.todayOrders, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue), icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Avg Order', value: formatCurrency(stats.avgOrderValue), icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Pending', value: stats.pendingOrders, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your restaurant today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-700">
          <h2 className="font-semibold text-lg">Recent Orders</h2>
        </div>
        <div className="divide-y divide-gray-700">
          {isLoading ? (
            [1,2,3,4,5].map(i => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-700 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-gray-700 rounded w-48 animate-pulse" />
                </div>
              </div>
            ))
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No orders yet today
            </div>
          ) : (
            recentOrders.map(order => (
              <div key={order.id} className="p-4 flex items-center gap-4 hover:bg-gray-700/50 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  order.status === 'served' ? 'bg-green-500/10' :
                  order.status === 'ready' ? 'bg-purple-500/10' :
                  order.status === 'preparing' ? 'bg-blue-500/10' :
                  'bg-amber-500/10'
                }`}>
                  {order.status === 'served' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                   order.status === 'ready' ? <Package className="w-5 h-5 text-purple-400" /> :
                   order.status === 'preparing' ? <ChefHat className="w-5 h-5 text-blue-400" /> :
                   <Clock className="w-5 h-5 text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Order #{order.id.slice(0, 8)}</span>
                    <span className="text-xs text-gray-500">Table {order.table_number}</span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {order.order_items?.map(i => `${i.quantity}x ${i.menu_item?.name}`).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(order.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
