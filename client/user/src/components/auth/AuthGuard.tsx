"use client";

import React, { useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Custom redirect URL. Defaults to /login */
  redirectTo?: string;
  /** Show loading spinner while checking auth */
  showLoading?: boolean;
  /** Custom message to show when redirecting */
  redirectMessage?: string;
}

/**
 * AuthGuard component that protects routes requiring authentication.
 * Wraps children and redirects to login if user is not authenticated.
 * 
 * @example
 * <AuthGuard>
 *   <ProtectedContent />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  redirectTo = "/login",
  showLoading = true,
  redirectMessage = "Please log in to access this page",
}: AuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthStatus();

  useEffect(() => {
    // Wait for auth status to be determined
    if (isLoading) return;

    if (!isAuthenticated) {
      toast.info(redirectMessage);
      // Redirect to login with return URL
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(location.pathname)}`;
      navigate(redirectUrl);
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname, redirectTo, redirectMessage]);

  // Show loading state while checking auth
  if (isLoading) {
    if (!showLoading) return null;
    
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (redirect in progress)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

/**
 * GuestGuard component that protects routes for unauthenticated users only.
 * Redirects authenticated users away from login/register pages.
 * Respects the ?redirect= query parameter to return users to their intended destination.
 * 
 * @example
 * <GuestGuard>
 *   <LoginPage />
 * </GuestGuard>
 */
export function GuestGuard({
  children,
  fallbackRedirectTo = "/dashboard",
}: {
  children: React.ReactNode;
  /** Fallback redirect if no redirect param is present */
  fallbackRedirectTo?: string;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuthStatus();

  // Get redirect URL from query params (preserves user's intended destination)
  const redirectParam = searchParams.get('redirect');
  const redirectTo = redirectParam || fallbackRedirectTo;

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if authenticated (redirect in progress)
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
