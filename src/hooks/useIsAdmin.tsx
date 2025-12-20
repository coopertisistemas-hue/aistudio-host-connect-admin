import { useAuth } from './useAuth';

export const useIsAdmin = () => {
  const { userRole, loading } = useAuth();
  return {
    isAdmin: userRole === 'admin',
    loading,
  };
};