// apps/player-web/lib/hooks/useSocialAuth.ts
import {
  useGoogleLoginMutation,
  useGetGoogleAuthUrlQuery,
} from '@/lib/redux/features/auth/authSocialApi';
import { useDispatch } from 'react-redux';
import { setCredentials, logout } from '@/lib/redux/features/auth/authSlice';
import { tokenStorage } from '@/lib/utils/tokenStorage';

export const useSocialAuth = (options?: { skipAuthUrl?: boolean }) => {
  const dispatch = useDispatch();
  const [googleLoginApi, { isLoading: isGoogleLoginLoading, error: googleLoginError }] =
    useGoogleLoginMutation();
  const {
    data: googleAuthUrlData,
    isLoading: isGoogleAuthUrlLoading,
    error: googleAuthUrlError,
  } = useGetGoogleAuthUrlQuery(undefined, {
    skip: options?.skipAuthUrl,
  });

  const googleLogin = async (code: string) => {
    try {
      const result = await googleLoginApi({ code }).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.accessToken }));
      tokenStorage.setToken(result.accessToken);
      return result;
    } catch (error: unknown) {
      dispatch(logout());
      tokenStorage.removeToken();
      throw error;
    }
  };

  return {
    googleLogin,
    isGoogleLoginLoading,
    googleLoginError,
    googleAuthUrl: googleAuthUrlData?.url,
    isGoogleAuthUrlLoading,
    googleAuthUrlError,
  };
};
