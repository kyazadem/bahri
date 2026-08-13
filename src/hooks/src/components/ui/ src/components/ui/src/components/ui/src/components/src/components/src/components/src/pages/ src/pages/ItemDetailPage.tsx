import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useCart } from '@/hooks/useCart'
import { ChevronLeft, Minus, Plus, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { MenuItem, MenuItemExtra, CartExtra } from '@/types'

export function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const { restaurantId, tableNumber, restaurant } = useRestaurant()
  const { addItem } = useCart(restaurantId, tableNumber)
  
  const [item, setItem] = useState<MenuItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedExtras, setSelectedExtras] = useState<CartExtra[]>([])
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [added, setAdded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!itemId || !restaurantId) return

    async function loadItem() {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          extras:menu_item_extras(*)
        `)
        .eq('id', itemId)
        .eq('restaurant_id', restaurantId)
        .single()

      if (!error && data) {
        const menuItem = data as MenuItem
        setItem(menuItem)
        const defaults = menuItem.extras?.filter(e => e.is_default).map(e => ({
          extra_id: e.id,
          name: e.name,
          price: e.extra_price,
        })) || []
        setSelectedExtras(defaults)
      }
      setIsLoading(false)
    }

    loadItem()
  }, [itemId, restaurantId])

  const toggleExtra = (extra: MenuItemExtra) => {
    setSelectedExtras(prev => {
      const exists = prev.find(e => e.extra_id === extra.id)
      if (exists) {
        return prev.filter(e => e.extra_id !== extra.id)
      }
      return [...prev, { extra_id: extra.id, name: extra.name, price: extra.extra_price }]
    })
  }

  const handleAddToCart = () => {
    if (!item) return

    addItem({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      extras: selectedExtras,
      image_url: item.image_url,
      special_instructions: specialInstructions,
    })

    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      navigate(-1)
    }, 1200)
  }

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0)
  const unitTotal = item ? item.price + extrasTotal : 0
  const lineTotal = unitTotal * quantity

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="aspect-square bg-gray-200 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Item not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="relative aspect-square bg-gray-100">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
          <p className="text-xl font-semibold text-brand-600 mt-1">
            {formatCurrency(item.price, restaurant?.currency)}
          </p>
          {item.description && (
            <p className="text-gray-600 mt-3 leading-relaxed">{item.description}</p>
          )}
        </div>

        {item.extras && item.extras.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Add-ons</h3>
            <div className="space-y-2">
              {item.extras.map(extra => {
                const isSelected = selectedExtras.some(e => e.extra_id === extra.id)
                return (
                  <button
                    key={extra.id}
                    onClick={() => toggleExtra(extra)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isSelected 
                        ? 'border-brand-500 bg-brand-50' 
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{extra.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      +{formatCurrency(extra.extra_price, restaurant?.currency)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Special Instructions</h3>
          <textarea
            value={specialInstructions}
            onChange={e => setSpecialInstructions(e.target.value)}
            placeholder="Any requests? (e.g. less spicy, no onions)"
            className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            rows={3}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={added}
            className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all ${
              added 
                ? 'bg-green-500' 
                : 'bg-brand-600 hover:bg-brand-700 active:scale-[0.98]'
            }`}
          >
            {added ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Added!
              </span>
            ) : (
              <span className="flex items-center justify-between px-4">
                <span>Add to Order</span>
                <span>{formatCurrency(lineTotal, restaurant?.currency)}</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
        }
