import { useState } from 'react';
import { AlertCircle, Info, X } from 'lucide-react';
import '../../styles/alert-banner.css';

const icons = {
  danger: AlertCircle,
  info: Info,
};

export default function AlertBanner({ variant = 'info', message, actionText, onActionClick, dismissible = true }) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = icons[variant];

  if (!isVisible) return null;

  return (
    <div className={`alert-banner ${variant}`}>
      <div className="alert-banner-content">
        <Icon className="alert-banner-icon" />
        <p className="alert-banner-message">{message}</p>
        {actionText && onActionClick && (
          <button onClick={onActionClick} className="alert-banner-action">
            {actionText} →
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={() => setIsVisible(false)}
          className="alert-banner-close"
          aria-label="Dismiss"
        >
          <X />
        </button>
      )}
    </div>
  );
}
