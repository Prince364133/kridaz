// apps/player-web/lib/hooks/usePasswordManagement.ts
import {
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
} from '@/lib/redux/features/auth/authPasswordApi';

export const usePasswordManagement = () => {
  const [requestPasswordResetApi, { isLoading: isRequesting, error: requestError }] =
    useRequestPasswordResetMutation();
  const [resetPasswordApi, { isLoading: isResetting, error: resetError }] =
    useResetPasswordMutation();

  const requestPasswordReset = async (email: string) => {
    await requestPasswordResetApi({ email }).unwrap();
  };

  const resetPassword = async (token: string, newPassword: string) => {
    await resetPasswordApi({ token, newPassword }).unwrap();
  };

  return {
    requestPasswordReset,
    isRequesting,
    requestError,
    resetPassword,
    isResetting,
    resetError,
  };
};