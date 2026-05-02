import api from './axios'

export const listUsers = (role = '') =>
  api.get('/api/admin/users', { params: role ? { role } : {} }).then(r => r.data)

export const createUser = (data) =>
  api.post('/api/admin/create-user', data).then(r => r.data)

export const toggleUser = (id) =>
  api.patch(`/api/admin/users/${id}/toggle`).then(r => r.data)