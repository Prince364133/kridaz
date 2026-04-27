// apps/player-web/lib/hooks/useRegister.ts
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '@/lib/redux/features/auth/authCoreApi';
import { setCredentials, logout } from '@/lib/redux/features/auth/authSlice';
import { tokenStorage } from '@/lib/utils/tokenStorage';

export const useRegister = () => {
  const dispatch = useDispatch();
  const [registerApi, { isLoading, error }] = useRegisterMutation();

  const register = async (userData: { email: string; password: string; name?: string; confirmPassword?: string; phone?: string }) => {
    try {
      const result = await registerApi(userData).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.accessToken }));
      tokenStorage.setToken(result.accessToken);
      return result;
    } catch (error: unknown) {
      dispatch(logout()); // Clear credentials on failed register
      tokenStorage.removeToken();
      throw error;
    }
  };

  return { register, isLoading, error };
};
