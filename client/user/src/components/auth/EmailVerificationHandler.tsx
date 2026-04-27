"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/hooks/useRouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"; // Import AlertCircle, CheckCircle, Loader2
import { useVerification } from "@/lib/hooks/useVerification";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ApiErrorResponse } from "@workspace/common/types/api.types"; // Import ApiErrorResponse for type consistency

export function EmailVerificationHandler() {
  const { query, push: pushRoute } = useRouter();
  const token = query.token;

  const { verifyEmail, isVerifyingEmail: isLoading, verifyEmailError: error } = useVerification();
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (token && !isLoading && !isSuccess && !error) { // Ensure not already processing/successful/errored
      verifyEmail(token).then(() => {
        setIsSuccess(true);
      }).catch(() => {
        setIsSuccess(false); // Error is handled by the `error` state from useVerification
      });
    }
  }, [token, verifyEmail, isLoading, isSuccess, error]);

  useEffect(() => {
    if (isSuccess && !redirecting) {
      setRedirecting(true);
      const timer = setTimeout(() => {
pushRoute('/login');
      }, 3000); // Redirect after 3 seconds
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [isSuccess, redirecting, router]);


  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Alert variant="default" className="w-full max-w-md">
          <Loader2 className="h-4 w-4 animate-spin" /> {/* Use Loader2 for loading */}
          <AlertTitle>Verifying Email</AlertTitle>
          <AlertDescription>
            Please wait while we verify your email address...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Consolidated error handling for UI display
  let displayError: string | null = null;
  if (error) {
    const apiError = error as ApiErrorResponse;
    displayError = apiError.message || "An unexpected error occurred during email verification.";
  } else if (!token) {
    displayError = "No verification token found in the URL. Please ensure you are using the correct link.";
  }

  if (displayError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" /> {/* Use AlertCircle for errors */}
          <AlertTitle>Email Verification Failed</AlertTitle>
          <AlertDescription>
            {displayError}
            <Button asChild className="mt-4 w-full">
              <Link to="/login">Go to Login</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Alert variant="default" className="bg-green-500 text-white w-full max-w-md"> {/* Success Alert */}
          <CheckCircle className="h-4 w-4" /> {/* Use CheckCircle for success */}
          <AlertTitle>Email Verified Successfully</AlertTitle>
          <AlertDescription>
            Your email address has been successfully verified. You will be redirected to the login page shortly.
            <Button asChild className="mt-4 w-full" disabled={redirecting}>
              <Link to="/login">Go to Login Now</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null; // Should not reach here if token is present and handled, or loading, or success, or error
}
