import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '../../hooks/useToast';
import '../../styles/toast.css';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = icons[toast.type];

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 200); // Match exit animation duration
  };

  return (
    <div className={`toast ${toast.type} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className="toast-content">
        <Icon className={`toast-icon ${toast.type}`} />
        <p className="toast-message">{toast.message}</p>
        <button onClick={handleClose} className="toast-close" aria-label="Close">
          <X />
        </button>
      </div>
      <div className="toast-progress">
        <div className={`toast-progress-bar ${toast.type} active`}></div>
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
