import api from './axios'

export const getNotifications = () =>
  api.get('/api/notifications').then(r => r.data)

export const markRead = (id) =>
  api.patch(`/api/notifications/${id}/read`).then(r => r.data)

export const markAllRead = () =>
  api.patch('/api/notifications/read-all').then(r => r.data)
