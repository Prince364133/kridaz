 
import { Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import Navbar from "../components/layout/Navbar";
import MobileBottomNav from "../components/layout/MobileBottomNav";
import UserFooter from "../components/layout/UserFooter";
import ScrollToTop from "../components/common/ScrollToTop";
import OnboardingModal from "../components/modals/OnboardingModal";
import LoginModal from "../components/modals/LoginModal";
import { closeLoginModal } from "@redux/slices/uiSlice";

const Root = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { loginModal } = useSelector((state) => state.ui);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Only show onboarding for regular users who haven't selected sports
    if (isAuthenticated && user?.role === "user" && (!user?.sportTypes || user?.sportTypes?.length === 0)) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, user]);

  const isReelsPage = location.pathname.startsWith('/reels') || location.pathname.startsWith('/shorts');
  const hideNav = isReelsPage || location.pathname.startsWith('/messages') || location.pathname.startsWith('/my-teams');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Global Login-on-Demand Modal — rendered here so useNavigate() works inside router context */}
      <LoginModal
        isOpen={loginModal.isOpen}
        onClose={() => dispatch(closeLoginModal())}
        title={loginModal.title}
        message={loginModal.message}
      />
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        onComplete={() => setShowOnboarding(false)}
      />
      <ScrollToTop />
      {!isReelsPage && <Navbar />}
      <main className={`flex-grow ${isReelsPage ? 'pb-0' : 'pb-20 lg:pb-0'}`}>
        <Outlet />
      </main>
      {!hideNav && <MobileBottomNav />}
      {/* Footer only visible on desktop OR if it's the home page on mobile (and hidden entirely on messages/teams/reels) */}
      <div className={hideNav ? 'hidden' : (location.pathname === '/' ? 'block' : 'hidden lg:block')}>
        <UserFooter />
      </div>
    </div>
  );
};

export default Root;
