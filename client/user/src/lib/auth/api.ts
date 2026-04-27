import api from '@/lib/api';

export const AuthApi = {
  requestPhoneVerificationOtp: async (phoneNumber: string) => {
    const response = await api.post('/auth/request-phone-verification-otp', { phoneNumber });
    return response.data;
  },

  verifyPhoneVerificationOtp: async (otp: string) => {
    const response = await api.post('/auth/verify-phone-verification-otp', { otp });
    return response.data;
  },
};
