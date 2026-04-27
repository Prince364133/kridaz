"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, FormProvider } from "react-hook-form";
import * as z from "zod";

import { GradientButton } from "./GradientButton";
import { AuthCard } from "./AuthCard";
import { Button } from "@/components/ui/button";
import { FormInput } from "../form-fields/FormInput"; // Use consistent component
import { PhoneInput } from "../form-fields/PhoneInput"; // Use enhanced component

import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useVerification } from "@/lib/hooks/useVerification";
import { ApiErrorResponse } from "@workspace/common/types/api.types";

const RequestPhoneVerificationOtpSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number is required"),
});

const VerifyPhoneVerificationOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export function PhoneVerificationForm() {
  const { toast } = useToast();
  const [step, setStep] = useState<"requestOtp" | "verifyOtp">("requestOtp");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isVerifyOtpSuccess, setIsVerifyOtpSuccess] = useState(false);

  const {
    requestPhoneOtp,
    isRequestingOtp,
    requestOtpError,
    verifyPhoneOtp,
    isVerifyingOtp,
    verifyOtpError,
  } = useVerification();

  const requestOtpForm = useForm<
    z.infer<typeof RequestPhoneVerificationOtpSchema>
  >({
    resolver: zodResolver(RequestPhoneVerificationOtpSchema),
    defaultValues: { phoneNumber: "" },
  });

  const verifyOtpForm = useForm<
    z.infer<typeof VerifyPhoneVerificationOtpSchema>
  >({
    resolver: zodResolver(VerifyPhoneVerificationOtpSchema),
    defaultValues: { otp: "" },
  });

  const onRequestOtpSubmit = async (
    values: z.infer<typeof RequestPhoneVerificationOtpSchema>
  ) => {
    try {
      await requestPhoneOtp(values.phoneNumber);
      setPhoneNumber(values.phoneNumber);
      setStep("verifyOtp");
      toast({
        title: "OTP Sent",
        description: `An OTP has been sent to ${values.phoneNumber}.`,
      });
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Please try again.";
      toast({
        title: "Failed to send OTP",
        description: message,
        variant: "destructive",
      });
    }
  };

  const onVerifyOtpSubmit = async (
    values: z.infer<typeof VerifyPhoneVerificationOtpSchema>
  ) => {
    try {
      await verifyPhoneOtp(values.otp);
      setIsVerifyOtpSuccess(true);
      toast({ title: "Phone Verified", description: "Your phone number has been successfully verified." });
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Invalid OTP. Please try again.";
      toast({
        title: "Verification Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  let requestOtpErrorMessage: string | null = null;
  if (requestOtpError) {
    const apiError = requestOtpError as ApiErrorResponse;
    requestOtpErrorMessage = apiError.message || "An unknown error occurred while requesting OTP.";
  }

  let verifyOtpErrorMessage: string | null = null;
  if (verifyOtpError) {
    const apiError = verifyOtpError as ApiErrorResponse;
    verifyOtpErrorMessage = apiError.message || "An unknown error occurred during OTP verification.";
  }

  return (
    <AuthCard
      title="Phone Verification"
      description={step === "requestOtp" ? "Enter your phone number to receive an OTP" : "Enter the verification code sent to your phone"}
    >
      {step === "requestOtp" && (
        <FormProvider {...requestOtpForm}>
          <form
            onSubmit={requestOtpForm.handleSubmit(onRequestOtpSubmit)}
            className="space-y-6"
          >
            <Controller
              control={requestOtpForm.control}
              name="phoneNumber"
              render={({ field: { onChange, value } }) => (
                <PhoneInput
                  label="Phone Number"
                  value={value}
                  onChange={onChange}
                  error={requestOtpForm.formState.errors.phoneNumber?.message}
                  className="h-12 rounded-[8px] border-border/50 bg-background/50 focus:bg-background transition-all duration-200"
                />
              )}
            />
            
            {requestOtpErrorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{requestOtpErrorMessage}</AlertDescription>
              </Alert>
            )}
            <GradientButton type="submit" isLoading={isRequestingOtp} loadingText="Sending...">
              Request OTP
            </GradientButton>
          </form>
        </FormProvider>
      )}

      {step === "verifyOtp" && (
        <FormProvider {...verifyOtpForm}>
          <form
            onSubmit={verifyOtpForm.handleSubmit(onVerifyOtpSubmit)}
            className="space-y-6"
          >
            <p className="text-center text-sm text-muted-foreground">
              An OTP has been sent to{" "}
              <span className="font-medium">{phoneNumber}</span>. Please enter
              it below.
            </p>
            
            <FormInput
              name="otp"
              label="OTP"
              type="text"
              placeholder="123456"
              inputClassName="h-12 rounded-[8px] text-center text-2xl tracking-widest font-bayon border-border/50 bg-background/50 focus:bg-background transition-all duration-200"
              errors={verifyOtpForm.formState.errors}
            />

            {verifyOtpErrorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{verifyOtpErrorMessage}</AlertDescription>
              </Alert>
            )}
            <GradientButton type="submit" isLoading={isVerifyingOtp} loadingText="Verifying...">
              Verify Phone
            </GradientButton>
            <Button
              variant="link"
              className="w-full"
              onClick={() => setStep("requestOtp")}
              type="button"
            >
              Resend OTP or Change Number
            </Button>
          </form>
        </FormProvider>
      )}

      {isVerifyOtpSuccess && (
        <Alert variant="default">
          <AlertDescription>Phone verified successfully!</AlertDescription>
        </Alert>
      )}
    </AuthCard>
  );
}
