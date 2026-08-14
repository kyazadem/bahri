import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MenuItem } from '@/types'

export function useMenu(restaurantId: string) {
  const [items, setItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!restaurantId) {
      setIsLoading(false)
      return
    }

    async function loadMenu() {
      const { data, error: dbError } = await supabase
        .from('menu_items')
        .select('*, extras:menu_item_extras(*)')
        .eq('restaurant_id', restaurantId)
        .eq('available', true)
        .order('sort_order')

      if (dbError) {
        setError(dbError.message)
      } else {
        setItems(data as MenuItem[] || [])
      }
      setIsLoading(false)
    }

    loadMenu()
  }, [restaurantId])

  const categories = Array.from(new Set(items.map(i => i.category)))

  return { items, categories, isLoading, error }
}
