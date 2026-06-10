import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "@components/layout/Navbar";
import MobileBottomNav from "@components/layout/MobileBottomNav";
import UserFooter from "@components/layout/UserFooter";
import ScrollToTop from "@components/common/ScrollToTop";
import BackgroundUploadManager from "@components/BackgroundUploadManager";
import { closeLoginModal } from "@redux/slices/uiSlice";
// Desktop Right Sidebar removed — content moved to Home feed
import { useAuthModal } from "../../context/AuthModalContext";

const OnboardingModal = lazy(() => import("@components/modals/OnboardingModal"));
const LoginModal = lazy(() => import("@components/modals/LoginModal"));
const AuthModal = lazy(() => import("../../features/auth/components/AuthModal"));
const LandingPage = lazy(() => import("../../pages/LandingPage"));

const Root = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isOpen: isAuthModalOpen } = useAuthModal();
  const { user, isAuthenticated } = useSelector((/** @type {any} */ state) => state.auth);
  const { loginModal } = useSelector((/** @type {any} */ state) => state.ui);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const iframeRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      // constrain between 320px and 50% of window width
      const newWidth = Math.max(320, Math.min(e.clientX, window.innerWidth / 2));
      setLeftWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      if (iframeRef.current) iframeRef.current.style.pointerEvents = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      if (iframeRef.current) iframeRef.current.style.pointerEvents = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      if (iframeRef.current) iframeRef.current.style.pointerEvents = "";
    };
  }, [isResizing]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const listener = (e) => setIsDesktop(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

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

  useEffect(() => {
    const handleParentPopState = () => {
      if (iframeRef.current) {
        try {
          const iframeWindow = iframeRef.current.contentWindow;
          if (iframeWindow.location.pathname !== window.location.pathname || iframeWindow.location.search !== window.location.search) {
            iframeRef.current.src = window.location.pathname + window.location.search;
          }
        } catch (err) {
          iframeRef.current.src = window.location.pathname + window.location.search;
        }
      }
    };
    window.addEventListener("popstate", handleParentPopState);
    return () => window.removeEventListener("popstate", handleParentPopState);
  }, []);

  useEffect(() => {
    if (window.self !== window.top) {
      document.documentElement.classList.add('no-scrollbar');
      document.body.classList.add('no-scrollbar');
    }
  }, []);

  const handleIframeLoad = (e) => {
    try {
      const iframeWindow = e.target.contentWindow;
      const iframePath = iframeWindow.location.pathname;
      const iframeSearch = iframeWindow.location.search;
      if (window.location.pathname !== iframePath || window.location.search !== iframeSearch) {
        window.history.replaceState(null, "", iframePath + iframeSearch);
      }
      
      const handleIframeNav = () => {
        const currentPath = iframeWindow.location.pathname;
        const currentSearch = iframeWindow.location.search;
        if (window.location.pathname !== currentPath || window.location.search !== currentSearch) {
          window.history.replaceState(null, "", currentPath + currentSearch);
        }
      };
      
      iframeWindow.addEventListener("popstate", handleIframeNav);
      
      const originalPush = iframeWindow.history.pushState;
      iframeWindow.history.pushState = function(...args) {
        originalPush.apply(iframeWindow.history, args);
        handleIframeNav();
      };
      
      const originalReplace = iframeWindow.history.replaceState;
      iframeWindow.history.replaceState = function(...args) {
        originalReplace.apply(iframeWindow.history, args);
        handleIframeNav();
      };
    } catch (err) {
      console.warn("Iframe same-origin check failed:", err);
    }
  };

  const isSidebarCollapsed = useSelector((/** @type {any} */ state) => state.ui.isSidebarCollapsed);

  const searchParams = new URLSearchParams(location.search);
  const isReelsPage = location.pathname.startsWith('/reels') || location.pathname.startsWith('/shorts') || searchParams.get('tab') === 'shots';
  const isNewPostPage = location.pathname.startsWith('/new-post') || location.pathname.startsWith('/create-post') || location.pathname.startsWith('/create-story');
  const isTeamsPage = location.pathname.startsWith('/my-teams');
  const isMessagesPage = location.pathname.startsWith('/messages');
  const isChatOpen = isMessagesPage && searchParams.get('chatId') !== null;
  const isProfile = location.pathname.startsWith('/profile');
  const isBookingHistory = location.pathname.startsWith('/booking-history');
  const hideNav = isReelsPage || isNewPostPage || isChatOpen;
  const isHome = location.pathname === "/" || location.pathname === "/community";
  const isSingleVenue = location.pathname.startsWith("/venue/");
  const isVenue = (location.pathname.startsWith("/venue") || location.pathname === "/venues") && !isSingleVenue;
  const isPlayer = location.pathname.startsWith("/players");
  const isProfessional = location.pathname.startsWith("/professionals");
  const isJoinGames = location.pathname.startsWith("/join-games");
  const isUploadReel = location.pathname.startsWith("/reels/upload") || location.pathname.startsWith("/shorts/upload");
  const useRestrictedWidth = isHome || isVenue || isUploadReel || isTeamsPage || isPlayer || isProfessional || isJoinGames;

  const isLandingPage = location.pathname === "/landing" || 
                        location.pathname.startsWith("/business/venue") || 
                        location.pathname.startsWith("/business/professional") ||
                        location.pathname.startsWith("/business/registration") ||
                        location.pathname.startsWith("/business/register");
  const isInsideIframe = window.self !== window.top;
  const showSplitView = isDesktop && !isLandingPage && !isInsideIframe;

  if (showSplitView) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-[#050505] text-white">
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
              onClose={() => setShowOnboarding(false)} 
              onComplete={() => setShowOnboarding(false)}
              initialData={{ authMethod: 'google', user: user || {} }}
            />
          </Suspense>
        )}
        <ScrollToTop />
        <BackgroundUploadManager />

        {/* Left Side: Mobile View Container */}
        <div style={{ width: leftWidth, minWidth: leftWidth }} className="h-full border-r border-white/5 bg-[#050505] relative z-20 flex-shrink-0">
          {/* Iframe rendering the mobile app */}
          <iframe
            ref={iframeRef}
            src={location.pathname + location.search}
            className="w-full h-full border-none bg-[#050505]"
            onLoad={handleIframeLoad}
          />
        </div>

        {/* Resizer Handle */}
        <div 
          className="w-2 cursor-col-resize hover:bg-[#BFF367]/20 active:bg-[#BFF367]/40 h-full z-30 flex flex-col items-center justify-center -ml-1 transition-colors group relative"
          onMouseDown={() => setIsResizing(true)}
        >
          <div className="w-[2px] h-8 bg-white/20 group-hover:bg-[#BFF367] rounded-full transition-colors" />
        </div>

        {/* Right Side: Landing Page (Full height, scrollable) */}
        <div className="flex-1 h-full overflow-y-auto bg-[#050505] relative z-10 min-w-0">
          <Suspense fallback={
            <div className="w-full h-full flex justify-center items-center bg-[#050505]">
              <div className="w-8 h-8 border-4 border-[#BFF367] border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <LandingPage />
          </Suspense>
        </div>
      </div>
    );
  }

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

      <div className="flex flex-1 justify-center w-full relative">
        <div className={`flex w-full ${useRestrictedWidth ? 'max-w-[700px]' : 'max-w-none'} justify-between relative`}>
          {/* Main Content Area - Centered alongside the right sidebar on desktop */}
          <main className={`flex-grow ${
            isReelsPage || isNewPostPage
              ? 'pb-0' 
              : isTeamsPage || isMessagesPage
                ? 'pb-0' 
                : 'pb-20 lg:pb-28'
          } transition-all duration-300 min-w-0 flex justify-center ${isNewPostPage || isTeamsPage || isMessagesPage || isProfile || isBookingHistory ? 'py-0' : 'py-6'}`}>
            
            <div className={`w-full ${isNewPostPage || isTeamsPage || isMessagesPage || isProfile || isBookingHistory ? 'max-w-none px-0' : 'px-0 max-w-none'} flex flex-col justify-between`}>
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


        </div>
      </div>

      {!hideNav && <MobileBottomNav />}
    </div>
  );
};

export default Root;
