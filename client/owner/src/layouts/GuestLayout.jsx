import { Outlet, useLocation } from "react-router-dom";
import PublicNavbar from "../components/layout/GuestNavbar";
import PartnerFooter from "../components/layout/PartnerFooter";

const PublicLayout = () => {
  const location = useLocation();
  const landingPages = ["/", "/venue-owner", "/coach-landing", "/umpire-landing", "/login", "/signup"];
  const isLandingPage = landingPages.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <PublicNavbar />
      <main className={`flex-grow ${isLandingPage ? "" : "pt-16 lg:pt-20"}`}>
        <Outlet />
      </main>
      <PartnerFooter />
    </div>
  );
};

export default PublicLayout;
