import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AccessDenied from './ui/AccessDenied';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if staff trying to access restricted routes
  const restrictedRoutes = ['/settings', '/reports'];
  if (user?.role === 'staff' && restrictedRoutes.includes(location.pathname)) {
    return <AccessDenied />;
  }

  return children;
}
