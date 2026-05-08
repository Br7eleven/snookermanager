import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import '../../styles/header.css';

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/tables') return 'Tables';
    if (path === '/beverages') return 'Beverages';
    if (path === '/members') return 'Members';
    if (path === '/reports') return 'Reports';
    if (path === '/settings') return 'Settings';
    return 'Dashboard';
  };

  return (
    <header className="header-root">
      {/* Breadcrumb */}
      <h1 className="header-breadcrumb">{getPageTitle()}</h1>

      {/* Right Section */}
      <div className="header-right">
        {/* Clock */}
        <div className="header-clock">
          {format(currentTime, 'EEE dd MMM · hh:mm:ss a')}
        </div>

        {/* Notification Bell */}
        <button className="header-bell">
          <Bell />
          <span className="header-bell-badge"></span>
        </button>

        {/* User Chip */}
        <div className="header-user">
          <p className="header-user-name">{user?.full_name || 'User'}</p>
        </div>
      </div>
    </header>
  );
}
