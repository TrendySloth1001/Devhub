import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import { useSessionStore } from '../store/session'

type Doc = { id:number; title:string; content:string; language:string }

export default function EditorPage() {
  const { code } = useParams<{code:string}>()
  const navigate = useNavigate()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [document, setDocument] = useState<Doc | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [messages, setMessages] = useState<{user?:string; content:string; created_at?:string}[]>([])
  const userEmail = useSessionStore(s => s.userEmail)

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token')
      if (!token) return navigate('/login')
      const sess = await axios.get(`/api/sessions/by-code/${code}` , { headers: { Authorization: `Bearer ${token}` }})
      const sessionId = sess.data.id
      const docsRes = await axios.get(`/api/sessions/${sessionId}/documents`, { headers: { Authorization: `Bearer ${token}` }})
      setDocs(docsRes.data)
      setDocument(docsRes.data[0])
      // Load chat history
      const hist = await axios.get(`/api/sessions/${sessionId}/messages`, { headers: { Authorization: `Bearer ${token}` }})
      setMessages((hist.data || []).map((m:any) => ({ user: m.user_email || 'anon', content: m.content, created_at: m.created_at })))
    })()
  }, [code, navigate])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const s = io('http://localhost:8000', { path: '/socket.io', transports: ['websocket', 'polling'] })
    s.on('connect', () => {
      s.emit('join_session', { code, token })
    })
    s.on('editor_change', (data:{document_id?:number; content:string}) => {
      setDocument(d => d && (!data.document_id || d.id === data.document_id) ? { ...d, content: data.content } : d)
    })
    s.on('chat_message', (data:{user?:string; content:string; created_at?:string}) => {
      setMessages(m => [...m, data])
    })
    setSocket(s)
    return () => { s.disconnect() }
  }, [code])

  const lastEmit = useRef(0)
  const onChange = (value: string | undefined) => {
    setDocument(d => d ? { ...d, content: value || '' } : d)
    const now = Date.now()
    if (now - lastEmit.current > 80) {
      lastEmit.current = now
      socket?.emit('editor_change', { document_id: document?.id, content: value, ts: now })
    }
  }

  async function save() {
    const token = localStorage.getItem('token')
    if (!token || !document) return
    await axios.patch(`/api/sessions/documents/${document.id}`, {
      content: document.content
    }, { headers: { Authorization: `Bearer ${token}` }})
  }

  const [chatInput, setChatInput] = useState('')
  function sendChat() {
    if (!chatInput.trim()) return
    socket?.emit('chat_message', { content: chatInput })
    setChatInput('')
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f8fa' }}>
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ fontWeight: 500 }}>Session {code}</div>
        <div>
          <span style={{ marginRight: 12, color: '#64748b' }}>{userEmail}</span>
          <button onClick={save} style={{ padding: '6px 12px', background: '#1a73e8', color: '#fff', border: 0, borderRadius: 6, marginRight: 8 }}>Save</button>
          <button onClick={()=>navigate('/')} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 0, borderRadius: 6 }}>Exit</button>
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '1px solid #e5e7eb' }}>
          <Editor
            height="100%"
            theme="light"
            language={document?.language || 'typescript'}
            value={document?.content || ''}
            onChange={onChange}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />
        </div>
        <div style={{ width: 320, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 40, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>Files</div>
          <div style={{ maxHeight: 160, overflow: 'auto', padding: 12, background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
            {docs.map(d => (
              <div key={d.id} onClick={()=>setDocument(d)} style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: document?.id===d.id?'#eef2ff':'transparent' }}>{d.title}</div>
            ))}
            <CreateFile code={code!} onCreated={(doc)=>{ setDocs(x=>[...x, doc]); setDocument(doc) }} />
          </div>
          <div style={{ height: 40, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>Chat</div>
          <div style={{ flex: 1, overflow: 'auto', padding: 12, background: '#fff' }}>
            {messages.map((m, i) => {
              const mine = m.user === userEmail
              return (
                <div key={i} style={{ display: 'flex', justifyContent: mine?'flex-end':'flex-start', marginBottom: 8 }}>
                  <div style={{ maxWidth: 220, background: mine?'#dcfce7':'#e0f2fe', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{m.user || 'anon'}{m.created_at?` • ${new Date(m.created_at).toLocaleTimeString()}`:''}</div>
                    <div style={{ fontSize: 14 }}>{m.content}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ padding: 8, borderTop: '1px solid #e5e7eb', background: '#fff' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Type a message" style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px' }} />
              <button onClick={sendChat} style={{ padding: '6px 12px', background: '#1a73e8', color: '#fff', borderRadius: 6, border: 0 }}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateFile({ code, onCreated }: { code: string; onCreated: (doc: Doc)=>void }) {
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  async function create() {
    if (!title.trim()) return
    setCreating(true)
    try {
      const token = localStorage.getItem('token')
      const sess = await axios.get(`/api/sessions/by-code/${code}`, { headers: { Authorization: `Bearer ${token}` }})
      const res = await axios.post(`/api/sessions/${sess.data.id}/documents`, { title }, { headers: { Authorization: `Bearer ${token}` }})
      onCreated(res.data)
      setTitle('')
    } finally {
      setCreating(false)
    }
  }
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <input placeholder="New file name" value={title} onChange={e=>setTitle(e.target.value)} style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px' }} />
      <button disabled={creating} onClick={create} style={{ padding: '6px 12px', background: '#1a73e8', color: '#fff', borderRadius: 6, border: 0 }}>Add</button>
    </div>
  )
}


