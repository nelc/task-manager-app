import { useState, useEffect } from 'react'
import axios from 'axios'

function Settings({ user, onLogout }) {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingSetting, setEditingSetting] = useState(null)
  const [newSetting, setNewSetting] = useState({ key: '', value: '', description: '' })
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSettings(response.data)
    } catch (error) {
      console.error('Error fetching settings:', error)
      if (error.response?.status === 401) {
        onLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSetting = async (key, value, description) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`/api/settings/${key}`, { value, description }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchSettings()
      setEditingSetting(null)
    } catch (error) {
      console.error('Error updating setting:', error)
      alert(error.response?.data?.error || 'Failed to update setting')
    }
  }

  const handleAddSetting = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/settings', newSetting, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchSettings()
      setNewSetting({ key: '', value: '', description: '' })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding setting:', error)
      alert(error.response?.data?.error || 'Failed to add setting')
    }
  }

  const handleDeleteSetting = async (key) => {
    if (!confirm(`Are you sure you want to delete the setting "${key}"?`)) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/settings/${key}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchSettings()
    } catch (error) {
      console.error('Error deleting setting:', error)
      alert(error.response?.data?.error || 'Failed to delete setting')
    }
  }

  if (!user.isAdmin) {
    return (
      <div className="task-manager">
        <header className="header">
          <h1>⚙️ Settings</h1>
          <div className="user-info">
            <span className="user-name">Hello, {user.username}!</span>
            <button onClick={onLogout} className="btn-logout">Logout</button>
          </div>
        </header>
        <main className="main-content">
          <div className="tasks-section">
            <h2>Access Denied</h2>
            <p>You do not have permission to access this page.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="task-manager">
      <header className="header">
        <h1>⚙️ Settings</h1>
        <div className="user-info">
          <span className="user-name">Hello, {user.username}! (Admin)</span>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <main className="main-content">
        <section className="tasks-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>System Settings</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-add">
              {showAddForm ? 'Cancel' : 'Add Setting'}
            </button>
          </div>

          {showAddForm && (
            <div className="task-input-section" style={{ marginBottom: '20px' }}>
              <h3>Add New Setting</h3>
              <form onSubmit={handleAddSetting} className="task-form">
                <div className="task-input-group">
                  <input
                    type="text"
                    placeholder="Setting key (e.g., feature_enabled)"
                    value={newSetting.key}
                    onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={newSetting.value}
                    onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '15px' }}
                />
                <button type="submit" className="btn-add">Add Setting</button>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading settings...</div>
          ) : settings.length === 0 ? (
            <div className="empty-state">
              <h3>No settings found</h3>
              <p>Add your first system setting above!</p>
            </div>
          ) : (
            <div className="tasks-list">
              {settings.map(setting => (
                <div key={setting.key} className="task-card">
                  {editingSetting === setting.key ? (
                    <div>
                      <div className="task-input-group" style={{ marginBottom: '10px' }}>
                        <input
                          type="text"
                          value={setting.value}
                          onChange={(e) => setSettings(settings.map(s => 
                            s.key === setting.key ? { ...s, value: e.target.value } : s
                          ))}
                          style={{ flex: 1 }}
                        />
                      </div>
                      <input
                        type="text"
                        value={setting.description || ''}
                        onChange={(e) => setSettings(settings.map(s => 
                          s.key === setting.key ? { ...s, description: e.target.value } : s
                        ))}
                        placeholder="Description"
                        style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => handleUpdateSetting(setting.key, setting.value, setting.description)}
                          className="btn-small btn-complete"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingSetting(null)}
                          className="btn-small btn-delete"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="task-header">
                        <h3 className="task-title">{setting.key}</h3>
                      </div>
                      <p className="task-description">
                        <strong>Value:</strong> {setting.value}
                      </p>
                      {setting.description && (
                        <p className="task-description">
                          <strong>Description:</strong> {setting.description}
                        </p>
                      )}
                      <p style={{ color: '#999', fontSize: '12px', marginBottom: '10px' }}>
                        Last updated: {new Date(setting.updated_at).toLocaleString()}
                      </p>
                      <div className="task-actions">
                        <button 
                          onClick={() => setEditingSetting(setting.key)}
                          className="btn-small btn-edit"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteSetting(setting.key)}
                          className="btn-small btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Settings

