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
    <div className="bg-animated" style={{ minHeight: '100vh' }}>
      <Toast queue={toast} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1a73e8' }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>Devhub</div>
              <div className="muted" style={{ fontSize: 13 }}>Collaborative AI Code Editor</div>
            </div>
          </div>
          <div className="glass" style={{ padding: '8px 12px' }}>{userEmail ? `Signed in as ${userEmail}` : 'Guest'}</div>
        </header>
        <main style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
          <section className="glass card-hover" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Create a new session</h2>
            <div className="muted" style={{ marginBottom: 12 }}>Spin up a fresh collaborative workspace.</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Project name (e.g., portfolio-app)" className="input" />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleCreate} className="btn btn-primary" style={{ marginTop: 12 }}>Create</button>
            </div>
          </section>
          <section className="glass card-hover" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Join a session</h2>
            <div className="muted" style={{ marginBottom: 12 }}>Enter a session code to preview details and join.</div>
            <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Session code" className="input" />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleJoin} className="btn btn-ghost" style={{ marginTop: 12 }}>Continue</button>
            </div>
          </section>
          <section className="glass card-hover" style={{ padding: 24, gridColumn: '1 / span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600 }}>Your sessions</h2>
              <div className="muted" style={{ fontSize: 13 }}>{mySessions.length} total</div>
            </div>
            {mySessions.length === 0 && <div className="muted">No sessions yet.</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {mySessions.map(s => (
                <div key={s.id} className="glass card-hover" style={{ padding: 16 }}>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Code: {s.code}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={()=>navigate(`/s/${s.code}`)} className="btn btn-primary" style={{ marginTop: 12 }}>Open</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="glass card-hover" style={{ padding: 24, gridColumn: '1 / span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 20, fontWeight: 600 }}>Community Discussions</h2>
              <button className="btn btn-ghost">New topic</button>
            </div>
            <div className="muted" style={{ marginTop: 8, marginBottom: 12 }}>A public space to share tips, ask questions, and collaborate.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {["Best Monaco keybindings", "Deploy FastAPI", "State mgmt in React", "SQLAlchemy patterns"].map((t, i) => (
                <div key={i} className="glass card-hover" style={{ padding: 16 }}>
                  <div style={{ fontWeight: 600 }}>{t}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>by community</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn btn-ghost">View</button>
                    <button className="btn btn-primary">Discuss</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}


