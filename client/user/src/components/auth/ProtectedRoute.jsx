import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children }) {
  const { isLoggedIn } = useSelector((state) => state.auth);
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
