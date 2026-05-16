import { create } from 'zustand';

const stored = (() => {
  try { return JSON.parse(localStorage.getItem('ccm_user')); } catch { return null; }
})();

export const useAppStore = create((set) => ({
  user: stored || null,
  isAuthenticated: !!stored,
  setUser: (user) => {
    localStorage.setItem('ccm_user', JSON.stringify(user));
    set({ user, isAuthenticated: !!user });
  },
  logout: () => {
    localStorage.removeItem('ccm_user');
    set({ user: null, isAuthenticated: false });
  },
}));
