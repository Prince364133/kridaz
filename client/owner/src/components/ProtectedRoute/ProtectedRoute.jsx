import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role, token } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role?.toLowerCase() !== requiredRole?.toLowerCase()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
