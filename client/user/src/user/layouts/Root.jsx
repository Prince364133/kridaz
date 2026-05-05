 
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Navbar from "../components/layout/Navbar";
import MobileBottomNav from "../components/layout/MobileBottomNav";
import UserFooter from "../components/layout/UserFooter";
import ScrollToTop from "../components/common/ScrollToTop";
import OnboardingModal from "../components/modals/OnboardingModal";

const Root = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Only show onboarding for regular users who haven't selected sports
    if (isAuthenticated && user?.role === "user" && (!user?.sportTypes || user?.sportTypes?.length === 0)) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, user]);

  return (
    <div className="flex flex-col min-h-screen">
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        onComplete={() => setShowOnboarding(false)}
      />
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
