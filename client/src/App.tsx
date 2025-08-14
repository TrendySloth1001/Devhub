import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useSessionStore } from './store/session'
import EditorPage from './pages/EditorPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/s/:code" element={<EditorPage />} />
    </Routes>
  )
}

export default function App() {
  const load = useSessionStore(s => s.loadFromStorage)
  useEffect(() => { load() }, [load])
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}
