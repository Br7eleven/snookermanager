import { useAppStore } from '../store/appStore';

export function useAuth() {
  const { user, isAuthenticated, setUser, logout: logoutStore } = useAppStore();

  const login = async (username, password) => {
    try {
      const result = await window.electron.login({ username, password });

      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await window.electron.logout();
      logoutStore();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false };
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
}
