import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/lib/utils'
import type { MenuItem } from '@/types'

interface Props {
  item: MenuItem
  isFavorite?: boolean
  onToggleFavorite?: () => void
  currency?: string
}

export function MenuItemCard({ item, isFavorite, onToggleFavorite, currency = 'USD' }: Props) {
  return (
    <Link
      to={`/item/${item.id}`}
      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white/90 px-3 py-1 rounded-full text-sm font-medium text-gray-800">
              Sold Out
            </span>
          </div>
        )}

        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault()
              onToggleFavorite()
            }}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
          >
            <Heart 
              className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
            />
          </button>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 text-sm leading-tight flex-1">{item.name}</h3>
          <span className="font-semibold text-brand-600 text-sm whitespace-nowrap">
            {formatCurrency(item.price, currency)}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
        )}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.dietary_tags.map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
      }
