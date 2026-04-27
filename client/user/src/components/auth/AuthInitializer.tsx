
"use client";

import { useEffect } from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { useGetMeQuery } from "@/lib/redux/features/auth/authApi";
import { useAppDispatch } from "@/lib/redux/hooks";
import { setCredentials, setLoading } from "@/lib/redux/features/auth/authSlice";
import { tokenStorage } from "@/lib/utils/tokenStorage";
import { User } from "@/lib/types/auth.types";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuthStatus();
  
  // Let's use useAppSelector directly for token
  const dispatch = useAppDispatch();
  // We need to access store state directly
  
  // Logic: 
  // We want to fetch ME if:
  // 1. We have a token (persisted)
  // 2. We don't have user details yet (in memory)
  
  // We can't easily get token from useAuthStatus based on previous file view. 
  // Let's rely on the query's behavior.
  
  const storedToken = tokenStorage.getToken();
  
  const { data, isLoading, isSuccess, error } = useGetMeQuery(undefined, {
    skip: !storedToken, // Skip only if no token. Allow re-fetching if tags invalidated.
  });

  useEffect(() => {
    if (isLoading) {
        dispatch(setLoading(true));
    } else {
        dispatch(setLoading(false));
    }
  }, [isLoading, dispatch]);

  useEffect(() => {
    if (isSuccess && data?.user && storedToken) {
        // Hydrate the store
        const userWithTypedRole = {
            ...data.user,
            role: data.user.role as User['role']
        } as User;
        
        dispatch(setCredentials({
            user: userWithTypedRole,
            token: storedToken
        }));
    }
  }, [isSuccess, data, storedToken, dispatch]);
  
  useEffect(() => {
      if (error) {
          // If 401/403, might want to logout or clear token?
          // For now, simple console error, let existing auth guards handle redirect if needed
           console.error("Failed to hydrate session:", JSON.stringify(error, null, 2));
           // Optional: dispatch(logout()) if 401?
      }
  }, [error]);

  return <>{children}</>;
}
