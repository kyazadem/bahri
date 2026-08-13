import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, signOut } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { 
  ChefHat, Package, CheckCircle, XCircle, Bell, 
  LogOut, Clock, TrendingUp 
} from 'lucide-react'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'
import type { Order, WaiterCall } from '@/types'

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'

export function KitchenDashboard() {
  const navigate = useNavigate()
  const { profile, isLoading: authLoading, isStaff } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([])
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0 })

  useEffect(() => {
    if (!authLoading && (!profile || profile.role === 'diner')) {
      navigate('/staff-login', { replace: true })
    }
  }, [authLoading, profile, navigate])

  useEffect(() => {
    if (!profile?.restaurant_id) return

    async function loadData() {
      const restaurantId = profile!.restaurant_id!
      
      const { data: orderData } = await supabase
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
        .limit(100)

      if (orderData) {
        setOrders(orderData as Order[])
        updateStats(orderData as Order[])
      }

      const { data: callData } = await supabase
        .from('waiter_calls')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (callData) setWaiterCalls(callData as WaiterCall[])
      setIsLoading(false)
    }

    loadData()
  }, [profile])

  useEffect(() => {
    if (!profile?.restaurant_id) return
    const restaurantId = profile.restaurant_id

    const orderChannel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
          }
        }
      )
      .subscribe()

    const callChannel = supabase
      .channel('kitchen-calls')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'waiter_calls', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setWaiterCalls(prev => [payload.new as WaiterCall, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setWaiterCalls(prev => 
              payload.new.status === 'resolved' 
                ? prev.filter(c => c.id !== payload.new.id)
                : prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c)
            )
          }
        }
      )
      .subscribe()

    return () => {
      orderChannel.unsubscribe()
      callChannel.unsubscribe()
    }
  }, [profile])

  function updateStats(orderList: Order[]) {
    const today = new Date().toISOString().split('T')[0]
    const todayOrders = orderList.filter(o => o.created_at.startsWith(today) && o.status !== 'cancelled')
    setStats({
      total: todayOrders.length,
      revenue: todayOrders.reduce((s, o) => s + o.total_amount, 0),
      pending: orderList.filter(o => o.status === 'pending').length,
    })
  }

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', orderId)
  }

  const acknowledgeCall = async (callId: string) => {
    await supabase.from('waiter_calls').update({ 
      status: 'acknowledged',
      acknowledged_by: profile?.id,
      acknowledged_at: new Date().toISOString(),
    }).eq('id', callId)
  }

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(o => o.status === activeTab)

  const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof ChefHat }> = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
    preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-700', icon: ChefHat },
    ready: { label: 'Ready', color: 'bg-purple-100 text-purple-700', icon: Package },
    served: { label: 'Served', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Kitchen Dashboard</h1>
              <p className="text-xs text-gray-400">{profile?.restaurant_id ? 'Connected' : 'No restaurant'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{profile?.email}</span>
            <button onClick={() => signOut()}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Today's Orders</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Revenue</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.revenue)}</p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          </div>
        </div>

        {waiterCalls.length > 0 && (
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-amber-400" />
              <h2 className="font-semibold text-amber-400">Waiter Calls ({waiterCalls.length})</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {waiterCalls.map(call => (
                <button key={call.id} onClick={() => acknowledgeCall(call.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-800/50 hover:bg-amber-700/50 rounded-lg transition-colors">
                  <span className="font-bold">Table {call.table_number}</span>
                  <span className="text-xs text-amber-300">{formatTimeAgo(call.created_at)}</span>
                  <CheckCircle className="w-4 h-4 text-amber-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {(['all', 'pending', 'preparing', 'ready', 'served', 'cancelled'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {tab === 'all' ? 'All Orders' : statusConfig[tab].label}
              {tab !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({orders.filter(o => o.status === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => {
            const config = statusConfig[order.status]
            return (
              <div key={order.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-gray-400 text-xs">#{order.id.slice(0, 8)}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{formatTimeAgo(order.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center font-bold text-sm">
                      {order.table_number}
                    </div>
                    <span className="text-sm text-gray-300">Table {order.table_number}</span>
                    {order.guest_name && (
                      <span className="text-xs text-gray-500">• {order.guest_name}</span>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">
                          {item.quantity}x {item.menu_item?.name}
                        </span>
                        <span className="text-gray-500">{formatCurrency(item.line_total)}</span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-xs text-amber-400 bg-amber-900/20 rounded-lg p-2 mb-3">
                      "{order.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <span className="font-bold text-lg">{formatCurrency(order.total_amount)}</span>
                    
                    <div className="flex gap-1">
                      {order.status === 'pending' && (
                        <button onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium transition-colors">
                          Start
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-medium transition-colors">
                          Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button onClick={() => updateOrderStatus(order.id, 'served')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-medium transition-colors">
                          Served
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'preparing') && (
                        <button onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded-lg text-xs font-medium transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No {activeTab === 'all' ? '' : activeTab} orders</p>
          </div>
        )}
      </main>
    </div>
  )
}
