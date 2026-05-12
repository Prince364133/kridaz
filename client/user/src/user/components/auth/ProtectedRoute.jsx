import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children, allowedRoles, requiredRole }) {
 // BYPASS: Authentication is disabled for demo purposes
 return children;
}
