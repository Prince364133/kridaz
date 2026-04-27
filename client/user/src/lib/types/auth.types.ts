export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  imageUrl?: string;
  role?: 'PLAYER' | 'PROSPECT_OWNER' | 'PENDING_ONBOARDING_OWNER' | 'VERIFIED_VENUE_OWNER' | 'OWLTP_ADMIN';
  // Add other user properties as needed
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
