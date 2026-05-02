import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'

import HomePage    from './pages/public/HomePage'
import AboutPage   from './pages/public/AboutPage'
import ContactPage from './pages/public/ContactPage'

import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

import PatientDashboard   from './pages/patient/DashboardPage'
import BookAppointment    from './pages/patient/BookAppointment'
import AppointmentHistory from './pages/patient/AppointmentHistory'
import PatientProfile     from './pages/patient/ProfilePage'
import MedicalRecords     from './pages/patient/MedicalRecords'

import DoctorDashboard    from './pages/doctor/DashboardPage'
import DoctorSchedule     from './pages/doctor/SchedulePage'
import DoctorAvailability from './pages/doctor/AvailabilityPage'
import DoctorProfile      from './pages/doctor/ProfilePage'

import AdminDashboard    from './pages/admin/DashboardPage'
import AdminPatients     from './pages/admin/PatientsPage'
import AdminDoctors      from './pages/admin/DoctorsPage'
import AdminAppointments from './pages/admin/AppointmentsPage'
import AdminAnalytics    from './pages/admin/AnalyticsPage'


import AdminUsers from './pages/admin/UsersPage'


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public ── */}
          <Route path="/"         element={<HomePage />} />
          <Route path="/about"    element={<AboutPage />} />
          <Route path="/contact"  element={<ContactPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Protected (all roles) ── */}
          <Route element={<ProtectedRoute />}>

            {/* Patient */}
            <Route element={<RoleRoute role="patient" />}>
              <Route path="/patient/dashboard"    element={<PatientDashboard />} />
              <Route path="/patient/book"         element={<BookAppointment />} />
              <Route path="/patient/appointments" element={<AppointmentHistory />} />
              <Route path="/patient/profile"      element={<PatientProfile />} />
              <Route path="/patient/records"      element={<MedicalRecords />} />
            </Route>

            {/* Doctor */}
            <Route element={<RoleRoute role="doctor" />}>
              <Route path="/doctor/dashboard"    element={<DoctorDashboard />} />
              <Route path="/doctor/schedule"     element={<DoctorSchedule />} />
              <Route path="/doctor/availability" element={<DoctorAvailability />} />
              <Route path="/doctor/profile"      element={<DoctorProfile />} />
            </Route>

            {/* Admin */}
            <Route element={<RoleRoute role="admin" />}>
              <Route path="/admin/dashboard"    element={<AdminDashboard />} />
              <Route path="/admin/patients"     element={<AdminPatients />} />
              <Route path="/admin/doctors"      element={<AdminDoctors />} />
              <Route path="/admin/appointments" element={<AdminAppointments />} />
              <Route path="/admin/analytics"    element={<AdminAnalytics />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>

          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}