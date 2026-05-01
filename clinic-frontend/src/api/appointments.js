import api from './axios'

export const getAppointments = (params = {}) =>
  api.get('/api/appointments', { params }).then(r => r.data)

export const getAppointment = (id) =>
  api.get(`/api/appointments/${id}`).then(r => r.data)

export const bookAppointment = (data) =>
  api.post('/api/appointments', data).then(r => r.data)

export const updateAppointment = (id, data) =>
  api.put(`/api/appointments/${id}`, data).then(r => r.data)

export const updateStatus = (id, status, cancellation_reason = '') =>
  api.patch(`/api/appointments/${id}/status`, {
    status,
    ...(cancellation_reason && { cancellation_reason }),
  }).then(r => r.data)

export const getUpcoming = () =>
  api.get('/api/appointments/upcoming').then(r => r.data)

export const getToday = () =>
  api.get('/api/appointments/today').then(r => r.data)

export const getPatientHistory = (patientId, params = {}) =>
  api.get(`/api/appointments/patient/${patientId}`, { params }).then(r => r.data)
