import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role, token } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const isAdminRole = (r) => r?.toLowerCase() === "admin" || r?.toLowerCase() === "bmsp_admin";
    const isMatchingRole = role?.toLowerCase() === requiredRole?.toLowerCase();
    
    // If route requires admin, both "admin" and "BMSP_ADMIN" are allowed
    if (requiredRole.toLowerCase() === "admin") {
      if (!isAdminRole(role)) return <Navigate to="/unauthorized" replace />;
    } else if (!isMatchingRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
