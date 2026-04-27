"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStatus } from "@/hooks/useAuthStatus";

const RequestPhoneVerificationOtpSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
});

const VerifyPhoneVerificationOtpSchema = z.object({
  userId: z.string(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});
import {
  useRequestPhoneVerificationOtpMutation,
  useVerifyPhoneVerificationOtpMutation,
} from "@/lib/redux/features/auth/authApi";

export function PhoneVerificationForm() {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const { toast } = useToast();
  const { user } = useAuthStatus();

  const [requestOtp, { isLoading: isRequestingOtp }] =
    useRequestPhoneVerificationOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] =
    useVerifyPhoneVerificationOtpMutation();

  const requestOtpForm = useForm<
    z.infer<typeof RequestPhoneVerificationOtpSchema>
  >({
    resolver: zodResolver(RequestPhoneVerificationOtpSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  const verifyOtpForm = useForm<
    z.infer<typeof VerifyPhoneVerificationOtpSchema>
  >({
    resolver: zodResolver(VerifyPhoneVerificationOtpSchema),
    defaultValues: {
      userId: "", // This will be populated after requesting OTP
      otp: "",
    },
  });

  async function onRequestOtpSubmit(
    values: z.infer<typeof RequestPhoneVerificationOtpSchema>
  ) {
    try {
      await requestOtp({ phoneNumber: values.phoneNumber }).unwrap();
      setPhoneNumber(values.phoneNumber);
      if (user) {
        verifyOtpForm.setValue("userId", user.id);
      }
      setStep(2);
    } catch (error) {
      let errorMessage = "An unexpected error occurred";
      if (typeof error === "object" && error !== null) {
        if ("data" in error && (error.data as { message?: string })?.message) {
          errorMessage = (error.data as { message: string }).message;
        } else if (
          "message" in error &&
          (error as { message?: string }).message
        ) {
          errorMessage = (error as { message: string }).message;
        }
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  async function onVerifyOtpSubmit(
    values: z.infer<typeof VerifyPhoneVerificationOtpSchema>
  ) {
    try {
      await verifyOtp({ phoneNumber, otp: values.otp }).unwrap();
      toast({
        title: "Phone Verified",
        description: "Your phone number has been successfully verified.",
      });
      // Optionally redirect or update UI
    } catch (error) {
      let errorMessage = "Failed to verify OTP.";
      if (typeof error === "object" && error !== null) {
        if ("data" in error && (error.data as { message?: string })?.message) {
          errorMessage = (error.data as { message: string }).message;
        } else if (
          "message" in error &&
          (error as { message?: string }).message
        ) {
          errorMessage = (error as { message: string }).message;
        }
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {step === 1 && (
        <Form {...requestOtpForm}>
          <form
            onSubmit={requestOtpForm.handleSubmit(onRequestOtpSubmit)}
            className="space-y-6"
          >
            <FormField
              control={requestOtpForm.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isRequestingOtp}>
              {isRequestingOtp ? "Sending OTP..." : "Request OTP"}
            </Button>
          </form>
        </Form>
      )}

      {step === 2 && (
        <Form {...verifyOtpForm}>
          <form
            onSubmit={verifyOtpForm.handleSubmit(onVerifyOtpSubmit)}
            className="space-y-6"
          >
            <p className="text-center text-sm text-muted-foreground">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
            <FormField
              control={verifyOtpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isVerifyingOtp}>
              {isVerifyingOtp ? "Verifying..." : "Verify Phone"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setStep(1)}
            >
              Resend OTP or Change Number
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
