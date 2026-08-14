import { useState, useEffect, useCallback } from 'react'
import type { CartItem } from '@/types'

const CART_KEY = 'bahri_cart'

function getStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(getStoredCart)

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(
        i => i.menu_item_id === item.menu_item_id && 
             JSON.stringify(i.extras) === JSON.stringify(item.extras)
      )
      if (existing) {
        return prev.map(i =>
          i.menu_item_id === item.menu_item_id && 
          JSON.stringify(i.extras) === JSON.stringify(item.extras)
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((menuItemId: string, extras: CartItem['extras']) => {
    setItems(prev => prev.filter(
      i => !(i.menu_item_id === menuItemId && JSON.stringify(i.extras) === JSON.stringify(extras))
    ))
  }, [])

  const updateQuantity = useCallback((menuItemId: string, extras: CartItem['extras'], quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId, extras)
      return
    }
    setItems(prev => prev.map(i =>
      i.menu_item_id === menuItemId && JSON.stringify(i.extras) === JSON.stringify(extras)
        ? { ...i, quantity }
        : i
    ))
  }, [removeItem])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => sum + (i.price + i.extras.reduce((e, x) => e + x.price, 0)) * i.quantity, 0)

  return { items, addItem, removeItem, updateQuantity, clearCart, total, count: items.reduce((c, i) => c + i.quantity, 0) }
                             }
