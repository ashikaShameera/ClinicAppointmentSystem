import { useState, useEffect } from 'react'
import { listUsers, createUser, toggleUser } from '../../api/admin'
import Modal from '../../components/Modal'
import { BtnSpinner, PageLoader } from '../../components/Spinner'
import { EmptyState } from '../../components/ErrorMessage'
import Navbar from '../../components/Navbar'

const ROLES = ['', 'patient', 'doctor', 'admin']

export default function UsersPage() {
  const [users, setUsers]       = useState([])
  const [roleFilter, setRole]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [toggling, setToggling] = useState(null)

  const [createModal, setCreateModal] = useState(false)
  const [form, setForm]       = useState({ email: '', password: '', role: 'doctor' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => { load() }, [roleFilter])

  const load = () => {
    setLoading(true)
    listUsers(roleFilter)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  const handleToggle = async (id) => {
    setToggling(id)
    try {
      const updated = await toggleUser(id)
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, is_active: updated.is_active } : u))
    } catch { alert('Failed to update user.') }
    finally { setToggling(null) }
  }

  const handleCreate = async () => {
    if (!form.email || !form.password) { setCreateError('All fields required'); return }
    setCreating(true); setCreateError('')
    try {
      await createUser(form)
      setCreateModal(false)
      setForm({ email: '', password: '', role: 'doctor' })
      load()
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Failed to create user')
    } finally { setCreating(false) }
  }

  const roleColor = { patient: '#0C447C', doctor: '#085041', admin: '#3C3489' }
  const roleBg    = { patient: '#E6F1FB', doctor: '#E1F5EE', admin: '#EEEDFE' }

  return (
    <div style={{ background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');*{box-sizing:border-box;margin:0;padding:0}.row:hover{background:#fafaf8!important}`}</style>
      <Navbar />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: '28px', color: '#1a1a2e', fontWeight: 400 }}>User accounts</h1>
            <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>{users.length} user{users.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { setCreateModal(true); setCreateError('') }}
            style={{ background: '#1a3a5c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Create user
          </button>
        </div>

        {/* Role filter tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ROLES.map(r => (
            <button key={r} onClick={() => setRole(r)}
              style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: roleFilter === r ? '#1a3a5c' : '#fff', color: roleFilter === r ? '#fff' : '#555', border: roleFilter === r ? 'none' : '0.5px solid #e0ddd6', transition: 'all .15s' }}>
              {r === '' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {loading ? <PageLoader /> : users.length === 0 ? (
          <EmptyState icon="👤" message="No users found" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e8e6df', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 20px', background: '#f5f3ee' }}>
              {['Email', 'Role', 'Status', 'Actions'].map(h => (
                <p key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</p>
              ))}
            </div>
            {users.map(u => (
              <div key={u.id} className="row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 20px', alignItems: 'center', background: '#fff', transition: 'background .15s' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{u.email}</p>
                  <p style={{ fontSize: '11px', color: '#ccc', fontFamily: 'monospace', marginTop: '2px' }}>{u.id?.slice(0, 18)}...</p>
                </div>
                <span style={{ background: roleBg[u.role] || '#f0ede6', color: roleColor[u.role] || '#555', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, width: 'fit-content', textTransform: 'capitalize' }}>
                  {u.role}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: u.is_active ? '#085041' : '#791F1F', background: u.is_active ? '#E1F5EE' : '#FCEBEB', padding: '3px 10px', borderRadius: '20px', width: 'fit-content' }}>
                  {u.is_active ? 'Active' : 'Disabled'}
                </span>
                <button onClick={() => handleToggle(u.id)} disabled={toggling === u.id}
                  style={{ background: u.is_active ? '#FCEBEB' : '#E1F5EE', color: u.is_active ? '#791F1F' : '#085041', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', width: 'fit-content', opacity: toggling === u.id ? 0.7 : 1 }}>
                  {toggling === u.id ? '...' : u.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create user account" width={440}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {createError && <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '10px 14px', borderRadius: '7px', fontSize: '13px' }}>{createError}</div>}
          {[
            { label: 'Email address', field: 'email', type: 'email' },
            { label: 'Password', field: 'password', type: 'password' },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#444', display: 'block', marginBottom: '6px' }}>{label}</label>
              <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                style={{ width: '100%', border: '0.5px solid #d0cec7', borderRadius: '7px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#444', display: 'block', marginBottom: '6px' }}>Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{ width: '100%', border: '0.5px solid #d0cec7', borderRadius: '7px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <p style={{ fontSize: '12px', color: '#aaa' }}>
            After creating a doctor account, go to <strong>Manage Doctors</strong> to add their profile details.
          </p>
        </div>
        <Modal.Footer>
          <button onClick={() => setCreateModal(false)} style={{ background: 'transparent', border: '0.5px solid #d0cec7', color: '#666', padding: '9px 18px', borderRadius: '7px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleCreate} disabled={creating} style={{ background: '#1a3a5c', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '7px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', opacity: creating ? 0.75 : 1 }}>
            {creating && <BtnSpinner />} Create user
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}