import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop
 * -----------
 * Automatically scrolls the window to the top whenever the
 * React Router pathname changes (i.e., the user navigates to
 * a new page). Must be rendered inside <RouterProvider> context.
 *
 * This permanently fixes the issue of pages opening mid-scroll
 * or appearing at the footer section.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant scroll — no smooth behaviour so there's zero flicker
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // Renders nothing — purely a side-effect component
  return null;
};

export default ScrollToTop;
