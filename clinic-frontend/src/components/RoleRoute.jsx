import { Navigate, Outlet } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function RoleRoute({ role }) {
  const { user } = useContext(AuthContext)
  return user?.role === role ? <Outlet /> : <Navigate to="/" replace />
}