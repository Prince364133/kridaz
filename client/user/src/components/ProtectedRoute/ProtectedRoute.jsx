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
    
    const checkRole = (req) => {
      if (req.toLowerCase() === "admin") return isAdminRole(role);
      if (req.toLowerCase() === "owner") return isOwnerRole(role);
      if (req.toLowerCase() === "umpire") return role?.toLowerCase() === "umpire" || role?.toLowerCase() === "limited_umpire";
      if (req.toLowerCase() === "scorer") return role?.toLowerCase() === "scorer" || role?.toLowerCase() === "limited_scorer";
      return role?.toLowerCase() === req?.toLowerCase();
    };

    let isMatchingRole = false;
    if (Array.isArray(requiredRole)) {
      isMatchingRole = requiredRole.some(r => checkRole(r));
    } else {
      isMatchingRole = checkRole(requiredRole);
    }
    
    if (!isMatchingRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
