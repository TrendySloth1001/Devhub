import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Toast from '../components/Toast'
import type { ToastMessage } from '../components/Toast'
import { useSessionStore } from '../store/session'

type Session = { id:number; name:string; code:string; created_at:string }

export default function HomePage() {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  const [mySessions, setMySessions] = useState<Session[]>([])
  const [toast, setToast] = useState<ToastMessage[]>([])
  const userEmail = useSessionStore(s => s.userEmail)

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await axios.get('/api/sessions/mine', { headers: { Authorization: `Bearer ${token}` }})
        setMySessions(res.data)
      } catch {}
    })()
  }, [])

  async function handleCreate() {
    const token = localStorage.getItem('token')
    if (!token) return navigate('/login')
    const res = await axios.post('/api/sessions/create', { name }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    navigate(`/s/${res.data.code}`)
  }

  async function handleJoin() {
    if (!code) return
    try {
      const res = await axios.get(`/api/sessions/info/${code}`)
      const info = res.data as { name:string; code:string; owner_email?:string }
      setToast([{ id: Date.now(), type: 'info', text: `Joining ${info.name} (${info.owner_email ?? 'unknown'})` }])
      navigate(`/s/${code}`)
    } catch (e:any) {
      setToast([{ id: Date.now(), type: 'error', text: 'Session code not found' }])
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>
      <Toast queue={toast} />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: '#1f2937' }}>Devhub Collaborative Editor</h1>
          <div style={{ color: '#64748b' }}>{userEmail ? `Signed in as ${userEmail}` : 'Guest'}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginTop: 32 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>Create a new session</h2>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Project name" style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 12px' }} />
            <button onClick={handleCreate} style={{ marginTop: 16, padding: '10px 16px', background: '#1a73e8', color: '#fff', border: 0, borderRadius: 6 }}>Create</button>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>Join a session</h2>
            <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Session code" style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 12px' }} />
            <button onClick={handleJoin} style={{ marginTop: 16, padding: '10px 16px', background: '#1a73e8', color: '#fff', border: 0, borderRadius: 6 }}>Join</button>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>Your sessions</h2>
            {mySessions.length === 0 && <div style={{ color: '#64748b' }}>No sessions yet.</div>}
            <div>
              {mySessions.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e5e7eb' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{s.name}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>Code: {s.code}</div>
                  </div>
                  <div>
                    <button onClick={()=>navigate(`/s/${s.code}`)} style={{ padding: '6px 10px', background: '#1a73e8', color: '#fff', border: 0, borderRadius: 6 }}>Open</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


