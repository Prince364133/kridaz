 
import { Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import Navbar from "../components/layout/Navbar";
import MobileBottomNav from "../components/layout/MobileBottomNav";
import UserFooter from "../components/layout/UserFooter";
import ScrollToTop from "../components/common/ScrollToTop";
import BackgroundUploadManager from "../components/BackgroundUploadManager";
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
    // Show onboarding for regular users who have an incomplete profile
    if (isAuthenticated && user?.role?.toLowerCase() === "user") {
      const isDismissed = localStorage.getItem("kridaz_onboarding_dismissed") === "true" || sessionStorage.getItem("kridaz_onboarding_dismissed") === "true";
      if (isDismissed) {
        setShowOnboarding(false);
        return;
      }
      const isIncomplete = !user.phone || !user.gender || (!user.location && !user.city) || !user.sportTypes || user.sportTypes.length === 0;
      if (isIncomplete) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user]);

  const searchParams = new URLSearchParams(location.search);
  const isPlayersPage = location.pathname === '/players' && searchParams.get('tab') !== 'teams';
  const isReelsPage = location.pathname.startsWith('/reels') || location.pathname.startsWith('/shorts');
  const hideNav = isReelsPage || isPlayersPage || location.pathname.startsWith('/messages') || location.pathname.startsWith('/my-teams');

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
        onClose={() => {
          setShowOnboarding(false);
          sessionStorage.setItem("kridaz_onboarding_dismissed", "true");
        }} 
        onComplete={() => {
          setShowOnboarding(false);
          localStorage.setItem("kridaz_onboarding_dismissed", "true");
        }}
      />
      <ScrollToTop />
      {!isReelsPage && <Navbar />}
      <main className={`flex-grow ${isReelsPage ? 'pb-0' : 'pb-20 lg:pb-0'}`}>
        <Outlet />
      </main>
      {!hideNav && <MobileBottomNav />}
      <BackgroundUploadManager />
      {/* Footer logic: hidden on Reels/Messages/Teams/Community/Players, otherwise desktop only (except home page) */}
      <div className={(hideNav || location.pathname === '/community') ? 'hidden' : (location.pathname === '/' ? 'block' : 'hidden lg:block')}>
        <UserFooter />
      </div>
    </div>
  );
};

export default Root;
