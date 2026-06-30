import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './PageLoader';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { username, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!username) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
