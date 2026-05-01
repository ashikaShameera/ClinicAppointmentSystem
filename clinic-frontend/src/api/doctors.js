import api from './axios'

export const listDoctors = (params = {}) =>
  api.get('/api/doctors', { params }).then(r => r.data)

export const getDoctor = (id) =>
  api.get(`/api/doctors/${id}`).then(r => r.data)

export const createDoctor = (data) =>
  api.post('/api/doctors', data).then(r => r.data)

export const updateDoctor = (id, data) =>
  api.put(`/api/doctors/${id}`, data).then(r => r.data)

export const deleteDoctor = (id) =>
  api.delete(`/api/doctors/${id}`).then(r => r.data)

export const getSlots = (doctorId) =>
  api.get(`/api/doctors/${doctorId}/slots`).then(r => r.data)

export const addSlot = (doctorId, data) =>
  api.post(`/api/doctors/${doctorId}/slots`, data).then(r => r.data)

export const deleteSlot = (doctorId, slotId) =>
  api.delete(`/api/doctors/${doctorId}/slots/${slotId}`).then(r => r.data)

export const getSpecialties = () =>
  api.get('/api/doctors/specialties/all').then(r => r.data)
