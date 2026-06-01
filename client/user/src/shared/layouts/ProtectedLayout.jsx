import { Navigate, Outlet } from "react-router-dom";
import Navbar from "@components/layout/Navbar";
import UserFooter from "@components/layout/UserFooter";
import { useSelector } from "react-redux";
import RootErrorBoundary from "@components/common/RootErrorBoundary";

export default function ProtectedLayout() {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const isSidebarCollapsed = useSelector((state) => state.ui.isSidebarCollapsed);
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-grow pt-20 sm:pt-24 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        <RootErrorBoundary>
          <Outlet />
        </RootErrorBoundary>
      </main>
      <UserFooter />
    </div>
  );
}
