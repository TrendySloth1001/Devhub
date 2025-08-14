import { useEffect, useState } from 'react'

export type ToastMessage = { id: number; type?: 'info' | 'success' | 'error'; text: string }

export default function Toast({ queue }: { queue: ToastMessage[] }) {
  const [messages, setMessages] = useState<ToastMessage[]>(queue)
  useEffect(() => setMessages(queue), [queue])

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50 }}>
      {messages.map(m => (
        <div key={m.id} style={{ padding: '10px 12px', borderRadius: 8, background: m.type==='error'?'#fee2e2':m.type==='success'?'#dcfce7':'#e0f2fe', color: '#111827', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          {m.text}
        </div>
      ))}
    </div>
  )
}


