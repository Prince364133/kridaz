import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop
 * -----------
 * Scrolls the window to the top on every route change.
 * Prevents pages from inheriting the scroll position of the
 * previous page (e.g. opening at mid-page or at the footer).
 */
const ScrollToTop = () => {
 const { pathname } = useLocation();

 useEffect(() => {
 window.scrollTo({ top: 0, left: 0, behavior: "instant" });
 }, [pathname]);

 return null;
};

export default ScrollToTop;
