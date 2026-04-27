import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/AuthCard";
import { GradientButton } from "@/components/auth/GradientButton";
import { Input } from "@workspace/ui/components/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";

const VerifyOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type VerifyOtpFormValues = z.infer<typeof VerifyOtpSchema>;

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

interface OtpVerificationStepProps {
  phoneNumber: string;
  isLoading: boolean;
  countdown: number;
  onVerifyOtp: (otp: string) => Promise<void>;
  onResendOtp: () => Promise<void>;
  onBack: () => void;
}

export function OtpVerificationStep({
  phoneNumber,
  isLoading,
  countdown,
  onVerifyOtp,
  onResendOtp,
  onBack,
}: OtpVerificationStepProps) {
  const otpForm = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(VerifyOtpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (values: VerifyOtpFormValues) => {
    try {
      await onVerifyOtp(values.otp);
    } catch (_error: unknown) {
      const err = _error as { message?: string };
      otpForm.setError("root.serverError", {
        message: err?.message || "Invalid OTP. Please try again.",
      });
    }
  };

  const handleResend = async () => {
    try {
      await onResendOtp();
      otpForm.reset();
      toast.success("OTP resent successfully!");
    } catch (_error) {
       // Handled by parent
    }
  };

  return (
    <AuthCard>
      {/* Back to phone step */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Change phone number
        </button>
      </motion.div>

      {/* Header */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#A1FF00]/10 flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-[#A1FF00]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Verify OTP</h2>
        <p className="mt-2 text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground">{phoneNumber}</span>
        </p>
      </motion.div>

      <Form {...otpForm}>
        <form onSubmit={otpForm.handleSubmit(onSubmit)} className="space-y-5">
          {/* Error Alert */}
          <AnimatePresence>
            {otpForm.formState.errors.root?.serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 mb-4">
                  <AlertDescription>
                    {otpForm.formState.errors.root.serverError.message}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OTP Input */}
          <motion.div custom={0} variants={formItemVariants} initial="hidden" animate="visible">
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      disabled={isLoading}
                      className="h-14 rounded border-border/50 bg-background/50 text-center text-2xl tracking-[0.5em] font-mono"
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
            <GradientButton type="submit" isLoading={isLoading} loadingText="Verifying...">
              Verify Code
            </GradientButton>
          </motion.div>

          {/* Resend OTP */}
          <motion.p
            custom={2}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            className="text-center text-sm text-muted-foreground"
          >
            Didn&apos;t receive the code?{" "}
            {countdown > 0 ? (
              <span className="text-muted-foreground">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-[#5a9000] hover:underline font-medium"
              >
                Resend OTP
              </button>
            )}
          </motion.p>
        </form>
      </Form>
    </AuthCard>
  );
}
