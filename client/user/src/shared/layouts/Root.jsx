import { lazy, Suspense, useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "@components/layout/Navbar";
import MobileBottomNav from "@components/layout/MobileBottomNav";
import UserFooter from "@components/layout/UserFooter";
import ScrollToTop from "@components/common/ScrollToTop";
import BackgroundUploadManager from "@components/BackgroundUploadManager";
import { closeLoginModal } from "@redux/slices/uiSlice";
import DesktopRightSidebar from "@components/layout/DesktopRightSidebar";
import { useAuthModal } from "../../context/AuthModalContext";

const OnboardingModal = lazy(() => import("@components/modals/OnboardingModal"));
const LoginModal = lazy(() => import("@components/modals/LoginModal"));
const AuthModal = lazy(() => import("../../features/auth/components/AuthModal"));

const Root = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isOpen: isAuthModalOpen } = useAuthModal();
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
  const isTeamsPage = location.pathname.startsWith('/my-teams');
  const isMessagesPage = location.pathname.startsWith('/messages');
  const isProfile = location.pathname.startsWith('/profile');
  const isBookingHistory = location.pathname.startsWith('/booking-history');
  const hideNav = isReelsPage || isNewPostPage || isMessagesPage;
  const isHome = location.pathname === "/" || location.pathname === "/community";
  const isSingleVenue = location.pathname.startsWith("/venue/");
  const isVenue = (location.pathname.startsWith("/venue") || location.pathname === "/venues") && !isSingleVenue;
  const isPlayer = location.pathname.startsWith("/players");
  const isProfessional = location.pathname.startsWith("/professionals");
  const isJoinGames = location.pathname.startsWith("/join-games");
  const isUploadReel = location.pathname.startsWith("/reels/upload") || location.pathname.startsWith("/shorts/upload");
  const useRestrictedWidth = isHome || isVenue || isUploadReel || isTeamsPage || isPlayer || isProfessional || isJoinGames;

  const showRightSidebar = isHome || isVenue;

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-clip font-sans">
      {/* Global Login-on-Demand Modal — rendered here so useNavigate() works inside router context */}
      {loginModal.isOpen && (
        <Suspense fallback={null}>
          <LoginModal
            isOpen={loginModal.isOpen}
            onClose={() => dispatch(closeLoginModal())}
            title={loginModal.title}
            message={loginModal.message}
          />
        </Suspense>
      )}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
      )}
      {showOnboarding && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}
      <ScrollToTop />
      <BackgroundUploadManager />

      {/* Collapsible Left Navigation (Previous Layout Navbar) */}
      {!isReelsPage && !isNewPostPage && <Navbar />}

      <div className="flex flex-1 justify-center w-full relative lg:pl-28 xl:pl-40">
        <div className={`flex w-full ${useRestrictedWidth ? 'max-w-[860px]' : 'max-w-none'} justify-between relative`}>
          {/* Main Content Area - Centered alongside the right sidebar on desktop */}
          <main className={`flex-grow ${
            isReelsPage || isNewPostPage
              ? 'pb-0' 
              : isTeamsPage || isMessagesPage
                ? 'pb-0' 
                : 'pb-20 lg:pb-28'
          } transition-all duration-300 min-w-0 flex justify-center ${isNewPostPage || isTeamsPage || isMessagesPage || isProfile || isBookingHistory ? 'py-0' : 'py-6'}`}>
            
            <div className={`w-full ${isNewPostPage || isTeamsPage || isMessagesPage || isProfile || isBookingHistory ? 'max-w-none px-0' : (useRestrictedWidth && showRightSidebar) ? 'max-w-[495px]' : 'px-4 md:px-8 max-w-none'} flex flex-col justify-between`}>
              <div className="min-h-full">
                <Outlet />
              </div>

              {/* Desktop Footer */}
              {!hideNav && location.pathname !== '/community' && !isTeamsPage && (
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
      </div>

      {!hideNav && <MobileBottomNav />}
    </div>
  );
};

export default Root;
