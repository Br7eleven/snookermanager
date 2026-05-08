import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    set((state) => ({
      toasts: [toast, ...state.toasts].slice(0, 4), // Max 4 toasts, newest on top
    }));

    // Auto-remove after 4000ms
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== toast.id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export function useToast() {
  const { addToast } = useToastStore();

  const createToast = (type, message) => {
    const id = crypto.randomUUID();
    const toast = {
      id,
      type,
      message,
      createdAt: Date.now(),
    };
    addToast(toast);
  };

  return {
    toast: {
      success: (message) => createToast('success', message),
      error: (message) => createToast('error', message),
      warning: (message) => createToast('warning', message),
      info: (message) => createToast('info', message),
    },
  };
}

// Export store for ToastContainer to consume
export { useToastStore };
