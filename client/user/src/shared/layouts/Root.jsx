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

  const isSidebarCollapsed = useSelector((/** @type {any} */ state) => state.ui.isSidebarCollapsed);

  const searchParams = new URLSearchParams(location.search);
  const isReelsPage = location.pathname.startsWith('/reels') || location.pathname.startsWith('/shorts') || searchParams.get('tab') === 'shots';
  const isNewPostPage = location.pathname.startsWith('/new-post') || location.pathname.startsWith('/create-post') || location.pathname.startsWith('/create-story');
  const hideNav = isReelsPage || location.pathname.startsWith('/messages') || isNewPostPage;
  const isHome = location.pathname === "/" || location.pathname === "/community";
  const isVenue = location.pathname.startsWith("/venue") || location.pathname === "/venues";
  const isUploadReel = location.pathname.startsWith("/reels/upload") || location.pathname.startsWith("/shorts/upload");
  const useRestrictedWidth = isHome || isVenue || isUploadReel;

  const showRightSidebar = isHome || isVenue;

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-clip font-sans">
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

      {/* Collapsible Left Navigation (Previous Layout Navbar) */}
      {!isReelsPage && !isNewPostPage && <Navbar />}

      <div className="flex flex-1 relative w-full">
        {/* Main Content Area - Shifted by Left Sidebar and right padded by Right Sidebar on Desktop */}
        <main className={`flex-grow ${
          isReelsPage || isNewPostPage
            ? 'pb-0' 
            : location.pathname.startsWith('/messages') 
              ? `pb-0 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}` 
              : `pb-20 lg:pb-0 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`
        } ${showRightSidebar ? 'xl:pr-[440px]' : ''} transition-all duration-300 min-w-0 flex justify-center ${isNewPostPage ? 'py-0' : 'py-6'}`}>
          
          <div className={`w-full ${isNewPostPage ? 'max-w-none px-0' : useRestrictedWidth ? 'max-w-[495px]' : 'px-4 md:px-8 max-w-none'} flex flex-col justify-between`}>
            <div className="min-h-full">
              <Outlet />
            </div>

            {/* Desktop Footer */}
            {!hideNav && location.pathname !== '/community' && (
              <div className="mt-12 border-t border-white/5 pt-8">
                <UserFooter />
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        {showRightSidebar && (
          <DesktopRightSidebar 
            isRightDrawerOpen={isRightDrawerOpen} 
            setIsRightDrawerOpen={setIsRightDrawerOpen} 
          />
        )}
      </div>

      {!hideNav && <MobileBottomNav />}
    </div>
  );
};

export default Root;
