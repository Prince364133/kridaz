// apps/player-web/lib/hooks/useLogin.ts
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '@/lib/redux/features/auth/authCoreApi';
import { setCredentials, logout } from '@/lib/redux/features/auth/authSlice';
import { tokenStorage } from '@/lib/utils/tokenStorage';

export const useLogin = () => {
  const dispatch = useDispatch();
  const [loginApi, { isLoading, error }] = useLoginMutation();

  const login = async (
    credentials: { identifier: string; password: string },
    rememberMe: boolean
  ) => {
    try {
      const result = await loginApi({ ...credentials, rememberMe }).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.accessToken }));
      tokenStorage.setToken(result.accessToken, rememberMe);
      return result;
    } catch (error: unknown) {
      dispatch(logout()); // Clear credentials on failed login
      tokenStorage.removeToken();
      throw error;
    }
  };

  return { login, isLoading, error };
};
