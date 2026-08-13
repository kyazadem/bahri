import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Clock, ChefHat, Package, Truck } from 'lucide-react'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'
import type { Order } from '@/types'

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return

    async function loadOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            *,
            menu_item:menu_items(name, image_url)
          )
        `)
        .eq('id', orderId)
        .single()

      if (!error && data) {
        setOrder(data as Order)
      }
      setIsLoading(false)
    }

    loadOrder()

    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(prev => prev ? { ...prev, status: payload.new.status } : null)
        }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [orderId])

  const statusSteps = [
    { status: 'pending', label: 'Received', icon: CheckCircle },
    { status: 'preparing', label: 'Preparing', icon: ChefHat },
    { status: 'ready', label: 'Ready', icon: Package },
    { status: 'served', label: 'Served', icon: Truck },
  ]

  const currentStepIndex = statusSteps.findIndex(s => s.status === order?.status)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Order not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center pt-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order Placed!</h1>
          <p className="text-gray-500 mt-1">Order #{order.id.slice(0, 8)}</p>
          <p className="text-sm text-gray-400 mt-1">{formatTimeAgo(order.created_at)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, idx) => {
              const isActive = idx <= currentStepIndex
              const isCurrent = idx === currentStepIndex
              return (
                <div key={step.status} className="flex flex-col items-center gap-1 flex-1 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-brand-100' : ''}`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-brand-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                  {idx < statusSteps.length - 1 && (
                    <div className={`absolute top-4 left-1/2 w-full h-0.5 -z-10 ${
                      idx < currentStepIndex ? 'bg-brand-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">Order Summary</h2>
          </div>
          {order.order_items?.map((item) => (
            <div key={item.id} className="p-4 flex items-center gap-3 border-b border-gray-50 last:border-0">
              {item.menu_item?.image_url ? (
                <img src={item.menu_item.image_url} alt={item.menu_item.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">🍽️</div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.menu_item?.name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-brand-600">
                {formatCurrency(item.line_total)}
              </span>
            </div>
          ))}
          <div className="p-4 bg-gray-50 flex justify-between items-center">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="text-lg font-bold text-brand-600">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        <Link to="/"
          className="block w-full py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-center hover:bg-brand-700 transition-colors">
          Back to Menu
        </Link>
      </div>
    </div>
  )
          }
