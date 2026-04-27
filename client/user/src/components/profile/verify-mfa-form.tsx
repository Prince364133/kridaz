"use client";
import { ROUTES } from '@/lib/routes';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
const VerifyMfaSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useRouter } from "@/hooks/useRouter";

import { useVerifyMfaMutation } from "@/lib/redux/features/auth/authApi";
import { useAuthStatus } from "@/hooks/useAuthStatus";

const formSchema = VerifyMfaSchema;

export function VerifyMfaForm() {
  const { push: pushRoute } = useRouter();
  const { user } = useAuthStatus();
  const [verifyMfa, { isLoading, isError, error }] = useVerifyMfaMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user?.id) {
        console.error("User ID not found");
        return;
    }
    try {
      await verifyMfa({ userId: user.id, code: values.otp }).unwrap();
      // On success, unwrap doesn't throw, so we can redirect.
      pushRoute(ROUTES.ACCOUNT.DASHBOARD);
    } catch (err) {
      // Error is handled by the isError and error properties from the hook
      console.error("Failed to verify MFA", err);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <h3 className="text-2xl font-bold">Two-Factor Authentication</h3>
          <p className="text-muted-foreground">
            Enter the code from your authenticator app.
          </p>
        </div>
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>One-Time Password</FormLabel>
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
        {isError && (
          <p className="text-sm font-medium text-destructive">
            {
              // Type guard for RTK Query error structure
              (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data)
                ? (error.data as { message: string }).message
                : "Invalid MFA code. Please try again."
            }
          </p>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Verify"}
        </Button>
      </form>
    </Form>
  );
}
