import api from './axios'

export const getSummary = () =>
  api.get('/api/analytics/summary').then(r => r.data)

export const getByDoctor = () =>
  api.get('/api/analytics/by-doctor').then(r => r.data)

export const getBySpecialty = () =>
  api.get('/api/analytics/by-specialty').then(r => r.data)

export const getPeakHours = () =>
  api.get('/api/analytics/peak-hours').then(r => r.data)

export const getDoctorDashboard = () =>
  api.get('/api/analytics/doctor-dashboard').then(r => r.data)
