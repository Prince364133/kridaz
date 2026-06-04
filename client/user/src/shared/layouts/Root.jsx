 
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
import DesktopTopNavbar from "@components/layout/DesktopTopNavbar";
import DesktopLeftSidebar from "@components/layout/DesktopLeftSidebar";
import DesktopRightSidebar from "@components/layout/DesktopRightSidebar";

const Root = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((/** @type {any} */ state) => state.auth);
  const { loginModal } = useSelector((/** @type {any} */ state) => state.ui);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

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
  const isCheckoutPage = location.pathname.startsWith('/checkout');
  const showRightSidebar = !isReelsPage && !location.pathname.startsWith('/messages') && !isCheckoutPage;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans">
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
      <BackgroundUploadManager />

      {/* MOBILE LAYOUT (<768px): PRESERVED EXACTLY AS IS */}
      <div className="md:hidden flex flex-col min-h-screen">
        {!isReelsPage && <Navbar />}
        <main className={`flex-grow ${isReelsPage ? 'pb-0' : location.pathname.startsWith('/messages') ? 'pb-0' : 'pb-20'}`}>
          <Outlet />
        </main>
        {!hideNav && <MobileBottomNav />}
        {/* Footer logic: hidden on Reels/Messages/Teams/Community/Players, otherwise desktop only (except home page) */}
        <div className={(hideNav || location.pathname === '/community') ? 'hidden' : (location.pathname === '/' ? 'block' : 'hidden')}>
          <UserFooter />
        </div>
      </div>

      {/* DESKTOP/TABLET LAYOUT (>=768px): REDESIGNED GRID AND WRAPPERS */}
      <div className="hidden md:flex flex-col min-h-screen bg-[#050505]">
        {/* Sticky/Fixed Top Navbar */}
        {!isReelsPage && (
          <DesktopTopNavbar 
            isRightDrawerOpen={isRightDrawerOpen} 
            setIsRightDrawerOpen={setIsRightDrawerOpen} 
          />
        )}

        <div className={`flex flex-1 ${!isReelsPage ? 'pt-[77px]' : ''} relative`}>
          {/* Fixed Left Sidebar */}
          {!isReelsPage && <DesktopLeftSidebar />}

          {/* Main layout container (Offset by Left Sidebar & Right Sidebar on Desktop) */}
          <div className={`flex flex-1 ${!isReelsPage ? 'pl-[290px]' : ''} ${showRightSidebar ? 'xl:pr-[440px]' : ''} min-w-0 relative`}>
            
            {/* Subtle messy gradient background for the middle panel */}
            {!isReelsPage && (
              <div className="absolute inset-0 z-[-1] pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(191,243,103,0.1),transparent_40%),radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.05),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(191,243,103,0.08),transparent_40%)]" />
            )}

            {/* Center Content Column */}
            <div className="flex-1 min-w-0 flex justify-center py-6">
              <div className={`w-full ${isCheckoutPage ? 'max-w-full' : 'max-w-[495px]'} flex flex-col justify-between`}>
                <main className="min-h-full">
                  <Outlet />
                </main>

                {/* Desktop Footer: displayed at the bottom of main content scroll container */}
                {!hideNav && location.pathname !== '/community' && (
                  <div className="mt-12 border-t border-white/5 pt-8">
                    <UserFooter />
                  </div>
                )}
              </div>
            </div>

            {/* Modular, Page-Aware Right Sidebar Drawer */}
            {showRightSidebar && (
              <DesktopRightSidebar 
                isRightDrawerOpen={isRightDrawerOpen} 
                setIsRightDrawerOpen={setIsRightDrawerOpen} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Root;
