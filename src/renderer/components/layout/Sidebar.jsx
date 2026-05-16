import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Table2, ShoppingBag, Users, BarChart2, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const allNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tables', icon: Table2, label: 'Tables' },
    { path: '/beverages', icon: ShoppingBag, label: 'Beverages' },
    { path: '/members', icon: Users, label: 'Members' },
    { path: '/reports', icon: BarChart2, label: 'Reports', ownerOnly: true },
    { path: '/settings', icon: Settings, label: 'Settings', ownerOnly: true },
  ];

  const navItems = allNavItems.filter(item => !item.ownerOnly || user?.role === 'owner');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="sidebar-root">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-content">
          <span className="sidebar-logo-icon">🎱</span>
          <span className="sidebar-logo-text">Cue Club Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="sidebar-nav-list">
          {navItems.map((item) => (
            <li key={item.path} className="sidebar-nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Chip */}
      <div className="sidebar-user">
        <div className="sidebar-user-content">
          <div className="sidebar-user-avatar">
            {getInitials(user?.full_name)}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.full_name || 'User'}</p>
            <p className="sidebar-user-role">{user?.role || 'staff'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
            title="Logout"
          >
            <LogOut />
          </button>
        </div>
      </div>
    </div>
  );
}
