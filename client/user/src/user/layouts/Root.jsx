 
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import MobileBottomNav from "../components/layout/MobileBottomNav";
import UserFooter from "../components/layout/UserFooter";
import ScrollToTop from "../components/common/ScrollToTop";

const Root = () => {
  const location = useLocation();
  const isHomePage = ["/", "/login", "/signup"].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Scroll to top on every route change — fixes pages opening mid-scroll */}
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow pb-20 lg:pb-0">
        <Outlet />
      </main>
      <MobileBottomNav />
      <UserFooter />
    </div>
  );
};

export default Root;
