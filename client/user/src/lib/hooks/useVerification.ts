// apps/player-web/lib/hooks/useVerification.ts
import {
  useRequestPhoneOtpMutation,
  useVerifyPhoneOtpMutation,
  useVerifyEmailMutation,
} from '@/lib/redux/features/auth/authVerificationApi';
import { useVerifyMfaMutation } from '@/lib/redux/features/auth/authApi';

export const useVerification = () => {
  const [requestPhoneOtpApi, { isLoading: isRequestingOtp, error: requestOtpError }] =
    useRequestPhoneOtpMutation();
  const [verifyPhoneOtpApi, { isLoading: isVerifyingOtp, error: verifyOtpError }] =
    useVerifyPhoneOtpMutation();
  const [verifyEmailApi, { isLoading: isVerifyingEmail, error: verifyEmailError }] =
    useVerifyEmailMutation();
  const [verifyMfaApi, { isLoading: isVerifyingMfa, error: verifyMfaError }] =
    useVerifyMfaMutation();

  const requestPhoneOtp = async (phone: string) => {
    await requestPhoneOtpApi({ phone }).unwrap();
  };

  const verifyPhoneOtp = async (code: string) => {
    await verifyPhoneOtpApi({ code }).unwrap();
  };

  const verifyEmail = async (token: string) => {
    await verifyEmailApi({ token }).unwrap();
  };

  const verifyMfa = async (userId: string, code: string) => {
    await verifyMfaApi({ userId, code }).unwrap();
  };

  return {
    requestPhoneOtp,
    isRequestingOtp,
    requestOtpError,
    verifyPhoneOtp,
    isVerifyingOtp,
    verifyOtpError,
    verifyEmail,
    isVerifyingEmail,
    verifyEmailError,
    verifyMfa,
    isVerifyingMfa,
    verifyMfaError,
  };
};
