import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRestaurant } from '@/hooks/useRestaurant'
import { BottomNav } from '@/components/BottomNav'
import { MenuItemCard } from '@/components/MenuItemCard'
import { Heart, LogIn } from 'lucide-react'
import type { MenuItem } from '@/types'

export function FavoritesPage() {
  const { user } = useAuth()
  const { restaurantId, restaurant } = useRestaurant()
  const [favorites, setFavorites] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    async function loadFavorites() {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          menu_item:menu_items(*, extras:menu_item_extras(*))
        `)
        .eq('user_id', user.id)

      if (!error && data) {
        const items = data
          .map((f: any) => f.menu_item)
          .filter((item: MenuItem) => item.restaurant_id === restaurantId)
        setFavorites(items)
      }
      setIsLoading(false)
    }

    loadFavorites()
  }, [user, restaurantId])

  const removeFavorite = async (menuItemId: string) => {
    if (!user) return
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('menu_item_id', menuItemId)
    setFavorites(prev => prev.filter(f => f.id !== menuItemId))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white px-4 py-4 border-b">
          <h1 className="font-semibold text-lg">Saved Dishes</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="font-semibold text-gray-800 mb-2">Sign in to save favorites</h2>
            <p className="text-gray-500 text-sm mb-6">Keep track of your favorite dishes across visits.</p>
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
        <h1 className="font-semibold text-lg">Saved Dishes</h1>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No saved dishes yet</p>
            <Link to="/" className="text-brand-600 font-medium mt-2 inline-block">Browse Menu →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                currency={restaurant?.currency}
                isFavorite={true}
                onToggleFavorite={() => removeFavorite(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
