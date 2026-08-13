import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMenuItems } from '@/hooks/useMenuItems'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { MenuItem } from '@/types'

export function MenuManagerPage() {
  const { profile } = useAuth()
  const { items, isLoading, createItem, updateItem, deleteItem, toggleAvailability } = useMenuItems(profile?.restaurant_id)
  const { showToast } = useToast()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: '', category: 'starters', description: '', price: '',
    image_url: '', available: true, sort_order: '0',
    allergens: '', dietary_tags: '',
  })

  const categories = [...new Set(items.map(i => i.category))]

  const openCreate = () => {
    setEditingItem(null)
    setFormData({
      name: '', category: 'starters', description: '', price: '',
      image_url: '', available: true, sort_order: '0',
      allergens: '', dietary_tags: '',
    })
    setIsModalOpen(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      price: item.price.toString(),
      image_url: item.image_url || '',
      available: item.available,
      sort_order: item.sort_order.toString(),
      allergens: item.allergens?.join(', ') || '',
      dietary_tags: item.dietary_tags?.join(', ') || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.restaurant_id) return

    const payload = {
      restaurant_id: profile.restaurant_id,
      name: formData.name,
      category: formData.category,
      description: formData.description || null,
      price: parseFloat(formData.price),
      image_url: formData.image_url || null,
      available: formData.available,
      sort_order: parseInt(formData.sort_order),
      allergens: formData.allergens ? formData.allergens.split(',').map(s => s.trim()) : null,
      dietary_tags: formData.dietary_tags ? formData.dietary_tags.split(',').map(s => s.trim()) : null,
    }

    if (editingItem) {
      const success = await updateItem(editingItem.id, payload)
      if (success) {
        showToast('Item updated successfully', 'success')
        setIsModalOpen(false)
      } else {
        showToast('Failed to update item', 'error')
      }
    } else {
      const item = await createItem(payload as any)
      if (item) {
        showToast('Item created successfully', 'success')
        setIsModalOpen(false)
      } else {
        showToast('Failed to create item', 'error')
      }
    }
  }

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    const success = await deleteItem(item.id)
    if (success) {
      showToast('Item deleted', 'success')
    } else {
      showToast('Failed to delete item', 'error')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Manager</h1>
          <p className="text-gray-400 mt-1">Manage dishes, prices, and availability</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
                <th className="p-4 font-medium">Item</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td colSpan={5} className="p-4">
                      <div className="h-12 bg-gray-700 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No menu items yet. Add your first dish!
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-lg">🍽️</div>
                        )}
                        <div>
                          <p className="font-medium text-white">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-gray-700 rounded-full text-xs capitalize">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{formatCurrency(item.price)}</td>
                    <td className="p-4">
                      <button onClick={() => toggleAvailability(item.id, !item.available)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          item.available ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                        {item.available ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {item.available ? 'Live' : 'Hidden'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(item)}
                          className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Item' : 'Add Menu Item'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
              <input required value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
              <input required value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                list="categories"
                className="w-full px-3 py-2.5 bg
