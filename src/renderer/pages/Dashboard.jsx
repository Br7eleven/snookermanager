import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table2, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { intervalToDuration, formatDistanceToNow } from 'date-fns';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    tablesInUse: 0,
    totalTables: 6,
    todayRevenue: 0,
    revenueChange: 0,
    activeSessions: 0,
    avgSessionTime: 0,
    beveragesSold: 0,
  });
  const [activeTables, setActiveTables] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [sessionsResult, dailyReport] = await Promise.all([
        window.electron.getActiveSessions(),
        window.electron.getDailyReport({ date: new Date().toISOString().split('T')[0] }),
      ]);

      // Calculate metrics
      const activeSessions = sessionsResult.success ? sessionsResult.sessions : [];
      const avgTime = activeSessions.length > 0
        ? activeSessions.reduce((sum, s) => sum + (Date.now() - new Date(s.started_at).getTime()), 0) / activeSessions.length / 60000
        : 0;

      setMetrics({
        tablesInUse: activeSessions.length,
        totalTables: 6,
        todayRevenue: dailyReport.success ? dailyReport.data.totalRevenue : 0,
        revenueChange: dailyReport.success ? dailyReport.data.revenueChange || 0 : 0,
        activeSessions: activeSessions.length,
        avgSessionTime: Math.round(avgTime),
        beveragesSold: dailyReport.success ? dailyReport.data.beveragesSold : 0,
      });

      setActiveTables(activeSessions);

      // Build activity feed
      const activities = [];
      if (dailyReport.success && dailyReport.data.recentActivity) {
        activities.push(...dailyReport.data.recentActivity);
      }
      setRecentActivity(activities.slice(0, 8));

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (startedAt) => {
    const duration = intervalToDuration({
      start: new Date(startedAt),
      end: new Date(),
    });
    const hours = String(duration.hours || 0).padStart(2, '0');
    const minutes = String(duration.minutes || 0).padStart(2, '0');
    const seconds = String(duration.seconds || 0).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatCurrency = (amount) => {
    return `Rs ${amount.toLocaleString()}`;
  };

  const getGameTypeBadgeClass = (gameType) => {
    if (gameType.includes('Century')) return 'badge-century';
    if (gameType.includes('6 Ball')) return 'badge-6ball';
    return 'badge-fullball';
  };

  return (
    <div className="dashboard-container">
      {/* Operations Banner */}
      <div className="operations-banner">
        <span className="banner-icon">ℹ️</span>
        <p>Operations Tip: Close sessions immediately after customer checkout to maximize turnaround.</p>
      </div>

      {/* Metric Cards Row */}
      <div className="metric-cards-row">
        <div className="metric-card">
          <div className="metric-icon emerald">
            <Table2 size={20} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Tables in use</p>
            <div className="metric-value-row">
              <span className="metric-value">{metrics.tablesInUse}/{metrics.totalTables}</span>
              <span className="metric-subtext">Active</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon blue">
            <TrendingUp size={20} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Today's revenue</p>
            <div className="metric-value-row">
              <span className="metric-value">{formatCurrency(metrics.todayRevenue)}</span>
              {metrics.revenueChange !== 0 && (
                <span className={`metric-change ${metrics.revenueChange > 0 ? 'positive' : 'negative'}`}>
                  {metrics.revenueChange > 0 ? '↑' : '↓'} {Math.abs(metrics.revenueChange)}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon amber">
            <Users size={20} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Active sessions</p>
            <div className="metric-value-row">
              <span className="metric-value">{metrics.activeSessions}</span>
              <span className="metric-subtext">avg {metrics.avgSessionTime} min</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon purple">
            <ShoppingBag size={20} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Beverages sold</p>
            <div className="metric-value-row">
              <span className="metric-value">{metrics.beveragesSold} items</span>
              <span className="metric-subtext">Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="dashboard-main-row">
        {/* Active Tables Panel - 60% */}
        <div className="active-tables-panel">
          <div className="panel-header">
            <h2 className="panel-title">Active tables</h2>
            <div className="live-indicator">
              <span className="live-dot"></span>
            </div>
            <button onClick={() => navigate('/tables')} className="view-all-link">
              View All
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
            </div>
          ) : activeTables.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎱</div>
              <p className="empty-title">No active sessions</p>
              <p className="empty-subtitle">All tables are free right now</p>
              <button onClick={() => navigate('/tables')} className="btn-emerald">
                Start a session
              </button>
            </div>
          ) : (
            <div className="active-tables-list">
              {activeTables.map((session) => (
                <div key={session.id} className="active-table-row">
                  <span className="table-pill">{session.table_name}</span>
                  <span className={`game-badge ${getGameTypeBadgeClass(session.game_type)}`}>
                    {session.game_type}
                  </span>
                  <span className="player-name">{session.player_name || 'Guest'}</span>
                  <span className="timer-display">{formatTimer(session.started_at)}</span>
                  <button
                    onClick={() => navigate('/tables')}
                    className="btn-end-session"
                  >
                    End session
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Panel - 40% */}
        <div className="quick-actions-panel">
          <h2 className="panel-title">Quick actions</h2>
          <div className="quick-actions-list">
            <button
              onClick={() => navigate('/tables')}
              className="quick-action-btn emerald"
            >
              <span className="quick-action-icon">+</span>
              <span>Start new session</span>
            </button>
            <button
              onClick={() => navigate('/tables')}
              className="quick-action-btn coral"
            >
              <span className="quick-action-icon">🥤</span>
              <span>Add beverage order</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="quick-action-btn blue"
            >
              <span className="quick-action-icon">📊</span>
              <span>View today's report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="recent-activity-panel">
        <div className="panel-header">
          <h2 className="panel-title">Recent activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <div className="activity-empty">
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-row">
                <span className={`activity-dot ${activity.type}`}></span>
                <p className="activity-message">{activity.message}</p>
                <span className="activity-time">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
