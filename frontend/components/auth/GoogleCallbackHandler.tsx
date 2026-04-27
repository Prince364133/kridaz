"use client";
import { ROUTES } from '@/lib/routes';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Terminal } from "lucide-react";
import { useSocialAuth } from "@/lib/hooks/useSocialAuth"; // Import the specific hook
import { useRouter } from "next/navigation";

export function GoogleCallbackHandler() {
  const searchParams = useSearchParams();
  const code = searchParams ? searchParams.get("code") : null;
  const router = useRouter();

  const { googleLogin, isGoogleLoginLoading: isLoading, googleLoginError: error } = useSocialAuth(); // Use the specific hook and destructure accordingly
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (code) {
      googleLogin(code)
        .then(() => setIsSuccess(true))
        .catch(() => setIsError(true));
    }
  }, [code, googleLogin]);

  if (isLoading) {
    return (
      <Alert variant="default">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Processing Google Login</AlertTitle>
        <AlertDescription>
          Please wait while we finalize your login...
        </AlertDescription>
      </Alert>
    );
  }

  if (isError) {
    let errorMessage = "An unexpected error occurred during Google login.";
    if (typeof error === 'object' && error !== null) {
      if ('data' in error && (error.data as { message?: string })?.message) {
        errorMessage = (error.data as { message: string }).message;
      } else if ('message' in error && (error as { message?: string })?.message) {
        errorMessage = (error as { message: string }).message;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Google Login Failed</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }

  if (isSuccess) {
    // Redirect to dashboard or home page upon successful login
    router.push(ROUTES.ACCOUNT.DASHBOARD); // Assuming a dashboard route
    return null; // Or a success message if redirection takes time
  }

  if (!code) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Missing Authorization Code</AlertTitle>
        <AlertDescription>
          No authorization code found in the URL. Please try logging in with Google again.
        </AlertDescription>
      </Alert>
    );
  }

  return null; // Should not reach here if code is present and handled
}