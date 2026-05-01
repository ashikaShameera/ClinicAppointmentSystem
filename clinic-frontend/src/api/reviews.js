import api from './axios'

export const getDoctorReviews = (doctorId) =>
  api.get(`/api/reviews/doctor/${doctorId}`).then(r => r.data)

export const createReview = (data) =>
  api.post('/api/reviews', data).then(r => r.data)
