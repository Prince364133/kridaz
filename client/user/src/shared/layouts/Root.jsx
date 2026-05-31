 
import { Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import Navbar from "@components/layout/Navbar";
import MobileBottomNav from "@components/layout/MobileBottomNav";
import UserFooter from "@components/layout/UserFooter";
import ScrollToTop from "@components/common/ScrollToTop";
import BackgroundUploadManager from "@components/BackgroundUploadManager";
import OnboardingModal from "@components/modals/OnboardingModal";
import LoginModal from "@components/modals/LoginModal";
import { closeLoginModal } from "@redux/slices/uiSlice";
import AuthModal from "../../features/auth/components/AuthModal";

const Root = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((/** @type {any} */ state) => state.auth);
  const { loginModal } = useSelector((/** @type {any} */ state) => state.ui);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding for regular users who have not completed onboarding
    if (isAuthenticated && user?.role?.toLowerCase() === "user") {
      if (user.isOnboarded === false || !user.isOnboarded) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    } else {
      setShowOnboarding(false);
    }
  }, [isAuthenticated, user]);

  const searchParams = new URLSearchParams(location.search);
  const isReelsPage = location.pathname.startsWith('/reels') || location.pathname.startsWith('/shorts') || searchParams.get('tab') === 'shots';
  const hideNav = isReelsPage || location.pathname.startsWith('/messages');

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Global Login-on-Demand Modal — rendered here so useNavigate() works inside router context */}
      <LoginModal
        isOpen={loginModal.isOpen}
        onClose={() => dispatch(closeLoginModal())}
        title={loginModal.title}
        message={loginModal.message}
      />
      <AuthModal />
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => {
          setShowOnboarding(false);
        }} 
        onComplete={() => {
          setShowOnboarding(false);
        }}
        initialData={{ authMethod: 'google', user: user || {} }}
      />
      <ScrollToTop />
      {!isReelsPage && <Navbar />}
      <main className={`flex-grow ${isReelsPage ? 'pb-0' : location.pathname.startsWith('/messages') ? 'pb-0 lg:ml-64' : 'pb-20 lg:pb-0 lg:ml-64'}`}>
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
