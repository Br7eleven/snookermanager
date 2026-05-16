import { useState, useEffect } from 'react';
import { Download, DollarSign, Users, Trophy, Timer, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../hooks/useToast';
import '../styles/reports.css';

export default function Reports() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState('today');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSessions: 0,
    popularGame: 'Full Ball',
    avgDuration: '0m'
  });
  const [revenueData, setRevenueData] = useState([]);
  const [gameTypeData, setGameTypeData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;

  useEffect(() => {
    loadReportsData();
  }, [activeFilter]);

  const loadReportsData = async () => {
    const result = await window.electron.getReports(activeFilter);
    if (result.success) {
      setStats(result.data.stats);
      setRevenueData(result.data.revenueData);
      setGameTypeData(result.data.gameTypeData);
      setSessions(result.data.sessions);
    }
  };

  const maxRevenue = Math.max(...revenueData.map(d => d.amount), 1);

  const totalSessions = gameTypeData.reduce((sum, g) => sum + g.count, 0);
  const circumference = 2 * Math.PI * 70;

  let offset = 0;
  const segments = gameTypeData.map((game) => {
    const percentage = totalSessions > 0 ? (game.count / totalSessions) * 100 : 0;
    const dashOffset = offset;
    offset += (percentage / 100) * circumference;
    return { ...game, percentage, dashOffset };
  });

  const totalPages = Math.ceil(sessions.length / sessionsPerPage);
  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = sessions.slice(indexOfFirstSession, indexOfLastSession);

  const exportSessions = async () => {
    const result = await window.electron.exportSessionsCSV();
    if (result.success) {
      toast.success('Sessions exported successfully!');
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const exportBusinessReport = async () => {
    const result = await window.electron.exportBusinessReportCSV();
    if (result.success) {
      toast.success('Business report exported successfully!');
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  return (
    <div className="reports-container">
      <div className="performance-section">
          <div className="performance-header">
            <h2>Performance Overview</h2>
            <div className="date-filter-tabs">
              <button
                className={`date-tab ${activeFilter === 'today' ? 'active' : ''}`}
                onClick={() => setActiveFilter('today')}
              >
                Today
              </button>
              <button
                className={`date-tab ${activeFilter === 'week' ? 'active' : ''}`}
                onClick={() => setActiveFilter('week')}
              >
                This week
              </button>
              <button
                className={`date-tab ${activeFilter === 'month' ? 'active' : ''}`}
                onClick={() => setActiveFilter('month')}
              >
                This month
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon revenue">
                <DollarSign />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Revenue</p>
                <h3 className="stat-value">Rs {stats.totalRevenue.toLocaleString()}</h3>
                <p className="stat-change positive">+12%</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon sessions">
                <Users />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Sessions</p>
                <h3 className="stat-value">{stats.totalSessions}</h3>
                <p className="stat-change positive">+8%</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon popular">
                <Trophy />
              </div>
              <div className="stat-content">
                <p className="stat-label">Most Popular Game</p>
                <h3 className="stat-value">{stats.popularGame}</h3>
                <p className="stat-change neutral">--</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon duration">
                <Timer />
              </div>
              <div className="stat-content">
                <p className="stat-label">Avg. Duration</p>
                <h3 className="stat-value">{stats.avgDuration}</h3>
                <p className="stat-change positive">+10%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Revenue by Day (Last 7 Days)</h3>
            </div>
            <div className="bar-chart">
              {revenueData.map((day) => (
                <div key={day.day} className="bar-container">
                  <div
                    className="bar"
                    style={{ height: `${(day.amount / maxRevenue) * 100}%` }}
                    title={`Rs ${day.amount.toLocaleString()}`}
                  />
                  <span className="bar-label">{day.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Sessions by Game Type</h3>
            </div>
            <div className="donut-chart-container">
              <div className="donut-chart">
                <svg width="200" height="200">
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="30"
                  />
                  {segments.map((segment, index) => {
                    const colors = ['#10b981', '#3b82f6', '#f59e0b'];
                    return (
                      <circle
                        key={segment.name}
                        cx="100"
                        cy="100"
                        r="70"
                        fill="none"
                        stroke={colors[index % colors.length]}
                        strokeWidth="30"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - segment.dashOffset}
                        style={{ transition: 'stroke-dashoffset 0.5s' }}
                      />
                    );
                  })}
                </svg>
                <div className="donut-center-label">
                  <div className="donut-center-value">{totalSessions}</div>
                  <div className="donut-center-text">Total</div>
                </div>
              </div>
              <div className="donut-legend">
                {gameTypeData.map((game) => {
                  const percentage = totalSessions > 0 ? Math.round((game.count / totalSessions) * 100) : 0;
                  return (
                    <div key={game.name} className="legend-item">
                      <div className="legend-label">
                        <span className={`legend-dot ${game.name.toLowerCase().replace(' ', '')}`} />
                        <span className="legend-name">{game.name}</span>
                      </div>
                      <span className="legend-percentage">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="session-log-card">
          <div className="session-log-header">
            <h3>Session Log</h3>
            <span className="showing-text">
              Showing {indexOfFirstSession + 1}-{Math.min(indexOfLastSession, sessions.length)} of {sessions.length}
            </span>
          </div>
          {sessions.length === 0 ? (
            <div className="reports-empty-state">
              <BarChart2 size={48} />
              <h3>No sessions yet</h3>
              <p>No sessions have been recorded for this period.</p>
            </div>
          ) : (
          <>
          <table className="session-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Table</th>
                <th>Game</th>
                <th>Player</th>
                <th>Duration</th>
                <th>Cost</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {currentSessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    <div>{format(new Date(session.date), 'MMM dd, yyyy')}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {format(new Date(session.date), 'hh:mm a')}
                    </div>
                  </td>
                  <td>
                    <span className="table-badge">{session.table_name}</span>
                  </td>
                  <td>
                    <span className={`game-badge ${session.game.toLowerCase().replace(' ', '')}`}>
                      <span className="game-badge-dot" />
                      {session.game}
                    </span>
                  </td>
                  <td>{session.player}</td>
                  <td>{session.duration}</td>
                  <td>Rs {session.cost.toFixed(2)}</td>
                  <td style={{ fontWeight: 600 }}>Rs {session.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
          </>
          )}
        </div>

        <div className="export-section">
          <div className="export-card">
            <div className="export-info">
              <div className="export-title">Export Table Status</div>
              <div className="export-subtitle">2 minutes ago</div>
            </div>
            <button className="btn-export" onClick={exportSessions}>
              <Download />
              Export to CSV
            </button>
          </div>
          <div className="export-card">
            <div className="export-info">
              <div className="export-title">Last Business Form</div>
              <div className="export-subtitle">2 minutes ago</div>
            </div>
            <button className="btn-export" onClick={exportBusinessReport}>
              <Download />
              Export to CSV
            </button>
          </div>
        </div>
      </div>
  );
}
