import { Navigate, Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import UserFooter from "../components/layout/UserFooter";
import { useSelector } from "react-redux";
import ErrorBoundary from "../components/common/ErrorBoundary";

export default function ProtectedLayout() {
  const { isLoggedIn } = useSelector((state) => state.auth);
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 sm:pt-24">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <UserFooter />
    </div>
  );
}
