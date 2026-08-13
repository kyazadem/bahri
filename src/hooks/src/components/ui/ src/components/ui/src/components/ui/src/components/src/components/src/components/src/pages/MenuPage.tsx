import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useAuth } from '@/hooks/useAuth'
import { MenuItemCard } from '@/components/MenuItemCard'
import { BottomNav } from '@/components/BottomNav'
import { CallWaiterButton } from '@/components/CallWaiterButton'
import { Search } from 'lucide-react'
import type { MenuItem } from '@/types'

export function MenuPage() {
  const { restaurantId, tableNumber, restaurant } = useRestaurant()
  const { user } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    if (!restaurantId) return

    async function loadMenu() {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          extras:menu_item_extras(*)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('available', true)
        .order('sort_order', { ascending: true })
        .order('name')

      if (!error && data) {
        setMenuItems(data as MenuItem[])
      }
      setIsLoading(false)
    }

    loadMenu()
  }, [restaurantId])

  useEffect(() => {
    if (!user || !restaurantId) return

    supabase
      .from('favorites')
      .select('menu_item_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setFavorites(new Set(data.map(f => f.menu_item_id)))
        }
      })
  }, [user, restaurantId])

  const toggleFavorite = async (menuItemId: string) => {
    if (!user) return

    const isFav = favorites.has(menuItemId)
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('menu_item_id', menuItemId)
      setFavorites(prev => {
        const next = new Set(prev)
        next.delete(menuItemId)
        return next
      })
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, menu_item_id: menuItemId })
      setFavorites(prev => new Set(prev).add(menuItemId))
    }
  }

  const categories = useMemo(() => {
    const cats = [...new Set(menuItems.map(i => i.category))]
    return ['all', ...cats]
  }, [menuItems])

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [menuItems, activeCategory, searchQuery])

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="sticky top-[60px] z-30 bg-gray-50 pb-2 pt-3 px-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {activeCategory === 'all' ? (
          categories.filter(c => c !== 'all').map(category => {
            const items = filteredItems.filter(i => i.category === category)
            if (items.length === 0) return null
            return (
              <section key={category} className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
                  {category}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {items.map(item => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      currency={restaurant?.currency}
                      isFavorite={favorites.has(item.id)}
                      onToggleFavorite={user ? () => toggleFavorite(item.id) : undefined}
                    />
                  ))}
                </div>
              </section>
            )
          })
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                currency={restaurant?.currency}
                isFavorite={favorites.has(item.id)}
                onToggleFavorite={user ? () => toggleFavorite(item.id) : undefined}
              />
            ))}
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No dishes found</p>
          </div>
        )}
      </div>

      <BottomNav />
      <CallWaiterButton />
    </div>
  )
}
