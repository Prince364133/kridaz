import { useNavigate as useRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { logout } from '@/lib/redux/features/auth/authSlice';
import { tokenStorage } from '@/lib/utils/tokenStorage';
import { useRequestPhoneOtpMutation, useVerifyPhoneOtpMutation } from '@/lib/redux/features/auth/authVerificationApi';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useRouter();
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [requestPhoneOtpMutation, { isLoading: isRequestingPhoneOtp, error: requestPhoneOtpError }] = useRequestPhoneOtpMutation();
  const [verifyPhoneOtpMutation, { isLoading: isVerifyingPhoneOtp, error: verifyPhoneOtpError }] = useVerifyPhoneOtpMutation();

  const signOut = () => {
    dispatch(logout());
    tokenStorage.removeToken(); // Clear token from localStorage
    /* eslint-disable-next-line no-restricted-syntax */
    navigate('/');
  };

  const requestPhoneOtp = async (phone: string) => {
    await requestPhoneOtpMutation({ phone }).unwrap();
  };

  const verifyPhoneOtp = async (code: string) => {
    await verifyPhoneOtpMutation({ code }).unwrap();
  };

  return {
    user,
    token,
    isAuthenticated,
    logout: signOut,
    requestPhoneOtp,
    verifyPhoneOtp,
    isRequestingPhoneOtp,
    requestPhoneOtpError,
    isVerifyingPhoneOtp,
    verifyPhoneOtpError,
  };
};
