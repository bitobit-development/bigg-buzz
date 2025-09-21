import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'vendor' | 'admin';
  isVerified: boolean;
  profile?: {
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    idNumber?: string;
  };
}

interface RegistrationState {
  step: 'sa-id' | 'personal-info' | 'otp-verification' | 'complete';
  saId?: string;
  phone?: string;
  userId?: string;
  otpSent: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  registration: RegistrationState;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (profile: Partial<User['profile']>) => void;

  // Registration actions
  setRegistrationStep: (step: RegistrationState['step']) => void;
  updateRegistration: (data: Partial<RegistrationState>) => void;
  clearRegistration: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      registration: {
        step: 'sa-id',
        otpSent: false,
      },

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      login: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          registration: {
            step: 'sa-id',
            otpSent: false,
          },
        }),

      updateProfile: (profile) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              profile: { ...user.profile, ...profile },
            },
          });
        }
      },

      // Registration actions
      setRegistrationStep: (step) => {
        const { registration } = get();
        set({
          registration: { ...registration, step },
        });
      },

      updateRegistration: (data) => {
        const { registration } = get();
        set({
          registration: { ...registration, ...data },
        });
      },

      clearRegistration: () =>
        set({
          registration: {
            step: 'sa-id',
            otpSent: false,
          },
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);