"use client";

import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { RootState } from "@/lib/store";
import { logout as logoutAction } from "@/lib/redux/features/auth/authSlice";

/**
 * A custom hook to access authentication status and user data from the Redux store.
 * This decouples UI components from the specific structure of the Redux store.
 *
 * @returns An object containing:
 *  - `isAuthenticated` (boolean): True if the user is logged in.
 *  - `user` (object | null): The current user object, or null if not authenticated.
 *  - `logout` (function): Function to log the user out.
 */
export const useAuthStatus = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isLoading } = useAppSelector((state: RootState) => state.auth);

  const logout = () => {
    dispatch(logoutAction());
  };

  return { isAuthenticated, user, isLoading, logout };
};
