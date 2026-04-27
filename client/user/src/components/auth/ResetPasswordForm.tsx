"use client";
import { ROUTES } from '@/lib/routes';

import { useRouter } from "@/hooks/useRouter";
import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";

import { GradientButton } from "./GradientButton";
import { AuthCard } from "./AuthCard";
import { PasswordInput } from "../form-fields/PasswordInput"; // Use consistent component
import { PasswordRequirements } from "./PasswordRequirements"; // Use consistent component

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { usePasswordManagement } from "@/lib/hooks/usePasswordManagement";
import { ApiErrorResponse } from "@workspace/common/types/api.types";
import { ResetPasswordSchema as ZodResetPasswordSchema } from "@workspace/common/schema/auth/player.auth.schema";

type ResetPasswordFormValues = z.infer<typeof ZodResetPasswordSchema>;

export function ResetPasswordForm() {
  const { query, push: pushRoute } = useRouter();
  const token = query.token;

  const { resetPassword, isResetting: isLoading } = usePasswordManagement();
  const [isSuccess, setIsSuccess] = useState(false);

  const formMethods = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ZodResetPasswordSchema),
    defaultValues: {
      token: token || "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = formMethods;

  const passwordValue = watch('password');

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) {
      setError("password", { type: "manual", message: "Missing reset token." });
      return;
    }
    try {
      await resetPassword(token, values.password);
      setIsSuccess(true);
    } catch (err) {
      setIsSuccess(false);
      console.error("Reset password failed:", err);
      const apiError = err as ApiErrorResponse;
      setError("root.serverError", {
        type: "server",
        message: apiError.message || "An error occurred while resetting your password. Please try again."
      });
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md space-y-6 rounded-lg bg-background p-4 shadow-lg sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Link</AlertTitle>
          <AlertDescription>
            The password reset link is invalid or missing a token. Please request a new link.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-md space-y-6 rounded-lg bg-background p-4 shadow-lg sm:p-6 lg:p-8">
        <Alert variant="default" className="bg-green-500 text-white">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Password Reset Successfully</AlertTitle>
          <AlertDescription>
            Your password has been successfully reset. You can now log in with your new password.
            <div className="mt-4">
              <GradientButton onClick={() => pushRoute(ROUTES.AUTH.LOGIN)}>
                Go to Login
              </GradientButton>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AuthCard
      title="Reset Password"
      description="Enter your new password below"
    >
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {errors.root?.serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errors.root.serverError.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <PasswordInput
              name="password"
              label="New Password"
              errors={errors}
              disabled={isLoading}
              inputClassName="h-12 rounded-[8px] border-border/50 bg-background/50 focus:bg-background transition-all duration-200"
            />
            
            {passwordValue && <PasswordRequirements password={passwordValue} />}
            
            <PasswordInput
              name="confirmPassword"
              label="Confirm New Password"
              errors={errors}
              disabled={isLoading}
              inputClassName="h-12 rounded-[8px] border-border/50 bg-background/50 focus:bg-background transition-all duration-200"
            />
          </div>

          <GradientButton type="submit" isLoading={isLoading} loadingText="Resetting...">
            Reset Password
          </GradientButton>
        </form>
      </FormProvider>
    </AuthCard>
  );
}
