"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone } from "lucide-react";

import { useLogin } from "@/lib/hooks/useLogin";
import { ROUTES } from "@/lib/routes";
import { LoginSchema } from "@workspace/common/schema/auth/player.auth.schema";

import { Label } from "@workspace/ui/components/label";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { SocialLogins } from "./SocialLogins";
import { FormInput } from "../form-fields/FormInput";
import { PasswordInput } from "../form-fields/PasswordInput";
import { GradientButton } from "./GradientButton";
import { ApiErrorResponse } from '@/lib/redux/api'; // Correct import path

type LoginFormValues = z.infer<typeof LoginSchema>;

const formItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useLogin();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Get redirect URL from query params (for returning after login)
  const redirectUrl = searchParams.get("redirect");

  const formMethods = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    setError,
  } = formMethods;

  const onSubmit = async (data: LoginFormValues) => {
    setGlobalError(null);
    try {
      await login(data, rememberMe);
      toast.success("Welcome back!", {
        description: "You have successfully logged in.",
      });
      // GuestGuard will automatically redirect to the redirect URL or fallback
      // after login succeeds and isAuthenticated becomes true.
      // We do an explicit push here as a backup with proper encoding
      const targetUrl = redirectUrl ? decodeURIComponent(redirectUrl) : "/";
      router.push(targetUrl);
    } catch (error: unknown) { // Changed to unknown
      console.error("Login failed:", error);
      let message = "Failed to login. Please check your credentials.";
      const apiError = error as { data?: ApiErrorResponse, status?: number, message?: string }; // More flexible type for error object

      const detailedErrors = apiError.data?.errors;
      if (detailedErrors && detailedErrors.length > 0) {
        (detailedErrors as { field?: string; message: string }[]).forEach((err) => {
          if (err.field) {
            setError(err.field as keyof LoginFormValues, {
              type: "server",
              message: err.message,
            });
          }
        });
        message = (detailedErrors[0] as { message: string })?.message || message;
      } else if (apiError.data?.message) {
        message = apiError.data.message;
      } else if (apiError.message) {
        message = apiError.message;
      }

      setGlobalError(message);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight font-integral uppercase">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Enter your credentials to access your account</p>
      </div>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Error Alert */}
          <AnimatePresence>
            {globalError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                  <AlertTitle className="flex items-center gap-2">
                    <span className="text-red-500">⚠</span> Error
                  </AlertTitle>
                  <AlertDescription>{globalError}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email/Phone Input */}
          <motion.div
            custom={0}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <FormInput
              name="identifier"
              label="Email or Phone"
              placeholder="name@example.com"
              autoComplete="username"
              disabled={isLoading}
              errors={errors}
              inputClassName="h-12 rounded-[8px] border-border/50 bg-background/50 focus:bg-background transition-all duration-200"
            />
          </motion.div>

          {/* Password Input */}
          <motion.div
            custom={1}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href={ROUTES.AUTH.FORGOT_PASSWORD}
                className="text-sm text-[#5a9000] hover:text-[#5a9000] hover:underline focus-visible:ring-2 focus-visible:ring-[#A1FF00] focus-visible:outline-none rounded-sm transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              name="password"
              autoComplete="current-password"
              disabled={isLoading}
              errors={errors}
              inputClassName="h-12 rounded-[8px] border-border/50 bg-background/50 focus:bg-background transition-all duration-200"
            />
          </motion.div>

          {/* Remember Me Checkbox */}
          <motion.div
            custom={2}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-3"
          >
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="checkbox-premium"
            />
            <Label
              htmlFor="remember-me"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Remember me for 30 days
            </Label>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            custom={3}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <GradientButton
              type="submit"
              isLoading={isLoading}
              loadingText="Signing in..."
            >
              Login
            </GradientButton>
          </motion.div>


        </form>
      </FormProvider>

      {/* Phone OTP Login Button */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <GradientButton
          variant="outline"
          onClick={() => {
            const otpLoginUrl = redirectUrl
              ? `/login-otp?redirect=${encodeURIComponent(redirectUrl)}`
              : "/login-otp";
            router.push(otpLoginUrl);
          }}
          icon={<Smartphone className="w-4 h-4" />}
        >
          Login with Phone OTP
        </GradientButton>
      </motion.div>

      {/* Divider */}
      <motion.div
        className="relative my-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">
            Or login with
          </span>
        </div>
      </motion.div>

      {/* Social Logins */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <SocialLogins />
      </motion.div>

      {/* Phone OTP Login Link */}


      {/* Sign Up Link */}
      <motion.p
        className="mt-6 text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#5a9000] hover:text-[#5a9000] hover:underline transition-colors"
        >
          Sign up for free
        </Link>
      </motion.p>
    </div>
  );
}