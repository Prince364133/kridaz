import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  // BYPASS: Authentication is disabled for demo purposes
  return children;
}
