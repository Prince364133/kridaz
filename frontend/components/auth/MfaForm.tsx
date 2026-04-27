"use client";
import { ROUTES } from '@/lib/routes';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { GradientButton } from "./GradientButton";
import { AuthCard } from "./AuthCard";
import { FormInput } from "../form-fields/FormInput"; // Use consistent component

import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

import { useVerification } from "@/lib/hooks/useVerification";
import { ApiErrorResponse } from "@workspace/common/types/api.types";
import { VerifyMfaSchema as ZodVerifyMfaSchema } from "@workspace/common/schema/auth/player.auth.schema";
import Link from 'next/link';
import { Button } from "@workspace/ui/components/button";

type MfaFormValues = z.infer<typeof ZodVerifyMfaSchema>;

export function MfaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams ? searchParams.get("userId") : null;

  const { verifyMfa, isVerifyingMfa: isLoading } = useVerification();
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const formMethods = useForm<MfaFormValues>({
    resolver: zodResolver(ZodVerifyMfaSchema),
    defaultValues: {
      userId: userId || "",
      otp: "",
    },
  });

  const {
    handleSubmit,
    setError,
    formState: { errors },
  } = formMethods;

  useEffect(() => {
    if (isSuccess && !redirecting) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        router.push(ROUTES.ACCOUNT.DASHBOARD);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, redirecting, router]);


  async function onSubmit(values: MfaFormValues) {
    if (!userId) {
      setError("userId", { type: "manual", message: "User ID is missing for MFA verification." });
      return;
    }
    try {
      await verifyMfa(userId, values.otp);
      setIsSuccess(true);
    } catch (err) {
      setIsSuccess(false);
      console.error("MFA verification failed:", err);
      const apiError = err as ApiErrorResponse;
      setError("root.serverError", {
        type: "server",
        message: apiError.message || "Failed to verify MFA code. Please try again."
      });
    }
  }

  if (!userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing User ID</AlertTitle>
          <AlertDescription>
            User ID is missing from the verification link. Please go back to login and try again.
          </AlertDescription>
          <Button asChild className="mt-4 w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Alert variant="default" className="bg-green-500 text-white w-full max-w-md">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>MFA Verified Successfully</AlertTitle>
          <AlertDescription>
            Your MFA code has been successfully verified. You will be redirected shortly.
            <Button asChild className="mt-4 w-full" disabled={redirecting}>
              <Link href="/dashboard">Go to Dashboard Now</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AuthCard
      title="Verify Authentication"
      description="Enter the 6-digit code sent to your device"
    >
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {errors.root?.serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>MFA Verification Failed</AlertTitle>
              <AlertDescription>
                {errors.root.serverError.message}
              </AlertDescription>
            </Alert>
          )}

          <FormInput
            name="otp"
            label="6-Digit Code"
            type="text"
            pattern="[0-9]*"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            disabled={isLoading}
            errors={errors}
            inputClassName="h-12 rounded-[8px] text-center text-2xl tracking-widest font-bayon border-border/50 bg-background/50 focus:bg-background transition-all duration-200"
          />

          <GradientButton type="submit" isLoading={isLoading} loadingText="Verifying...">
            Verify Code
          </GradientButton>
        </form>
      </FormProvider>
    </AuthCard>
  );
}
