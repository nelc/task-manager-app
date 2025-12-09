import { useState, useEffect } from 'react'
import Login from './components/Login'
import TaskManager from './components/TaskManager'
import Settings from './components/Settings'

function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('tasks')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCurrentPage('tasks')
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app">
      {user ? (
        <>
          {currentPage === 'tasks' && (
            <TaskManager user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />
          )}
          {currentPage === 'settings' && (
            <Settings user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />
          )}
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App

