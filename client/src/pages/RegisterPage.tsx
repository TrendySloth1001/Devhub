import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await axios.post('/api/users/register', { email, password })
      navigate('/login')
    } catch (err:any) {
      setError(err?.response?.data?.detail || 'Registration failed')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa' }}>
      <form onSubmit={submit} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Create account</h1>
        {error && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{error}</div>}
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{ width: '100%', marginBottom: 12, border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 12px' }} />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={{ width: '100%', marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 12px' }} />
        <button style={{ width: '100%', background: '#1a73e8', color: '#fff', borderRadius: 6, padding: '10px 12px', border: 0 }}>Sign up</button>
        <div style={{ marginTop: 16, fontSize: 14, color: '#64748b' }}>Have an account? <Link to="/login" style={{ color: '#1a73e8' }}>Sign in</Link></div>
      </form>
    </div>
  )
}


