import api from './axios'

export const getPatient = (id) =>
  api.get(`/api/patients/${id}`).then(r => r.data)

export const getPatients = (params = {}) =>
  api.get('/api/patients', { params }).then(r => r.data)

export const createPatient = (data) =>
  api.post('/api/patients', data).then(r => r.data)

export const updatePatient = (id, data) =>
  api.put(`/api/patients/${id}`, data).then(r => r.data)

export const deletePatient = (id) =>
  api.delete(`/api/patients/${id}`).then(r => r.data)

export const getPatientAppointments = (id, params = {}) =>
  api.get(`/api/patients/${id}/appointments`, { params }).then(r => r.data)

export const getMyProfile = () =>
  api.get('/api/patients/me').then(r => r.data)
