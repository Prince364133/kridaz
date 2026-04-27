import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { AuthCard } from "@/components/auth/AuthCard";
import { GradientButton } from "@/components/auth/GradientButton";
import { PhoneInput } from "@/components/form-fields/PhoneInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

const RequestOtpSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
});

type RequestOtpFormValues = z.infer<typeof RequestOtpSchema>;

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

interface PhoneInputStepProps {
  isLoading: boolean;
  redirectUrl: string | null;
  onSendOtp: (phoneNumber: string) => Promise<void>;
}

export function PhoneInputStep({ isLoading, redirectUrl, onSendOtp }: PhoneInputStepProps) {
  const phoneForm = useForm<RequestOtpFormValues>({
    resolver: zodResolver(RequestOtpSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  const onSubmit = async (values: RequestOtpFormValues) => {
    try {
      await onSendOtp(values.phoneNumber);
    } catch (_error: unknown) {
      const message = _error instanceof Error ? _error.message : "Failed to send OTP. Please try again.";
      phoneForm.setError("root.serverError", {
        message,
      });
    }
  };

  return (
    <AuthCard>
      {/* Back link */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
        <Link
          href={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to standard login
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#A1FF00]/10 flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-[#A1FF00]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Login / Register</h2>
        <p className="mt-2 text-muted-foreground">Enter your phone number to receive a login code</p>
      </motion.div>

      <Form {...phoneForm}>
        <form onSubmit={phoneForm.handleSubmit(onSubmit)} className="space-y-5">
          {/* Error Alert */}
          <AnimatePresence>
            {phoneForm.formState.errors.root?.serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 mb-4">
                  <AlertDescription>
                    {phoneForm.formState.errors.root.serverError.message}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phone Input */}
          <motion.div custom={0} variants={formItemVariants} initial="hidden" animate="visible">
            <FormField
              control={phoneForm.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <PhoneInput
                      placeholder="Enter phone number"
                      disabled={isLoading}
                      className="h-12 rounded border-border/50 bg-background/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          {/* Submit Button */}
          <motion.div custom={1} variants={formItemVariants} initial="hidden" animate="visible">
            <GradientButton
              type="submit"
              isLoading={isLoading}
              loadingText="Sending OTP..."
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Send OTP
            </GradientButton>
          </motion.div>
        </form>
      </Form>
    </AuthCard>
  );
}
