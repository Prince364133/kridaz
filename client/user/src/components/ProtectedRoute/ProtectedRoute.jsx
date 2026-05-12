import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role, token } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const isAdminRole = (r) => r?.toLowerCase().includes("admin");
    const isOwnerRole = (r) => r?.toLowerCase().includes("owner") || r?.toLowerCase().includes("venue");
    
    let isMatchingRole = false;
    if (requiredRole.toLowerCase() === "admin") {
      isMatchingRole = isAdminRole(role);
    } else if (requiredRole.toLowerCase() === "owner") {
      isMatchingRole = isOwnerRole(role);
    } else if (requiredRole.toLowerCase() === "umpire") {
      isMatchingRole = role?.toLowerCase() === "umpire" || role?.toLowerCase() === "limited_umpire";
    } else {
      isMatchingRole = role?.toLowerCase() === requiredRole?.toLowerCase();
    }
    
    if (!isMatchingRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
