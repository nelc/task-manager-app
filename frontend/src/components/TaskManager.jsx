import { useState, useEffect } from 'react'
import axios from 'axios'

function TaskManager({ user, onLogout, onNavigate }) {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTasks(response.data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      if (error.response?.status === 401) {
        onLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('/api/tasks', newTask, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTasks([response.data, ...tasks])
      setNewTask({ title: '', description: '', priority: 'medium' })
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(
        `/api/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setTasks(tasks.map(task => task.id === taskId ? response.data : task))
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTasks(tasks.filter(task => task.id !== taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })

  return (
    <div className="task-manager">
      <header className="header">
        <h1>📝 Task Manager</h1>
        <div className="user-info">
          <span className="user-name">Hello, {user.username}!</span>
          {user.isAdmin && (
            <button onClick={() => onNavigate('settings')} className="btn-settings">
              Settings
            </button>
          )}
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <main className="main-content">
        <section className="task-input-section">
          <h2>Add New Task</h2>
          <form className="task-form" onSubmit={handleAddTask}>
            <div className="task-input-group">
              <input
                type="text"
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <textarea
              placeholder="Task description (optional)..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
            <button type="submit" className="btn-add">Add Task</button>
          </form>
        </section>

        <section className="tasks-section">
          <h2>Your Tasks</h2>
          
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({tasks.length})
            </button>
            <button
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({tasks.filter(t => t.status === 'pending').length})
            </button>
            <button
              className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
              onClick={() => setFilter('in-progress')}
            >
              In Progress ({tasks.filter(t => t.status === 'in-progress').length})
            </button>
            <button
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({tasks.filter(t => t.status === 'completed').length})
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <h3>No tasks found</h3>
              <p>
                {filter === 'all' 
                  ? 'Start by adding your first task above!'
                  : `No ${filter} tasks. Try a different filter.`}
              </p>
            </div>
          ) : (
            <div className="tasks-list">
              {filteredTasks.map(task => (
                <div key={task.id} className={`task-card ${task.status}`}>
                  <div className="task-header">
                    <h3 className="task-title">{task.title}</h3>
                    <span className={`task-priority ${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  <div className="task-footer">
                    <span className={`task-status ${task.status}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                    <div className="task-actions">
                      {task.status !== 'completed' && (
                        <>
                          {task.status === 'pending' && (
                            <button
                              className="btn-small btn-edit"
                              onClick={() => handleUpdateStatus(task.id, 'in-progress')}
                            >
                              Start
                            </button>
                          )}
                          <button
                            className="btn-small btn-complete"
                            onClick={() => handleUpdateStatus(task.id, 'completed')}
                          >
                            Complete
                          </button>
                        </>
                      )}
                      {task.status === 'completed' && (
                        <button
                          className="btn-small btn-edit"
                          onClick={() => handleUpdateStatus(task.id, 'pending')}
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        className="btn-small btn-delete"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default TaskManager

