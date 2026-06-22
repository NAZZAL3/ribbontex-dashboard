import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { username, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brown-border border-t-brown" />
      </div>
    );
  }

  if (!username) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
