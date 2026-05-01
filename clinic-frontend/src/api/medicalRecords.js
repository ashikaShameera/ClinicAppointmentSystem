import api from './axios'

export const getPatientRecords = (patientId) =>
  api.get(`/api/medical-records/patient/${patientId}`).then(r => r.data)

export const getRecord = (id) =>
  api.get(`/api/medical-records/${id}`).then(r => r.data)

export const createRecord = (data) =>
  api.post('/api/medical-records', data).then(r => r.data)

export const updateRecord = (id, data) =>
  api.put(`/api/medical-records/${id}`, data).then(r => r.data)
