import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { BottomNav } from '@/components/BottomNav'
import { ChevronLeft, Minus, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function CartPage() {
  const navigate = useNavigate()
  const { restaurantId, tableNumber, restaurant } = useRestaurant()
  const { user } = useAuth()
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart(restaurantId, tableNumber)
  
  const [notes, setNotes] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (items.length === 0) return
    setIsSubmitting(true)
    setError('')

    try {
      const orderItems = items.map(item => ({
        menu_item_id: item.menu_item_id,
        qty: item.quantity,
        extras: item.extras.map(e => ({ extra_id: e.extra_id })),
      }))

      const { data: orderId, error: rpcError } = await supabase.rpc('validate_and_create_order', {
        p_restaurant_id: restaurantId,
        p_table_number: tableNumber,
        p_items: orderItems,
        p_user_id: user?.id || null,
        p_guest_name: guestName || null,
        p_guest_phone: guestPhone || null,
        p_notes: notes || null,
      })

      if (rpcError) throw rpcError

      clearCart()
      navigate(`/order-confirmation/${orderId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white px-4 py-3 flex items-center gap-3 border-b">
          <button onClick={() => navigate(-1)}><ChevronLeft className="w-5 h-5" /></button>
          <h1 className="font-semibold text-lg">Your Order</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-500">Your cart is empty</p>
            <button onClick={() => navigate('/')} className="mt-4 text-brand-600 font-medium">
              Browse Menu →
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b sticky top-[60px] z-30">
        <button onClick={() => navigate(-1)}><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="font-semibold text-lg">Your Order</h1>
        <span className="ml-auto text-sm text-gray-500">Table {tableNumber}</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {items.map((item, idx) => {
            const itemTotal = (item.price + item.extras.reduce((s, e) => s + e.price, 0)) * item.quantity
            return (
              <div key={`${item.menu_item_id}-${JSON.stringify(item.extras)}`} 
                   className={`p-4 flex gap-3 ${idx > 0 ? 'border-t border-gray-50' : ''}`}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">🍽️</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                  {item.extras.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      + {item.extras.map(e => e.name).join(', ')}
                    </p>
                  )}
                  {item.special_instructions && (
                    <p className="text-xs text-amber-600 mt-0.5">"{item.special_instructions}"</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.menu_item_id, item.extras, item.quantity - 1)}
                        className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menu_item_id, item.extras, item.quantity + 1)}
                        className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-brand-600">
                        {formatCurrency(itemTotal, restaurant?.currency)}
                      </span>
                      <button onClick={() => removeItem(item.menu_item_id, item.extras)}
                        className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!user && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <h3 className="font-medium text-gray-800">Contact Info</h3>
            <input type="text" placeholder="Your name (optional)" value={guestName}
              onChange={e => setGuestName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <input type="tel" placeholder="Phone number (optional)" value={guestPhone}
              onChange={e => setGuestPhone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-medium text-gray-800 mb-2">Order Notes</h3>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any special requests for the kitchen?"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            rows={2} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">{formatCurrency(totalPrice, restaurant?.currency)}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-brand-600">
              {formatCurrency(totalPrice, restaurant?.currency)}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="fixed bottom-[72px] left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="w-full max-w-lg mx-auto block py-3.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50">
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
            </span>
          ) : (
            `Place Order • ${formatCurrency(totalPrice, restaurant?.currency)}`
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
