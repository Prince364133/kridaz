"use client";

import React, { useState } from "react";
import * as z from "zod";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Users, CheckCircle } from "lucide-react";

import { RegisterSchema } from "@workspace/common/schema/auth/player.auth.schema";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SocialLogins } from "./SocialLogins";
import { FormInput } from "../form-fields/FormInput";
import { PhoneInput } from "../form-fields/PhoneInput"; // Use enhanced component
import { PasswordInput } from "../form-fields/PasswordInput";
import { ApiErrorResponse } from "@workspace/common/types/api.types";
import { useRegister } from "@/lib/hooks/useRegister";
import { AuthCard } from "./AuthCard";
import { GradientButton } from "./GradientButton";
import { PasswordRequirements } from "./PasswordRequirements";
import { Link } from "react-router-dom";

type RegisterFormValues = z.infer<typeof RegisterSchema>;

const formItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

const benefits = [
  "Book any sports venue instantly",
  "Join games with other players",
  "Track your sports activities",
];

export function RegisterForm() {
  const navigate = useNavigate();
  const { register: callRegister, isLoading } = useRegister();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const formMethods = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });
  const {
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    control,
  } = formMethods;

  const password = watch("password");

  const onSubmit = async (data: RegisterFormValues) => {
    setGlobalError(null);
    try {
      await callRegister(data);
      /* eslint-disable-next-line no-restricted-syntax */
navigate('/venues');
    } catch (error: unknown) {
      console.error("Registration failed:", error);
      let message = "An unexpected error occurred. Please try again.";
      
      // RTK Query unwrap() throws the normalized error from baseQueryWithReauth
      // The error could be our ApiErrorResponse directly, or wrapped in a 'data' property
      const apiError = (error as { data?: ApiErrorResponse })?.data || (error as ApiErrorResponse);

      if (apiError?.errors && Array.isArray(apiError.errors) && apiError.errors.length > 0) {
        apiError.errors.forEach((err: { field?: string; message: string }) => {
          if (err.field) {
            setError(err.field as keyof RegisterFormValues, {
              type: "server",
              message: err.message,
            });
          }
        });
        message = apiError.errors[0]?.message || message;
      } else if (apiError?.message) {
        message = apiError.message;
      }
      setGlobalError(message);
    }
  };

  return (
    <AuthCard
      title="Sign up"
      description="Start your sports journey today"
    >
      {/* Social Proof */}
      <motion.div
        className="flex items-center justify-center gap-2 mb-6 text-sm text-[#5a9000]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Users className="w-4 h-4" />
        <span className="font-medium">Join 10,000+ players already on Owl Turf</span>
      </motion.div>

      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                  <AlertTitle>Registration Failed</AlertTitle>
                  <AlertDescription>{globalError}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Name Input */}
          <motion.div
            custom={0}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <FormInput
              name="name"
              label="Full Name"
              placeholder="John Doe"
              errors={errors}
              disabled={isLoading}
              inputClassName="h-12 rounded-[8px] border-border/50 bg-background/50 focus:bg-background transition-all duration-200"
            />
          </motion.div>

          {/* Email Input */}
          <motion.div
            custom={1}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <FormInput
              name="email"
              label="Email"
              type="email"
              placeholder="name@example.com"
              errors={errors}
              disabled={isLoading}
              inputClassName="h-12 rounded-[8px] border-border/50 bg-background/50 focus:bg-background transition-all duration-200"
            />
          </motion.div>

          {/* Phone Input */}
          <motion.div
            custom={2}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <PhoneInput
                  label="Phone Number"
                  value={value}
                  onChange={onChange}
                  error={errors.phone?.message}
                  disabled={isLoading}
                  className="h-12 rounded-[8px] border-border/50 bg-background/50 focus:bg-background transition-all duration-200"
                />
              )}
            />
          </motion.div>

          {/* Password Input */}
          <motion.div
            custom={3}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <PasswordInput
              name="password"
              label="Password"
              errors={errors}
              disabled={isLoading}
              inputClassName="h-12 rounded-[8px] border-border/50 bg-background/50 focus:bg-background transition-all duration-200"
            />
          </motion.div>

          {/* Password Requirements */}
          <AnimatePresence>
            {password && (
              <motion.div
                custom={3.5}
                variants={formItemVariants}
                initial="hidden"
                animate="visible"
              >
                <PasswordRequirements password={password} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm Password Input */}
          <motion.div
            custom={4}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <PasswordInput
              name="confirmPassword"
              label="Confirm Password"
              errors={errors}
              disabled={isLoading}
              inputClassName="h-12 rounded-[8px] border-border/50 bg-background/50 focus:bg-background transition-all duration-200"
            />
          </motion.div>

          {/* Benefits List */}
          <motion.div
            custom={5}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            className="py-2"
          >
            <div className="bg-[#A1FF00]/5 border border-[#A1FF00]/20 rounded-[8px] p-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                What you&apos;ll get:
              </p>
              <ul className="space-y-2">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center gap-2 text-sm text-foreground"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <CheckCircle className="w-4 h-4 text-[#A1FF00] flex-shrink-0" />
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            custom={6}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <GradientButton
              type="submit"
              isLoading={isLoading}
              loadingText="Creating account..."
            >
              Sign Up
            </GradientButton>
          </motion.div>

          {/* Terms */}
          <motion.p
            custom={7}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            className="text-xs text-center text-muted-foreground"
          >
            By signing up, you agree to our{" "}
            <Link to="/terms-of-service" className="text-[#5a9000] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy-policy" className="text-[#5a9000] hover:underline">
              Privacy Policy
            </Link>
          </motion.p>
        </form>
      </FormProvider>

      {/* Divider */}
      <motion.div
        className="relative my-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">
            Or sign up with
          </span>
        </div>
      </motion.div>

      {/* Social Logins */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <SocialLogins />
      </motion.div>

      {/* Login Link */}
      <motion.p
        className="mt-6 text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-[#5a9000] hover:text-[#5a9000] hover:underline transition-colors"
        >
          Login
        </Link>
      </motion.p>
    </AuthCard>
  );
}
