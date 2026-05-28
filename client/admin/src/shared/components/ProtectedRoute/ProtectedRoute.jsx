import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, role, token } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Explicit guard: Only allow ADMIN role in this app
  if (role?.toLowerCase() !== "admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
