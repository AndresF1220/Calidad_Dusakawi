
// This file is deprecated and will be removed. Please use useAuth from '@/lib/auth' instead.
// This is a temporary mock for checking admin status.
// In a real application, this would involve checking user roles from Firebase Auth custom claims.
export const useIsAdmin = () => {
    return true; // Hardcoded to true for development and testing purposes.
};
