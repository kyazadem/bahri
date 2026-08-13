import { useState } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRestaurant } from '@/hooks/useRestaurant'

export function CallWaiterButton() {
  const { restaurantId, tableNumber } = useRestaurant()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const handleCall = async () => {
    if (!restaurantId || !tableNumber || status !== 'idle') return

    setStatus('sending')
    const { error } = await supabase.from('waiter_calls').insert({
      restaurant_id: restaurantId,
      table_number: tableNumber,
      call_type: 'general',
    })

    if (!error) {
      setStatus('sent')
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setStatus('idle')
      alert('Could not send call. Please try again.')
    }
  }

  return (
    <button
      onClick={handleCall}
      disabled={status !== 'idle'}
      className={`
        fixed bottom-6 right-6 z-50 rounded-full shadow-lg px-4 py-3 flex items-center gap-2
        transition-all duration-300 font-medium text-sm
        ${status === 'sent' 
          ? 'bg-green-500 text-white' 
          : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95'
        }
      `}
    >
      {status === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
      {status === 'sent' && <Check className="w-4 h-4" />}
      {status === 'idle' && <Bell className="w-4 h-4" />}
      <span>
        {status === 'idle' && 'Call Waiter'}
        {status === 'sending' && 'Calling...'}
        {status === 'sent' && 'Waiter Coming!'}
      </span>
    </button>
  )
}
